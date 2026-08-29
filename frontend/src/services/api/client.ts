import axios, { AxiosInstance, AxiosError } from 'axios'
import { auth } from '@/firebase'
import type { ApiError } from '@/types'

const API_URL = (import.meta as any).env.VITE_API_URL || 'https://levelup-new-backend.onrender.com'

export const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,
    timeout: 15000,
  })

  // Request interceptor: Add auth token
  client.interceptors.request.use(
    async (config) => {
      try {
        const token = await auth.currentUser?.getIdToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Failed to get auth token:', error)
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Response interceptor: Handle errors & logging
  client.interceptors.response.use(
    (response) => {
      console.debug(`[${response.config.method?.toUpperCase()}] ${response.config.url} - ${response.status}`)
      return response
    },
    (error: AxiosError<ApiError>) => {
      // Log error
      console.error(
        `[${error.config?.method?.toUpperCase()}] ${error.config?.url}`,
        error.response?.data || error.message
      )

      // Handle specific error codes
      if (error.response?.status === 401) {
        // Unauthorized - redirect to login
        window.location.href = '/login'
      }

      if (error.response?.status === 403) {
        // Forbidden - insufficient permissions
        console.error('Insufficient permissions')
      }

      if (error.response?.status === 429) {
        // Rate limited
        console.error('Rate limit exceeded')
      }

      return Promise.reject(error)
    }
  )

  return client
}

export const apiClient = createApiClient()
