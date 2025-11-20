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

  // En desarrollo local (Vite): usa localhost:3000
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000'
  }

  // En producción: usa /api (proxy a través de Nginx)
  // Si accedes desde una IP o dominio, el backend estará en /api
  return `${protocol}//${hostname}/api`
}

const API_BASE_URL = getApiBaseUrl()

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken')
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

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
        ...getAuthHeaders(),
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
      headers: {
        ...headers,
        ...getAuthHeaders(),
      },
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
        ...getAuthHeaders(),
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
        ...getAuthHeaders(),
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
        ...getAuthHeaders(),
      },
    })
    return handleResponse<T>(response)
  },

  async downloadFile(endpoint: string): Promise<{ blob: Blob; filename: string }> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...getAuthHeaders(),
      },
    })
    if (!response.ok) {
      throw new ApiError('Error al descargar el archivo')
    }

    // Extraer nombre del archivo del header Content-Disposition
    const contentDisposition = response.headers.get('content-disposition')
    let filename = 'comprobante'
    if (contentDisposition) {
      // Intenta con comillas primero: filename="nombre.ext"
      let match = contentDisposition.match(/filename="([^"]+)"/)
      if (match && match[1]) {
        filename = match[1]
      } else {
        // Intenta sin comillas: filename=nombre.ext
        match = contentDisposition.match(/filename=([^;\s]+)/)
        if (match && match[1]) {
          filename = match[1]
        }
      }
    }

    const blob = await response.blob()
    return { blob, filename }
  },
}
