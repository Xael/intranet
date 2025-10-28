const API_BASE_URL = 'https://intranet-intranetnode.dke42d.easypanel.host/';

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
    const url = `${API_BASE_URL.replace(/\/$/, '')}${endpoint}`;
    const response = await fetch(url, config);
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
