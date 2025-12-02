import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente baseadas no modo atual (development/production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    
    // Define variáveis globais acessíveis no código do frontend (necessário para a IA do Google)
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // Fallback caso usem o nome direto da variável
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'), // Permite importar usando @/components...
      },
    },

    server: {
      port: 3000, // Porta do Frontend
      host: '0.0.0.0', // Permite acesso externo na rede
      
      // Proxy para redirecionar chamadas /api para o backend
      proxy: {
        '/api': {
          target: 'http://localhost:3001', // Endereço do seu Backend
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
