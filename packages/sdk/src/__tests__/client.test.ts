import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TribeMemClient } from '../client';
import { TribeMemError, ApiError, AuthenticationError, NotFoundError, NetworkError } from '../errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockFetch(status: number, body: unknown, headers?: Record<string, string>) {
  return vi.fn<Parameters<typeof fetch>, ReturnType<typeof fetch>>().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(body),
    headers: new Headers(headers ?? {}),
  } as Response);
}

const TEST_API_KEY = 'tm_live_abcdefghijklmnopqrstuvwxyz012345678901';
const TEST_BASE_URL = 'https://api.test.tribemem.ai';

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe('TribeMemClient constructor', () => {
  it('throws when apiKey is missing', () => {
    expect(() => new TribeMemClient({ apiKey: '' })).toThrow(TribeMemError);
  });

  it('creates a client with valid config', () => {
    const client = new TribeMemClient({
      apiKey: TEST_API_KEY,
      baseUrl: TEST_BASE_URL,
      fetch: createMockFetch(200, {}),
    });
    expect(client).toBeInstanceOf(TribeMemClient);
  });

  it('strips trailing slashes from baseUrl', () => {
    const mockFetch = createMockFetch(200, { data: [], pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 } });
    const client = new TribeMemClient({
      apiKey: TEST_API_KEY,
      baseUrl: 'https://api.test.tribemem.ai///',
      fetch: mockFetch,
    });
    client.listKnowledge();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/^https:\/\/api\.test\.tribemem\.ai\/v1\//),
      expect.anything(),
    );
  });
});

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

describe('TribeMemClient API methods', () => {
  let mockFetch: ReturnType<typeof createMockFetch>;
  let client: TribeMemClient;

  beforeEach(() => {
    mockFetch = createMockFetch(200, { data: [], pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 } });
    client = new TribeMemClient({
      apiKey: TEST_API_KEY,
      baseUrl: TEST_BASE_URL,
      fetch: mockFetch,
    });
  });

  it('sends Authorization header on listKnowledge', async () => {
    await client.listKnowledge();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TEST_API_KEY}`,
        }),
      }),
    );
  });

  it('calls the correct URL for getKnowledge', async () => {
    mockFetch = createMockFetch(200, { id: '123', title: 'test' });
    client = new TribeMemClient({ apiKey: TEST_API_KEY, baseUrl: TEST_BASE_URL, fetch: mockFetch });
    await client.getKnowledge('abc-123');
    expect(mockFetch).toHaveBeenCalledWith(
      `${TEST_BASE_URL}/v1/knowledge/abc-123`,
      expect.anything(),
    );
  });

  it('calls query endpoint with POST', async () => {
    mockFetch = createMockFetch(200, { results: [], answer: 'test' });
    client = new TribeMemClient({ apiKey: TEST_API_KEY, baseUrl: TEST_BASE_URL, fetch: mockFetch });
    await client.query({ query: 'How do we deploy?' });
    expect(mockFetch).toHaveBeenCalledWith(
      `${TEST_BASE_URL}/v1/query`,
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('How do we deploy?'),
      }),
    );
  });

  it('calls listConnectors endpoint', async () => {
    mockFetch = createMockFetch(200, []);
    client = new TribeMemClient({ apiKey: TEST_API_KEY, baseUrl: TEST_BASE_URL, fetch: mockFetch });
    await client.listConnectors();
    expect(mockFetch).toHaveBeenCalledWith(
      `${TEST_BASE_URL}/v1/connectors`,
      expect.anything(),
    );
  });

  it('calls getOrg endpoint', async () => {
    mockFetch = createMockFetch(200, { id: 'org-1', name: 'Test Org' });
    client = new TribeMemClient({ apiKey: TEST_API_KEY, baseUrl: TEST_BASE_URL, fetch: mockFetch });
    await client.getOrg();
    expect(mockFetch).toHaveBeenCalledWith(
      `${TEST_BASE_URL}/v1/org`,
      expect.anything(),
    );
  });

  it('calls listEntities with query params', async () => {
    await client.listEntities({ type: 'person', search: 'Alice', page: 2 });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('type=person');
    expect(url).toContain('search=Alice');
    expect(url).toContain('page=2');
  });

  it('calls listAlerts with query params', async () => {
    await client.listAlerts({ severity: 'high', status: 'open' });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('severity=high');
    expect(url).toContain('status=open');
  });

  it('calls resolveAlert with POST', async () => {
    mockFetch = createMockFetch(204, undefined);
    client = new TribeMemClient({ apiKey: TEST_API_KEY, baseUrl: TEST_BASE_URL, fetch: mockFetch });
    await client.resolveAlert('alert-1');
    expect(mockFetch).toHaveBeenCalledWith(
      `${TEST_BASE_URL}/v1/alerts/alert-1/resolve`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('calls revokeApiKey with DELETE', async () => {
    mockFetch = createMockFetch(204, undefined);
    client = new TribeMemClient({ apiKey: TEST_API_KEY, baseUrl: TEST_BASE_URL, fetch: mockFetch });
    await client.revokeApiKey('key-1');
    expect(mockFetch).toHaveBeenCalledWith(
      `${TEST_BASE_URL}/v1/api-keys/key-1`,
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe('TribeMemClient error handling', () => {
  it('throws AuthenticationError on 401', async () => {
    const mockFetch = createMockFetch(401, { error: 'unauthorized', message: 'Invalid API key', status: 401 });
    const client = new TribeMemClient({ apiKey: TEST_API_KEY, baseUrl: TEST_BASE_URL, fetch: mockFetch });
    await expect(client.getOrg()).rejects.toThrow(AuthenticationError);
  });

  it('throws NotFoundError on 404', async () => {
    const mockFetch = createMockFetch(404, { error: 'not_found', message: 'Not found', status: 404 });
    const client = new TribeMemClient({ apiKey: TEST_API_KEY, baseUrl: TEST_BASE_URL, fetch: mockFetch });
    await expect(client.getKnowledge('nonexistent')).rejects.toThrow(NotFoundError);
  });

  it('throws ApiError on 500', async () => {
    const mockFetch = createMockFetch(500, { error: 'internal', message: 'Server error', status: 500 });
    const client = new TribeMemClient({ apiKey: TEST_API_KEY, baseUrl: TEST_BASE_URL, fetch: mockFetch });
    await expect(client.getOrg()).rejects.toThrow(ApiError);
  });

  it('throws NetworkError when fetch rejects', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new TypeError('fetch failed'));
    const client = new TribeMemClient({ apiKey: TEST_API_KEY, baseUrl: TEST_BASE_URL, fetch: mockFetch as typeof fetch });
    await expect(client.getOrg()).rejects.toThrow(NetworkError);
  });

  it('ApiError exposes status and errorCode', async () => {
    const mockFetch = createMockFetch(422, {
      error: 'validation_error',
      message: 'Invalid input',
      status: 422,
      details: { field: 'title' },
    });
    const client = new TribeMemClient({ apiKey: TEST_API_KEY, baseUrl: TEST_BASE_URL, fetch: mockFetch });
    try {
      await client.getOrg();
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(422);
      expect(apiErr.errorCode).toBe('validation_error');
      expect(apiErr.details).toEqual({ field: 'title' });
    }
  });
});
