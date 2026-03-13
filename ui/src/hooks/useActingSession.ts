/**
 * useActingSession.ts -- H1 handshake bootstrap hook
 *
 * On mount, calls POST /v1/roles/acting-as and stores the session.
 * Subsequent requests via BackendApiClient will carry X-Acting-Session.
 *
 * Fallback: if roles-api is unreachable, falls back to DEV_BYPASS mode.
 * Brain-api will accept requests with DEV_ACTOR_OID when DEV_BYPASS_OID is set.
 *
 * EVA-STORY: F31-WI20-001
 */

import { useEffect, useState } from 'react';
import { persistSession, getStoredSession, DEV_ACTOR_OID } from '../utils/auth';

const ROLES_API_URL =
  import.meta.env.VITE_ROLES_API_URL ??
  'https://marco-eva-roles-api.livelyflower-7990bc7b.canadacentral.azurecontainerapps.io';

const DEFAULT_PERSONA = 'admin';

interface ActingSessionState {
  sessionReady: boolean;
  sessionId: string | null;
  personaId: string | null;
  features: string[];
  /** Non-null on fallback mode -- session may not be active on roles-api */
  error: string | null;
}

/**
 * Bootstrap the acting-as session at app startup.
 *
 * Returns { sessionReady: false } while the POST /v1/roles/acting-as
 * request is in flight. Renders can gate on sessionReady.
 */
export const useActingSession = (): ActingSessionState => {
  const [state, setState] = useState<ActingSessionState>({
    sessionReady: false,
    sessionId: null,
    personaId: null,
    features: [],
    error: null,
  });

  useEffect(() => {
    const bootstrap = async () => {
      // Re-use cached session if still in storage (page refresh in same tab)
      const cached = getStoredSession();
      if (cached.sessionId) {
        setState({
          sessionReady: true,
          sessionId: cached.sessionId,
          personaId: cached.personaId,
          features: cached.features,
          error: null,
        });
        return;
      }

      try {
        const resp = await fetch(`${ROLES_API_URL}/v1/roles/acting-as`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Actor-OID': DEV_ACTOR_OID,
          },
          body: JSON.stringify({ persona_id: DEFAULT_PERSONA }),
        });

        if (!resp.ok) {
          throw new Error(`acting-as returned HTTP ${resp.status}`);
        }

        const data: {
          session_id: string;
          actor_oid: string;
          persona_id: string;
          features: string[];
        } = await resp.json();

        persistSession(data.actor_oid, data.session_id, data.persona_id, data.features);

        setState({
          sessionReady: true,
          sessionId: data.session_id,
          personaId: data.persona_id,
          features: data.features,
          error: null,
        });
      } catch (err) {
        // DEV FALLBACK: brain-api accepts DEV_ACTOR_OID with bypass active
        // Session headers will be empty; feature gate bypassed via DEV_BYPASS_OID on ACA
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn('[useActingSession] Falling back to dev bypass mode:', errMsg);
        persistSession(DEV_ACTOR_OID, '', DEFAULT_PERSONA, []);
        setState({
          sessionReady: true,
          sessionId: null,
          personaId: DEFAULT_PERSONA,
          features: [],
          error: errMsg,
        });
      }
    };

    void bootstrap();
  }, []);

  return state;
};
