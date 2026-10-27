import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => {
  const nonce = command === 'serve' ? randomBytes(24).toString('base64') : undefined
  return {
    main: {},
    preload: {
      // Sandboxed preloads must be CommonJS, including when the package is ESM.
      build: { rollupOptions: { output: { format: 'cjs', entryFileNames: '[name].cjs' } } }
    },
    renderer: {
      html: { cspNonce: nonce },
      resolve: { alias: { '@': fileURLToPath(new URL('./src/renderer/src', import.meta.url)) } },
      plugins: [
        react(),
        tailwindcss(),
        {
          name: 'phonivra-csp',
          transformIndexHtml: {
            order: 'post',
            handler: (html) => html.replace('__DEV_SCRIPT_NONCE__', nonce ? `'nonce-${nonce}'` : '')
          }
        }
      ],
      server: { host: '127.0.0.1', port: 5173, strictPort: true }
    }
  }
})
