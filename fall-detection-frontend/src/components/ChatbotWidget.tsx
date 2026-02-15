import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, ChevronDown, Loader2, MessageCircle, Plus, RefreshCcw, Send, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChatService } from '../services/chatService'
import { ChatMessage, ChatSession, ChatUiRoute } from '../types'

const makeOptimisticUserMessage = (content: string): ChatMessage => ({
  id: `temp-${Date.now()}`,
  role: 'user',
  content,
  createdAt: new Date().toISOString()
})

const sortSessions = (sessions: ChatSession[]) =>
  [...sessions].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())

const stripSuggestedRouteLine = (content: string): string =>
  content
    .replace(/\s*RUTA_SUGERIDA:\s*\/[^\s]+/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

export const ChatbotWidget: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const endRef = useRef<HTMLDivElement | null>(null)
  const hasInitialized = useRef(false)

  const activeSession = useMemo(
    () => sessions.find((session) => session.sessionId === activeSessionId) || null,
    [sessions, activeSessionId]
  )

  const role = (localStorage.getItem('role') || 'MEMBER').toUpperCase()

  const availableRoutes = useMemo<ChatUiRoute[]>(() => {
    if (role === 'ADMIN') {
      return [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Usuarios', path: '/admin/users' },
        { label: 'Pacientes', path: '/admin/patients' },
        { label: 'Dispositivos', path: '/admin/devices' },
        { label: 'Eventos', path: '/admin/events' },
        { label: 'Podium', path: '/admin?tab=podium' }
      ]
    }
    return [
      { label: 'Mi Proteccion', path: '/my-protection' },
      { label: 'Eventos', path: '/member/events' }
    ]
  }, [role])

  const quickActions = useMemo(() => availableRoutes.slice(0, 4), [availableRoutes])

  const extractSuggestedRoute = (content: string): string | null => {
    const match = content.match(/RUTA_SUGERIDA:\s*(\/[^\s]+)/i)
    if (!match?.[1]) return null
    const candidate = match[1].trim()
    return availableRoutes.some((route) => route.path === candidate) ? candidate : null
  }

  useEffect(() => {
    if (!isOpen) return
    if (hasInitialized.current) return
    hasInitialized.current = true
    void initializeChat()
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [isOpen, messages, sending])

  const initializeChat = async () => {
    setLoadingSessions(true)
    setError(null)
    try {
      const response = await ChatService.getSessions()
      const ordered = sortSessions(response.data)
      setSessions(ordered)
      if (ordered.length > 0) {
        await selectSession(ordered[0].sessionId)
      } else {
        setActiveSessionId(null)
        setMessages([])
      }
    } catch (loadError: any) {
      console.error('Error cargando sesiones del chatbot:', loadError)
      setError(loadError?.response?.data?.error || 'No se pudo cargar el chat.')
    } finally {
      setLoadingSessions(false)
    }
  }

  const upsertSession = (session: ChatSession) => {
    setSessions((previous) => {
      const withoutCurrent = previous.filter((item) => item.sessionId !== session.sessionId)
      return sortSessions([session, ...withoutCurrent])
    })
  }

  const selectSession = async (sessionId: string) => {
    setLoadingMessages(true)
    setError(null)
    try {
      const response = await ChatService.getMessages(sessionId)
      setActiveSessionId(response.data.session.sessionId)
      upsertSession(response.data.session)
      setMessages(response.data.messages || [])
    } catch (loadError: any) {
      console.error('Error cargando mensajes del chatbot:', loadError)
      setError(loadError?.response?.data?.error || 'No se pudo cargar la conversacion.')
    } finally {
      setLoadingMessages(false)
    }
  }

  const createSession = async () => {
    setError(null)
    try {
      const response = await ChatService.createSession()
      upsertSession(response.data)
      setActiveSessionId(response.data.sessionId)
      setMessages([])
    } catch (createError: any) {
      console.error('Error creando sesion del chatbot:', createError)
      setError(createError?.response?.data?.error || 'No se pudo crear la sesion.')
    }
  }

  const handleSend = async () => {
    const message = input.trim()
    if (!message || sending) return

    setError(null)
    setInput('')
    const optimistic = makeOptimisticUserMessage(message)
    setMessages((previous) => [...previous, optimistic])
    setSending(true)

    try {
      const uiContext = {
        currentPath: `${location.pathname}${location.search || ''}`,
        availableRoutes
      }
      const response = await ChatService.sendMessage(message, activeSessionId || undefined, uiContext)
      const session = response.data.session
      upsertSession(session)
      setActiveSessionId(session.sessionId)
      setMessages(response.data.messages || [])
    } catch (sendError: any) {
      console.error('Error enviando mensaje al chatbot:', sendError)
      setError(sendError?.response?.data?.error || 'No se pudo enviar el mensaje.')
      setMessages((previous) => previous.filter((item) => item.id !== optimistic.id))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed right-6 bottom-6 z-[90]">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-[#6366F1] to-[#7C83FF] shadow-xl shadow-[#6366F1]/35 text-white flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Abrir chatbot"
        >
          <MessageCircle size={24} />
        </button>
      ) : (
        <div className="w-[380px] max-w-[calc(100vw-2rem)] h-[720px] max-h-[calc(100vh-1rem)] glass-panel border border-white/10 flex flex-col overflow-hidden">
          <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3 bg-[#11161d]/70">
            <div className="flex items-center gap-2 min-w-0">
              <Bot size={18} className="text-[#6366F1]" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">Asistente inteligente</p>
                <p className="text-xs text-[#94A3B8] truncate">{activeSession?.title || 'Sin sesion activa'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void initializeChat()}
                className="p-1.5 rounded-md text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
                title="Recargar sesiones"
              >
                <RefreshCcw size={15} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Cerrar chatbot"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={activeSessionId || ''}
                onChange={(e) => {
                  const selected = e.target.value
                  if (selected) {
                    void selectSession(selected)
                  }
                }}
                className="w-full bg-[#1A1F26] border border-white/10 rounded-lg pl-3 pr-9 py-2 text-sm text-white outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Selecciona sesion
                </option>
                {sessions.map((session) => (
                  <option key={session.sessionId} value={session.sessionId}>
                    {session.title}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
              />
            </div>

            <button
              onClick={() => void createSession()}
              className="p-2 rounded-lg bg-[#6366F1]/20 hover:bg-[#6366F1]/30 text-[#C7D2FE] transition-colors border border-[#6366F1]/30"
              title="Nueva sesion"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {loadingSessions || loadingMessages ? (
              <div className="h-full flex items-center justify-center text-[#94A3B8]">
                <Loader2 className="animate-spin mr-2" size={18} />
                Cargando chat...
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-[#94A3B8] text-sm px-4">
                Escribe tu primera pregunta para empezar una conversacion.
              </div>
            ) : (
              messages.map((message) => {
                const suggestedRoute = message.role === 'assistant' ? extractSuggestedRoute(message.content) : null
                const messageContent =
                  message.role === 'assistant' ? stripSuggestedRouteLine(message.content) : message.content
                const hasVisibleContent = Boolean(messageContent)
                return (
                  <div key={message.id} className={message.role === 'user' ? 'ml-auto max-w-[85%]' : 'mr-auto max-w-[85%]'}>
                    {hasVisibleContent && (
                      <div
                        className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                          message.role === 'user'
                            ? 'bg-[#6366F1] text-white'
                            : 'bg-[#1A1F26] border border-white/10 text-[#E2E8F0]'
                        }`}
                      >
                        {messageContent}
                      </div>
                    )}
                    {suggestedRoute && (
                      <button
                        onClick={() => navigate(suggestedRoute)}
                        className="mt-1 text-xs px-2 py-1 rounded-md bg-[#6366F1]/20 text-[#C7D2FE] border border-[#6366F1]/35 hover:bg-[#6366F1]/30 transition-colors"
                      >
                        Ir a {suggestedRoute}
                      </button>
                    )}
                  </div>
                )
              })
            )}

            {sending && (
              <div className="mr-auto bg-[#1A1F26] border border-white/10 text-[#E2E8F0] rounded-2xl px-3 py-2 text-sm inline-flex items-center gap-2">
                <Loader2 className="animate-spin" size={14} />
                Pensando...
              </div>
            )}

            <div ref={endRef} />
          </div>

          {error && <p className="px-4 pb-2 text-xs text-red-400">{error}</p>}

          <div className="px-3 pt-2 pb-1 border-t border-white/10">
            <p className="text-[11px] text-[#94A3B8] mb-2">Accesos rapidos</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="text-xs px-2 py-1 rounded-md bg-[#6366F1]/15 hover:bg-[#6366F1]/25 text-[#C7D2FE] border border-[#6366F1]/30 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <footer className="border-t border-white/10 p-3 flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
              rows={2}
              placeholder="Pregunta algo sobre tus pacientes o eventos..."
              className="flex-1 bg-[#1A1F26] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
            />
            <button
              onClick={() => void handleSend()}
              disabled={sending || !input.trim()}
              className="w-10 h-10 rounded-xl bg-[#6366F1] hover:bg-[#5558DD] disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center"
              aria-label="Enviar mensaje"
            >
              <Send size={16} />
            </button>
          </footer>
        </div>
      )}
    </div>
  )
}
