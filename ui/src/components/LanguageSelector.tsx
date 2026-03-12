/**
 * LanguageSelector — Reusable 6-language dropdown with a11y
 * 
 * Supports: EN, FR, ES, DE, PT, CN
 * WCAG 2.1 AA compliant with proper labeling
 * 
 * Usage:
 *   import { LanguageSelector } from '@components/LanguageSelector';
 *   <LanguageSelector />
 */

import React from 'react';
import { useLang, type Lang } from '@context/LangContext';
import { GC_BORDER, GC_MUTED } from '../styles/tokens';

export interface LanguageOption {
  code: Lang;
  label: string;
  abbr: string;
  nativeName?: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', abbr: 'EN', nativeName: 'English' },
  { code: 'fr', label: 'Français', abbr: 'FR', nativeName: 'Français' },
  { code: 'es', label: 'Español', abbr: 'ES', nativeName: 'Español' },
  { code: 'de', label: 'Deutsch', abbr: 'DE', nativeName: 'Deutsch' },
  { code: 'pt', label: 'Português', abbr: 'PT', nativeName: 'Português' },
  { code: 'cn', label: 'Chinese', abbr: 'CN', nativeName: '中文' },
];

export interface LanguageSelectorProps {
  /** Optional label text (defaults to "Language" in current language) */
  label?: string;
  /** Optional compact mode (shows abbreviations only in dropdown) */
  compact?: boolean;
  /** Optional style overrides */
  style?: React.CSSProperties;
  /** Optional select style overrides */
  selectStyle?: React.CSSProperties;
}

/**
 * Get localized label for "Language" based on current language
 */
function getLanguageLabel(lang: Lang): string {
  const labels: Record<Lang, string> = {
    en: 'Language',
    fr: 'Langue',
    es: 'Idioma',
    de: 'Sprache',
    pt: 'Idioma',
    cn: '语言',
  };
  return labels[lang] || 'Language';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  label,
  compact = false,
  style,
  selectStyle,
}) => {
  const { lang, setLang } = useLang();
  const displayLabel = label || getLanguageLabel(lang);

  return (
    <label
      style={{
        fontSize: '0.8rem',
        color: GC_MUTED,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        ...style,
      }}
    >
      {displayLabel}
      <select
        value={lang}
        onChange={(event) => setLang(event.target.value as Lang)}
        aria-label={`${displayLabel} selector`}
        style={{
          padding: '7px 10px',
          border: `1px solid ${GC_BORDER}`,
          borderRadius: '6px',
          fontSize: '0.875rem',
          cursor: 'pointer',
          ...selectStyle,
        }}
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.code} value={option.code}>
            {compact
              ? option.abbr
              : `${option.abbr} - ${option.nativeName || option.label}`}
          </option>
        ))}
      </select>
    </label>
  );
};
