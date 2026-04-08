import "@testing-library/jest-dom";
import enLocale from "../../public/locales/en.json";

// Mock fetch for locale files so useI18n resolves synchronously in tests.
// Other fetch calls (data JSON, presigned URLs) fall through to the real fetch.
const _realFetch = global.fetch;
global.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const url = input.toString();
  if (url.includes("/locales/manifest.json")) {
    return Promise.resolve(
      new Response(JSON.stringify({ languages: [{ code: "en", label: "English" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
  if (url.includes("/locales/en.json")) {
    return Promise.resolve(
      new Response(JSON.stringify(enLocale), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
  return _realFetch(input, init);
};

const storage = new Map<string, string>();

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

Object.defineProperty(window, "localStorage", {
  writable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
    clear: () => {
      storage.clear();
    },
  },
});
