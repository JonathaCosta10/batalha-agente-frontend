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
        // Todo o /api/v1 do Django local (conversas/ e i-agora/). DJANGO_URL troca o alvo
        // (ex.: http://127.0.0.1:8001). A origem do Vite tem de estar em IAGORA_DEV_ORIGINS
        // do Django, senão o POST cai no CSRF (403). Ver docs/ambientes/variaveis-de-ambiente.md.
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
