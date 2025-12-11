import { onCLS, onLCP, onINP, onFCP, onTTFB, type Metric } from 'web-vitals'

const reportWebVitals = (onPerfEntry?: (metric: Metric) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry)

    onLCP(onPerfEntry)
    onINP(onPerfEntry)
    onFCP(onPerfEntry)
    onTTFB(onPerfEntry)
  }
}

export default reportWebVitals
