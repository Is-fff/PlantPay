import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 部署：仓库名为 PlantPay，所以 base 设置为 '/PlantPay/'
  // 如果你的仓库名不是 PlantPay，请修改为对应的仓库名
  base: '/PlantPay/',
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})
