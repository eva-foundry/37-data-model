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
      // @eva/templates resolves to built package in 31-eva-faces workspace
      '@eva/templates': path.resolve(__dirname, '../../31-eva-faces/shared/eva-templates/dist/index.mjs'),
      // @eva/ui stub for dev/test (semantic HTML components)
      '@eva/ui': path.resolve(__dirname, './src/__stubs__/eva-ui.tsx'),
      // @eva/gc-design-system stub (GCThemeProvider renders children transparently)
      '@eva/gc-design-system': path.resolve(__dirname, './src/__stubs__/gc-design-system.tsx'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
