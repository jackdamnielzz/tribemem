const DEFAULT_BASE_URL = 'https://api.tribemem.ai';

let storedApiKey: string | undefined;

export function setApiKey(apiKey: string): void {
  storedApiKey = apiKey;
}

export function getApiKey(): string {
  if (!storedApiKey) {
    throw new Error('API key not configured. Pass --api-key when starting the server.');
  }
  return storedApiKey;
}

export function getBaseUrl(): string {
  return (process.env.TRIBEMEM_API_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
}

/**
 * Authenticated fetch wrapper that adds the Authorization header
 * and handles common error responses.
 */
export async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const apiKey = getApiKey();
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${apiKey}`);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => 'Unknown error');
    throw new Error(`TribeMem API error (${response.status}): ${body}`);
  }

  return response;
}
