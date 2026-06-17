/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
//
// Proxy de desenvolvimento: o navegador só fala com :5173, e o Vite repassa
// tudo sob /api para a API real em :3000. Isso evita o bloqueio de CORS
// enquanto o backend ainda não habilita CORS (ver memória do projeto).
// Em produção/integração real, basta o backend habilitar CORS e apontar
// VITE_API_BASE para a URL da API.
export default defineConfig({
  plugins: [react()],
  // Garante o runtime JSX automático (React 19) também nos arquivos de teste,
  // que o esbuild transforma sem passar pelo plugin-react.
  esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    // Pool de fork único: evita um crash de IPC do worker pool neste ambiente WSL.
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
  },
})
