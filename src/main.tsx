import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import { PermissionProvider } from './context/PermissionContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PermissionProvider>
      <App />
    </PermissionProvider>
  </StrictMode>,
)
