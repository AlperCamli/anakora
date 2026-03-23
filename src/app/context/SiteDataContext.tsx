import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getLayout, type LayoutDTO, type Locale } from "../../server/data";

interface SiteDataContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  layout: LayoutDTO | null;
  isLoadingLayout: boolean;
  layoutError: string | null;
}

const LOCALE_STORAGE_KEY = "anakora_locale";

const SiteDataContext = createContext<SiteDataContextValue | null>(null);

function readInitialLocale(): Locale {
  if (typeof window === "undefined") {
    return "tr";
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "en" ? "en" : "tr";
}

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);
  const [layout, setLayout] = useState<LayoutDTO | null>(null);
  const [isLoadingLayout, setIsLoadingLayout] = useState(true);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setIsLoadingLayout(true);
      setLayoutError(null);
      try {
        const data = await getLayout(locale);
        if (!isMounted) {
          return;
        }
        setLayout(data);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setLayoutError(
          error instanceof Error ? error.message : "Layout verisi alinamadi.",
        );
      } finally {
        if (isMounted) {
          setIsLoadingLayout(false);
        }
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [locale]);

  const value = useMemo<SiteDataContextValue>(
    () => ({
      locale,
      setLocale,
      layout,
      isLoadingLayout,
      layoutError,
    }),
    [layout, layoutError, isLoadingLayout, locale, setLocale],
  );

  return (
    <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const context = useContext(SiteDataContext);
  if (!context) {
    throw new Error("useSiteData must be used within SiteDataProvider.");
  }
  return context;
}
