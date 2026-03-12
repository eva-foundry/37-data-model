import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@context': path.resolve(__dirname, './src/context'),
      '@api': path.resolve(__dirname, './src/api'),
      '@eva/data-model-ui': path.resolve(__dirname, './src/lib/views'),
      '@eva/templates': path.resolve(__dirname, './src/lib/templates-stub'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
