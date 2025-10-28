// FIX: Manually define types for import.meta.env as the /// <reference> directive for 'vite/client' was failing.
declare global {
    interface ImportMeta {
        readonly env: {
            readonly VITE_API_URL?: string;
        };
    }
}

// Define a URL base da sua API.
// Em produção, isso virá de uma variável de ambiente injetada pelo processo de build.
// Em desenvolvimento, ele usará o valor padrão.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!response.ok) {
      // Se o status for 401 ou 403, pode ser um token expirado.
      if (response.status === 401 || response.status === 403) {
        // Opcional: Deslogar o usuário automaticamente.
        // window.location.href = '/login'; // Força o redirecionamento
      }
      // Tenta extrair uma mensagem de erro do corpo da resposta
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }
    // Se a resposta não tiver corpo (ex: status 204), retorna null.
    if (response.status === 204) {
      return null;
    }
    return response.json();
  } catch (error) {
    console.error(`API call failed: ${(error as Error).message}`);
    throw error;
  }
};

export const api = {
  getBaseUrl: () => API_BASE_URL,
  get: (endpoint: string) => request(endpoint),
  post: (endpoint: string, body: any) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint: string, body: any) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
};
