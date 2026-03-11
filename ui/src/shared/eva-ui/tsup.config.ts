import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true, // Enabled — dist/index.d.ts required by consumers (e.g. 44-eva-jp-spark)
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', '@fluentui/react-components', '@fluentui/react-icons', '@eva/gc-design-system'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  tsconfig: './tsconfig.json',
  skipNodeModulesBundle: true,
});
