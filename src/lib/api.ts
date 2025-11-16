import type { ApiResponse } from '@/types/api'

// Detectar automáticamente la URL del backend basándose en el hostname actual
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  const hostname = window.location.hostname
  const protocol = window.location.protocol

  // Si está en DevTunnel, usa el mismo dominio sin puerto
  if (hostname.includes('devtunnels.ms')) {
    return `${protocol}//${hostname}`
  }

  // Si accedes desde localhost, usa localhost:3000
  // Si accedes desde una IP (ej: 192.168.40.15), usa esa IP:3000
  return `http://${hostname}:3000`
}

const API_BASE_URL = getApiBaseUrl()

export class ApiError extends Error {
  public code?: string
  public details?: unknown

  constructor(message: string, code?: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data: ApiResponse<T> = await response.json()

  if (!data.success || !response.ok) {
    throw new ApiError(data.error?.message || 'Error en la petición', data.error?.code, data.error?.details)
  }

  return data.data as T
}

export const api = {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include', // Important for cookies
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return handleResponse<T>(response)
  },

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    const isFormData = body instanceof FormData
    const headers: Record<string, string> = isFormData ? {} : { 'Content-Type': 'application/json' }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      credentials: 'include', // Important for cookies
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
  },

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
  },

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(response)
  },

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return handleResponse<T>(response)
  },
}
