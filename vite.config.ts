
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // 브라우저에서 'process is not defined' 에러가 나는 것을 방지하기 위해 구체적인 경로를 치환합니다.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  }
});
