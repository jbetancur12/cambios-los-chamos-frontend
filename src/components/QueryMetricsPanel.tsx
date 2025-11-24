import { useQueryMonitor } from '@/hooks/useQueryMonitor'
import { useState } from 'react'
import './QueryMetricsPanel.css'

declare const process: { env: { NODE_ENV: string } }

/**
 * Panel DevTools para visualizar métricas de queries en tiempo real
 * Solo aparece en desarrollo (NODE_ENV === 'development')
 *
 * Usa: <QueryMetricsPanel /> en App.tsx
 */
export function QueryMetricsPanel() {
  const { getMetrics, resetMetrics } = useQueryMonitor()
  const [visible, setVisible] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const metrics = getMetrics()
  const overfetched = metrics.filter((m) => m.callCount > 5)

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="query-metrics-toggle"
        title="Abrir panel de métricas de queries"
      >
        📊 Metrics
        {overfetched.length > 0 && <span className="query-metrics-badge">{overfetched.length}</span>}
      </button>
    )
  }

  return (
    <div className="query-metrics-panel">
      <div className="query-metrics-header">
        <div>
          <strong>Query Metrics</strong>
          <span className="query-metrics-count">({metrics.length} queries)</span>
        </div>
        <div className="query-metrics-controls">
          <label>
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            Auto
          </label>
          <button onClick={() => resetMetrics()} className="query-metrics-reset-btn" title="Limpiar todas las métricas">
            🔄
          </button>
          <button onClick={() => setVisible(false)} className="query-metrics-close-btn" title="Cerrar panel">
            ✕
          </button>
        </div>
      </div>

      <div className="query-metrics-body">
        {metrics.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#888' }}>No hay queries registradas</div>
        ) : (
          metrics.map((metric, idx) => (
            <div
              key={metric.queryKey + idx}
              className={`query-metrics-item ${metric.callCount > 5 ? 'overfetched' : ''}`}
            >
              <div className="query-metrics-key">{metric.queryKey.substring(0, 80)}...</div>
              <div className="query-metrics-info">
                <span className="query-metrics-label">Calls:</span>
                <span className="query-metrics-value">{metric.callCount}</span>

                {metric.dataSize && (
                  <>
                    <span className="query-metrics-label">Size:</span>
                    <span className="query-metrics-value">{(metric.dataSize / 1024).toFixed(2)}KB</span>
                  </>
                )}

                <span className="query-metrics-label">Last:</span>
                <span className="query-metrics-value">{metric.lastCallTime.toLocaleTimeString()}</span>
              </div>

              {metric.callCount > 5 && <div className="query-metrics-warning">⚠️ Overfetching detectado</div>}
            </div>
          ))
        )}
      </div>

      <div className="query-metrics-footer">
        <div style={{ fontSize: '12px', color: '#888' }}>
          {overfetched.length > 0 && (
            <strong style={{ color: '#ff6b6b' }}>{overfetched.length} query(ies) ejecutada(s) &gt;5 veces</strong>
          )}
        </div>
      </div>
    </div>
  )
}
