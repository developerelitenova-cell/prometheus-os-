import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { templateCompilerOptions } from '@tresjs/core'
import path from 'path'
import fs from 'fs'

// Ejecuta las funciones serverless de /api (pensadas para Vercel) dentro del
// propio servidor de desarrollo de Vite, para que `npm run dev` no dependa de
// un backend externo (antes se proxeaba /api a localhost:5001, que no existe).
function vercelApiDevPlugin() {
  return {
    name: 'vercel-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        const fnName = req.url.slice('/api/'.length).split('?')[0].split('/')[0]
        const fnPath = path.resolve(__dirname, 'api', `${fnName}.js`)
        if (!fnName || !fs.existsSync(fnPath)) return next()

        try {
          if (req.method === 'POST' || req.method === 'PUT') {
            const chunks = []
            for await (const chunk of req) chunks.push(chunk)
            const raw = Buffer.concat(chunks).toString('utf-8')
            req.body = raw ? JSON.parse(raw) : {}
          }

          res.status = (code) => {
            res.statusCode = code
            return res
          }
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
          }

          const mod = await server.ssrLoadModule(fnPath)
          await mod.default(req, res)
        } catch (error) {
          console.error(`[api dev] Error en ${fnName}:`, error)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: error.message || 'Error interno' }))
          }
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Las funciones de /api leen process.env (no import.meta.env), así que se
  // cargan aquí las mismas variables que usa el cliente vía Vite.
  const env = loadEnv(mode, process.cwd(), '')
  Object.assign(process.env, env)

  return {
    plugins: [
      vue(templateCompilerOptions), 
      vercelApiDevPlugin()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@locales': path.resolve(__dirname, '../locales')
      }
    },
    server: {
      port: 3000,
      open: true
    }
  }
})
