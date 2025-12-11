import { onCLS, onLCP, onINP, onFCP, onTTFB } from 'web-vitals'

const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
    if (onPerfEntry && onPerfEntry instanceof Function) {
        onCLS(onPerfEntry)
        onFID(onPerfEntry)
        onLCP(onPerfEntry)
        onINP(onPerfEntry)
        onFCP(onPerfEntry)
        onTTFB(onPerfEntry)
    }
}

export default reportWebVitals
