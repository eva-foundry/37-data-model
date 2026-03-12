/**
 * AuthContext.tsx — portal-face
 *
 * FACES-WI-C (WI-19): Provides EVAUser + persona-based permissions to the app.
 *
 * Resolution order (first match wins):
 *  1. VITE_DEV_AUTH_BYPASS=true  → mock admin (all permissions, dev only)
 *  2. VITE_APIM_BASE_URL empty   → mock viewer (matches Cosmos `viewer` persona)
 *  3. Live                       → fetch /.auth/me injected by APIM/EasyAuth
 *
 * X-Actor-OID and X-Acting-Session are attached by APIM to backend calls;
 * the frontend reads identity from /.auth/me (EasyAuth endpoint).
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

// ── Permission set ──────────────────────────────────────────────────────────────
export type Permission =
  | 'read:translations' | 'write:translations'
  | 'read:users'        | 'write:users'
  | 'read:groups'       | 'write:groups'
  | 'manage:settings'   | 'manage:feature-flags'
  | 'manage:rbac'       | 'view:finops'
  | 'view:devops'       | 'view:support'
  | 'view:model'        | 'view:portal';

// ── User shape ──────────────────────────────────────────────────────────────────
export type Persona = 'admin' | 'analyst' | 'reviewer' | 'viewer' | 'system';

export interface EVAUser {
  oid: string;
  name: string;
  email: string;
  persona: Persona;
  permissions: Permission[];
}

// ── Persona → permission mapping (mirrors 37-data-model personas.json) ──────────
const PERSONA_PERMISSIONS: Record<Persona, Permission[]> = {
  admin:    [
    'read:translations', 'write:translations',
    'read:users',        'write:users',
    'read:groups',       'write:groups',
    'manage:settings',   'manage:feature-flags',
    'manage:rbac',       'view:finops',
    'view:devops',       'view:support',
    'view:model',        'view:portal',
  ],
  analyst:  ['read:translations', 'read:users', 'read:groups', 'view:finops', 'view:devops', 'view:model', 'view:portal'],
  reviewer: ['read:translations', 'read:users', 'read:groups', 'view:support'],
  viewer:   ['read:translations', 'read:users'],
  system:   [],
};

// ── Mock users ──────────────────────────────────────────────────────────────────
const MOCK_ADMIN: EVAUser = {
  oid: 'dev-bypass-oid',
  name: 'Dev Bypass User',
  email: 'dev@local',
  persona: 'admin',
  permissions: PERSONA_PERMISSIONS['admin'],
};

const MOCK_VIEWER: EVAUser = {
  oid: 'mock-viewer-oid',
  name: 'Mock Viewer',
  email: 'viewer@mock',
  persona: 'viewer',
  permissions: PERSONA_PERMISSIONS['viewer'],
};

// ── EasyAuth /.auth/me response ─────────────────────────────────────────────────
interface EasyAuthClaim { typ: string; val: string; }
interface EasyAuthPrincipal { user_id?: string; user_claims?: EasyAuthClaim[]; }

function claimVal(claims: EasyAuthClaim[], typ: string): string {
  return claims.find(c => c.typ === typ)?.val ?? '';
}

function personaFromRoles(roles: string[]): Persona {
  if (roles.includes('EVA-Admins'))    return 'admin';
  if (roles.includes('EVA-Analysts'))  return 'analyst';
  if (roles.includes('EVA-Reviewers')) return 'reviewer';
  if (roles.includes('EVA-Users'))     return 'viewer';
  return 'viewer';
}

async function fetchEasyAuthUser(): Promise<EVAUser | null> {
  try {
    const res = await fetch('/.auth/me');
    if (!res.ok) return null;
    const data: EasyAuthPrincipal[] = await res.json();
    const principal = data[0];
    if (!principal) return null;

    const claims = principal.user_claims ?? [];
    const oid    = (claimVal(claims, 'http://schemas.microsoft.com/identity/claims/objectidentifier')
                || principal.user_id) ?? '';
    const name   = claimVal(claims, 'name');
    const email  = claimVal(claims, 'preferred_username') || claimVal(claims, 'upn');
    const roles  = claims.filter(c => c.typ === 'roles').map(c => c.val);
    const persona = personaFromRoles(roles);

    return { oid, name, email, persona, permissions: PERSONA_PERMISSIONS[persona] };
  } catch {
    return null;
  }
}

// ── Context ─────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: EVAUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

const APIM_BASE = import.meta.env['VITE_APIM_BASE_URL'] as string | undefined;
const DEV_BYPASS = import.meta.env['VITE_DEV_AUTH_BYPASS'] === 'true';
const USE_MOCK   = !APIM_BASE;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<EVAUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (DEV_BYPASS) {
      setUser(MOCK_ADMIN);
      setLoading(false);
      return;
    }
    if (USE_MOCK) {
      setUser(MOCK_VIEWER);
      setLoading(false);
      return;
    }
    fetchEasyAuthUser().then(u => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook: access the resolved EVA user. */
export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
