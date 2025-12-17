import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import reportWebVitals from './reportWebVitals'

import { PostHogProvider } from 'posthog-js/react'

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY || 'phc_B77mcYC1EycR6bKLgSNzjM9aaeiWXhoeizyriFIxWf2'}
      options={options}
    >
      <App />
    </PostHogProvider>
  </StrictMode>
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
reportWebVitals((metric: any) => {
  console.log({ ...metric, path: window.location.pathname })
})
