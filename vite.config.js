import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'

export default defineConfig(({ command }) => ({
  // GitHub Pages 项目站：https://apioz.github.io/YuYi/
  base: command === 'serve' ? '/' : '/YuYi/',
  plugins: [
    vue(),
    {
      name: 'gh-pages-spa-fallback',
      closeBundle() {
        if (command === 'build') {
          const indexPath = path.resolve(__dirname, 'dist/index.html')
          fs.copyFileSync(indexPath, path.resolve(__dirname, 'dist/404.html'))
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5190,
    strictPort: true
  }
}))
