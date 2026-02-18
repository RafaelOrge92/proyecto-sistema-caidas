import axios from 'axios'
import { ChatMessage, ChatSession, ChatUiContext } from '../types'
import { API_URL } from '../config/api'

const CHAT_API_URL = `${API_URL}/chat`

const api = axios.create({
  baseURL: CHAT_API_URL
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const ChatService = {
  getSessions: async () => {
    const response = await api.get<ChatSession[]>('/sessions')
    return { data: response.data }
  },

  createSession: async (title?: string) => {
    const response = await api.post<ChatSession>('/sessions', { title })
    return { data: response.data }
  },

  getMessages: async (sessionId: string) => {
    const response = await api.get<{ session: ChatSession; messages: ChatMessage[] }>(`/sessions/${sessionId}/messages`)
    return { data: response.data }
  },

  sendMessage: async (message: string, sessionId?: string, uiContext?: ChatUiContext) => {
    const response = await api.post<{ session: ChatSession; message: ChatMessage; messages: ChatMessage[] }>('/message', {
      message,
      sessionId,
      uiContext
    })
    return { data: response.data }
  }
}
