import React, { type ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './ErrorBoundary.css'

interface Props {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
  onError?: (error: Error) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

declare const process: { env: { NODE_ENV: string } }

/**
 * Error Boundary component para capturar errores en React
 * Uso: <ErrorBoundary><YourComponent /></ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error)
    this.props.onError?.(error)

    // Logging a error tracking service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Enviar a servicio de logging
      // logErrorToService(error)
    }
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        this.props.fallback?.(this.state.error, this.retry) || (
          <DefaultErrorFallback error={this.state.error} retry={this.retry} />
        )
      )
    }

    return this.props.children
  }
}

/**
 * Default fallback UI para errores
 */
function DefaultErrorFallback({
  error,
  retry,
}: {
  error: Error
  retry: () => void
}) {
  const navigate = useNavigate()

  return (
    <div className="error-boundary-container">
      <div className="error-boundary-content">
        <AlertCircle className="error-boundary-icon" />

        <h1>Algo salió mal</h1>
        <p className="error-boundary-message">
          Disculpa, hemos encontrado un error inesperado.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="error-boundary-details">
            <summary>Detalles técnicos</summary>
            <pre>{error.message}</pre>
            <pre>{error.stack}</pre>
          </details>
        )}

        <div className="error-boundary-actions">
          <button onClick={retry} className="error-boundary-btn primary">
            <RefreshCw size={18} />
            Reintentar
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="error-boundary-btn secondary"
          >
            <Home size={18} />
            Ir a inicio
          </button>
        </div>

        <p className="error-boundary-footer">
          Si el problema persiste, contacta con soporte
        </p>
      </div>
    </div>
  )
}
