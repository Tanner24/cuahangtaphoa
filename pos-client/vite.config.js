import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/', // Base URL for Vercel (root)
    // base: '/cuahangtaphoa/', // Base URL for GitHub Pages
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                // rewrite: (path) => path.replace(/^\/api/, '') // Backend: app.use('/auth', ...) so /api/auth -> /auth if rewritten? 
                // Backend doesn't prefix with /api. It uses /auth, /admin, /pos.
                // So frontend calls /api/auth -> we need to strip /api
                rewrite: (path) => path.replace(/^\/api/, '')
            }
        }
    }
})
