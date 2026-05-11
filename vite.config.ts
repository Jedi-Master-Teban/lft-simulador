import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // base: '/lft-simulator/', // ← Uncomment this line when deploying inside the Dash/Flask Tool-kit
  // Keep it commented for standalone development (npm run dev)
  plugins: [react(), tailwindcss()],
})
