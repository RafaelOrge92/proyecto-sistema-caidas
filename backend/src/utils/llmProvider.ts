export type LlmRole = 'system' | 'user' | 'assistant'

export interface LlmChatMessage {
  role: LlmRole
  content: string
}

export interface LlmResult {
  text: string
  provider: 'groq' | 'huggingface'
  model: string
}

const trimAssistantReply = (text: unknown): string => {
  if (typeof text !== 'string') return ''
  return text.trim().replace(/\s{3,}/g, '\n\n')
}

const callGroq = async (messages: LlmChatMessage[]): Promise<LlmResult> => {
  const apiKey = process.env.GROQ_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('GROQ_API_KEY no configurada')
  }

  const model = process.env.GROQ_MODEL?.trim() || 'llama-3.1-8b-instant'

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 700,
      messages
    })
  })

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(`Groq error ${response.status}: ${payload}`)
  }

  const payload: any = await response.json()
  const text = trimAssistantReply(payload?.choices?.[0]?.message?.content)

  if (!text) {
    throw new Error('Groq no devolvio contenido')
  }

  return {
    text,
    provider: 'groq',
    model
  }
}

const buildHfPrompt = (messages: LlmChatMessage[]): string => {
  const lines = messages.map((message) => {
    if (message.role === 'system') return `Sistema: ${message.content}`
    if (message.role === 'assistant') return `Asistente: ${message.content}`
    return `Usuario: ${message.content}`
  })
  lines.push('Asistente:')
  return lines.join('\n\n')
}

const callHuggingFace = async (messages: LlmChatMessage[]): Promise<LlmResult> => {
  const apiKey = process.env.HF_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('HF_API_KEY no configurada')
  }

  const model = process.env.HF_MODEL?.trim() || 'meta-llama/Llama-3.1-8B-Instruct'

  const openAiCompatibleResponse = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 700,
      messages
    })
  })

  if (openAiCompatibleResponse.ok) {
    const payload: any = await openAiCompatibleResponse.json()
    const text = trimAssistantReply(payload?.choices?.[0]?.message?.content)
    if (text) {
      return {
        text,
        provider: 'huggingface',
        model
      }
    }
  }

  // Fallback al endpoint de inferencia tradicional
  const fallbackResponse = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: buildHfPrompt(messages),
      parameters: {
        max_new_tokens: 700,
        temperature: 0.2,
        return_full_text: false
      }
    })
  })

  if (!fallbackResponse.ok) {
    const payload = await fallbackResponse.text()
    throw new Error(`HuggingFace error ${fallbackResponse.status}: ${payload}`)
  }

  const payload: any = await fallbackResponse.json()
  const text = trimAssistantReply(payload?.[0]?.generated_text ?? payload?.generated_text)
  if (!text) {
    throw new Error('HuggingFace no devolvio contenido')
  }

  return {
    text,
    provider: 'huggingface',
    model
  }
}

export const generateChatReply = async (messages: LlmChatMessage[]): Promise<LlmResult> => {
  const providerPreference = (process.env.CHAT_PROVIDER || 'groq').toLowerCase()
  const providers = providerPreference === 'huggingface'
    ? (['huggingface', 'groq'] as const)
    : (['groq', 'huggingface'] as const)

  const errors: string[] = []

  for (const provider of providers) {
    try {
      if (provider === 'groq') {
        return await callGroq(messages)
      }
      return await callHuggingFace(messages)
    } catch (error: any) {
      errors.push(`${provider}: ${error?.message || String(error)}`)
    }
  }

  throw new Error(`No fue posible obtener respuesta del LLM. ${errors.join(' | ')}`)
}
