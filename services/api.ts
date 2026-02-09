// Função auxiliar para obter headers com autenticação
// Helper function to get headers with authentication
function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  // Adiciona token de autenticação se configurado
  // Add authentication token if configured
  const token = import.meta.env.VITE_API_TOKEN;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return headers;
}

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Erro na API: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function apiPost<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Erro na API: ${res.status} ${res.statusText}`);
  return res.json();
}
