import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
      // globalModulePaths: [/index\.module\.scss/]
    }
  },
  build: {
    minify: "terser",
    terserOptions: {
      sourceMap: true
    },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom']
        }
      },
      plugins: [
        {
          name: 'disable-treeshake',
          transform(_code, id) {
              if (id.includes("index.module.scss")) {
                  return { moduleSideEffects: 'no-treeshake' };
              }
          },
      }
      ],
    },
  }
})

