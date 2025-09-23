import { defineConfig } from 'vite'
export default defineConfig({
  build: { target: 'es2019' },   // belangrijk voor Node14-compat
})
