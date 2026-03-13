/**
 * useActingSession.test.ts -- H1 handshake bootstrap hook tests (WI-20)
 *
 * Covers: sessionReady lifecycle, successful H1 handshake, cached session reuse,
 * fallback to dev-bypass on network error, and correct POST body/headers.
 *
 * Mocks: global fetch, sessionStorage (via JSDOM), import.meta.env
 *
 * EVA-STORY: F31-WI20-001
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useActingSession } from './useActingSession';
import { getStoredSession, clearSession } from '../utils/auth';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// fetch is mocked globally -- ROLES_API_URL resolves to the ACA default or the
// VITE_ROLES_API_URL env var. Either way we control responses via mockFetch.

const mockSuccessResponse = {
  session_id: 'sess-1111-2222',
  actor_oid: 'oid-user-test',
  persona_id: 'admin',
  features: ['view:settings', 'view:apps'],
};

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
  clearSession();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOkResponse(body: object) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response);
}

function makeErrorResponse(status: number) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ detail: 'error' }),
  } as Response);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useActingSession', () => {
  it('starts with sessionReady false', () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useActingSession());
    expect(result.current.sessionReady).toBe(false);
  });

  it('sets sessionReady true after successful H1 handshake', async () => {
    mockFetch.mockReturnValue(makeOkResponse(mockSuccessResponse));
    const { result } = renderHook(() => useActingSession());
    await waitFor(() => expect(result.current.sessionReady).toBe(true));
    expect(result.current.sessionId).toBe(mockSuccessResponse.session_id);
    expect(result.current.personaId).toBe(mockSuccessResponse.persona_id);
    expect(result.current.features).toEqual(mockSuccessResponse.features);
    expect(result.current.error).toBeNull();
  });

  it('persists session to sessionStorage on success', async () => {
    mockFetch.mockReturnValue(makeOkResponse(mockSuccessResponse));
    renderHook(() => useActingSession());
    await waitFor(() => {
      const s = getStoredSession();
      expect(s.sessionId).toBe(mockSuccessResponse.session_id);
    });
  });

  it('calls POST /v1/roles/acting-as with X-Actor-OID header', async () => {
    mockFetch.mockReturnValue(makeOkResponse(mockSuccessResponse));
    renderHook(() => useActingSession());
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    const [_url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['X-Actor-OID']).toBeDefined();
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string).persona_id).toBe('admin');
  });

  it('falls back to dev-bypass mode when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useActingSession());
    await waitFor(() => expect(result.current.sessionReady).toBe(true));
    expect(result.current.error).toContain('Network error');
    expect(result.current.sessionId).toBeNull();
  });

  it('falls back to dev-bypass mode when server returns non-ok', async () => {
    mockFetch.mockReturnValue(makeErrorResponse(503));
    const { result } = renderHook(() => useActingSession());
    await waitFor(() => expect(result.current.sessionReady).toBe(true));
    expect(result.current.error).not.toBeNull();
  });

  it('reuses cached session without calling fetch again', async () => {
    // Pre-load session into sessionStorage
    const { persistSession } = await import('../utils/auth');
    persistSession('oid-cached', 'sess-cached', 'admin', ['view:settings']);
    const { result } = renderHook(() => useActingSession());
    await waitFor(() => expect(result.current.sessionReady).toBe(true));
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.sessionId).toBe('sess-cached');
  });
});
