import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

const savedTheme = localStorage.getItem('asrama_theme')
const initialTheme = savedTheme === 'light' || savedTheme === 'dark'
  ? savedTheme
  : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
document.documentElement.dataset.theme = initialTheme

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
