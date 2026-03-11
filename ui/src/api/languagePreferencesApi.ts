import type { Lang } from '@context/LangContext';

interface LanguagePreferenceResponse {
  language?: string;
  lang?: string;
}

const DEFAULT_BASE_URL = import.meta.env.VITE_DATA_MODEL_URL || 'https://msub-eva-data-model.victoriousgrass-30debbd3.canadacentral.azurecontainerapps.io';

function getPreferencesBaseUrl(): string {
  return import.meta.env.VITE_LANGUAGE_PREFERENCES_URL || `${DEFAULT_BASE_URL}/model/user-preferences`;
}

function normalizeLang(value: unknown): Lang | null {
  if (value === 'en' || value === 'fr' || value === 'es' || value === 'de' || value === 'pt') {
    return value;
  }
  return null;
}

export async function loadLanguagePreference(userId: string): Promise<Lang | null> {
  const baseUrl = getPreferencesBaseUrl();
  const url = `${baseUrl}/${encodeURIComponent(userId)}`;

  try {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as LanguagePreferenceResponse;
    return normalizeLang(data.language ?? data.lang);
  } catch {
    return null;
  }
}

export async function saveLanguagePreference(userId: string, lang: Lang): Promise<boolean> {
  const baseUrl = getPreferencesBaseUrl();
  const url = `${baseUrl}/${encodeURIComponent(userId)}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        language: lang,
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
