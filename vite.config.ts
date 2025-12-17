
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Shim process.env for existing code compatibility
      // Prioritize API_KEY, fallback to VITE_API_KEY (standard Vite), then empty string
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || '')
    },
  };
});
