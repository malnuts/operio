import { useCallback, useEffect, useState } from "react";

type Translations = Record<string, string>;
type LangMeta = { code: string; label: string };

const _translationCache = new Map<string, Translations>();
let _manifestCache: LangMeta[] | null = null;
let _enFallback: Translations = {};

async function loadManifest(): Promise<LangMeta[]> {
  if (_manifestCache) return _manifestCache;
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}locales/manifest.json`);
    if (!res.ok) throw new Error("manifest fetch failed");
    const data = (await res.json()) as { languages: LangMeta[] };
    _manifestCache = data.languages;
  } catch {
    _manifestCache = [{ code: "en", label: "English" }];
  }
  return _manifestCache;
}

async function loadTranslations(lang: string): Promise<Translations> {
  const cached = _translationCache.get(lang);
  if (cached) return cached;
  const res = await fetch(`${import.meta.env.BASE_URL}locales/${lang}.json`);
  if (!res.ok) throw new Error(`Failed to load locale: ${lang}`);
  const data = (await res.json()) as Translations;
  _translationCache.set(lang, data);
  return data;
}

function interpolate(str: string, vars?: Record<string, string>): string {
  if (!vars) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

export type I18n = {
  t: (key: string, vars?: Record<string, string>) => string;
  lang: string;
  setLang: (lang: string) => void;
  available: LangMeta[];
};

export function useI18n(): I18n {
  const [lang, setLangState] = useState<string>(
    () => localStorage.getItem("operio_lang") ?? "en",
  );
  const [translations, setTranslations] = useState<Translations>({});
  const [available, setAvailable] = useState<LangMeta[]>([]);

  useEffect(() => {
    let active = true;
    const fetches: Promise<Translations>[] = [loadTranslations("en")];
    if (lang !== "en") fetches.push(loadTranslations(lang));

    Promise.all([loadManifest(), ...fetches])
      .then(([manifest, en, current]) => {
        if (!active) return;
        _enFallback = en;
        setAvailable(manifest);
        setTranslations(lang === "en" ? en : (current ?? en));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [lang]);

  const setLang = useCallback((next: string) => {
    localStorage.setItem("operio_lang", next);
    setLangState(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>): string => {
      const str = translations[key] ?? _enFallback[key] ?? key;
      return interpolate(str, vars);
    },
    [translations],
  );

  return { t, lang, setLang, available };
}
