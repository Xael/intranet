// FIX: Manually define types for import.meta.env as the /// <reference> directive for 'vite/client' was failing.
declare global {
    interface ImportMeta {
        readonly env: {
            readonly VITE_API_URL?: string;
            readonly PROD: boolean;
        };
    }
}

const getApiBaseUrl = (): string => {
    // Prioridade 1: Usar uma variável de ambiente explícita, se definida.
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // Prioridade 2: Em produção, derivar a URL do hostname.
    if (import.meta.env.PROD && !window.location.hostname.includes('localhost')) {
        // Assume que o backend está em um subdomínio similar, com 'node' no final do nome do serviço.
        // Ex: 'app.domain.com' -> 'appnode.domain.com'
        const currentHost = window.location.hostname;
        const parts = currentHost.split('.');
        // 'intranet-intranet' se torna 'intranet-intranetnode'
        parts[0] = `${parts[0]}node`; 
        const backendHost = parts.join('.');
        return `https://${backendHost}`;
    }

    // Prioridade 3: Fallback para o ambiente de desenvolvimento.
    return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

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
      if (response.status === 401 || response.status === 403) {
        // Deslogar o usuário em caso de token inválido ou expirado.
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        window.location.href = '/';
      }
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }
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
