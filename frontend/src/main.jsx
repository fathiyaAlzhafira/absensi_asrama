import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { ThemeProvider, resolveThemeForUser } from './context/ThemeContext.jsx'

let storedUser = null
try {
  const raw = localStorage.getItem('asrama_auth_user')
  storedUser = raw ? JSON.parse(raw) : null
} catch {
  storedUser = null
}
document.documentElement.dataset.theme = resolveThemeForUser(storedUser)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
