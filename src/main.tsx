import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import reportWebVitals from './reportWebVitals'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
reportWebVitals((metric: any) => {
  console.log(metric)
})
