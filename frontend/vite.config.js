import { spawn } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backendRoot = path.resolve(__dirname, '..')

function checkPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(600)
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
    socket.connect(port, host)
  })
}

function cakePhpAutoStartPlugin() {
  let phpProcess = null

  return {
    name: 'cakephp-auto-start',
    configureServer(server) {
      checkPortInUse(8765, '127.0.0.1').then((inUse) => {
        if (inUse || phpProcess) return

        phpProcess = spawn(
          'php',
          ['-S', '127.0.0.1:8765', '-t', 'webroot', 'webroot/index.php'],
          {
            cwd: backendRoot,
            stdio: 'ignore',
            windowsHide: true,
          }
        )

        phpProcess.on('error', (err) => {
          console.error('[Backend CakePHP] Gagal menjalankan PHP secara otomatis:', err.message)
        })

        phpProcess.on('exit', () => {
          phpProcess = null
        })

        console.log('  ➜  Backend: http://127.0.0.1:8765/ (CakePHP otomatis berjalan)')
      })

      server.httpServer?.once('close', () => {
        if (phpProcess) {
          phpProcess.kill()
          phpProcess = null
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cakePhpAutoStartPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
