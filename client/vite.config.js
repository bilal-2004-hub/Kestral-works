import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Dev-time proxy so the frontend calls /api directly with no CORS juggling.
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        proxyTimeout: 30000,
        timeout: 30000,
        configure: (proxy) => {
          proxy.on('error', (err, req) => {
            console.error(`[vite proxy error] ${req.method} ${req.url} →`, err.message);
          });
        },
      },
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true, proxyTimeout: 30000, timeout: 30000 },
      '/socket.io': { target: 'http://localhost:5000', ws: true, proxyTimeout: 30000, timeout: 30000 },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        // Keep vendor code in its own long-cached chunk.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
});
