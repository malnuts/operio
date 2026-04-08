import { createContext, useCallback, useContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Translations = Record<string, string>;

export type LangMeta = { code: string; label: string };

export type I18n = {
  t: (key: string, vars?: Record<string, string>) => string;
  lang: string;
  setLang: (lang: string) => void;
  available: LangMeta[];
};

// ─── Typed errors ─────────────────────────────────────────────────────────────

export class ManifestLoadError extends Error {
  readonly type = "manifest-load-failed" as const;
  constructor() {
    super("Failed to load i18n manifest");
  }
}

export class TranslationsLoadError extends Error {
  readonly type = "translations-load-failed" as const;
  constructor(readonly lang: string) {
    super(`Failed to load translations for: ${lang}`);
  }
}

// ─── HTTP cache (pure optimisation, not application state) ────────────────────

const _translationCache = new Map<string, Translations>();

async function fetchTranslations(lang: string): Promise<Translations> {
  const hit = _translationCache.get(lang);
  if (hit) return hit;
  const res = await fetch(`${import.meta.env.BASE_URL}locales/${lang}.json`);
  if (!res.ok) throw new TranslationsLoadError(lang);
  const data = (await res.json()) as Translations;
  _translationCache.set(lang, data);
  return data;
}

async function fetchManifest(): Promise<LangMeta[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}locales/manifest.json`);
  if (!res.ok) throw new ManifestLoadError();
  const data = (await res.json()) as { languages: LangMeta[] };
  return data.languages;
}

// ─── State ────────────────────────────────────────────────────────────────────

type I18nState = {
  lang: string;
  translations: Translations;
  enFallback: Translations;
  available: LangMeta[];
};

type I18nAction =
  | { type: "SET_LANG"; lang: string }
  | {
      type: "LOADED";
      lang: string;
      en: Translations;
      current: Translations;
      available: LangMeta[];
    };

function i18nReducer(state: I18nState, action: I18nAction): I18nState {
  switch (action.type) {
    case "SET_LANG":
      return { ...state, lang: action.lang };
    case "LOADED":
      return {
        ...state,
        enFallback: action.en,
        translations: action.lang === "en" ? action.en : action.current,
        available: action.available,
      };
  }
}

function interpolate(str: string, vars?: Record<string, string>): string {
  if (!vars) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

// ─── Context ──────────────────────────────────────────────────────────────────

const I18nContext = createContext<I18n | null>(null);

const LANG_KEY = "operio_lang";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function I18nProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(i18nReducer, undefined, () => ({
    lang: localStorage.getItem(LANG_KEY) ?? "en",
    translations: {},
    enFallback: {},
    available: [],
  }));

  useEffect(() => {
    let active = true;
    const extras = state.lang !== "en" ? [fetchTranslations(state.lang)] : [];

    Promise.all([fetchManifest(), fetchTranslations("en"), ...extras])
      .then(([available, en, current]) => {
        if (!active) return;
        dispatch({
          type: "LOADED",
          lang: state.lang,
          en,
          current: current ?? en,
          available,
        });
      })
      .catch((_err: ManifestLoadError | TranslationsLoadError | unknown) => {
        // Locale load failed — app stays functional, t() falls back to key
      });

    return () => {
      active = false;
    };
  }, [state.lang]);

  const setLang = useCallback((lang: string) => {
    localStorage.setItem(LANG_KEY, lang);
    dispatch({ type: "SET_LANG", lang });
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>): string => {
      const str = state.translations[key] ?? state.enFallback[key] ?? key;
      return interpolate(str, vars);
    },
    [state.translations, state.enFallback],
  );

  return (
    <I18nContext.Provider value={{ t, lang: state.lang, setLang, available: state.available }}>
      {children}
    </I18nContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be called inside <I18nProvider>");
  return ctx;
}
