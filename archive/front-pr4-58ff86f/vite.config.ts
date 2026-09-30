import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        // Todo o /api/v1 do Django (cliente, chat, e-agora, context-agent, usuario-real).
        // DJANGO_URL troca o alvo (ex.: http://127.0.0.1:8001 se a 8000 estiver ocupada).
        // Contrato: backend-agente-conversacional/docs/contrato-api-frontend.md
        '/api/v1': process.env.DJANGO_URL || 'http://127.0.0.1:8000',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
