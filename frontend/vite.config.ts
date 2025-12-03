import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { copyFileSync } from 'fs'

// Plugin para copiar _headers al build
const copyHeadersPlugin = () => ({
  name: 'copy-headers',
  closeBundle() {
    try {
      copyFileSync(path.resolve(__dirname, '_headers'), path.resolve(__dirname, 'dist/_headers'))
      console.log('✓ Copied _headers to dist/')
    } catch (error) {
      console.warn('Warning: Could not copy _headers file:', error)
    }
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyHeadersPlugin()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: [
      'src/**/*.test.{ts,tsx}',
      'functions/**/*.test.{ts,tsx,js}',
      '../shared/**/*.test.{ts,tsx}',
    ],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
})
