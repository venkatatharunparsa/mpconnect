"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UiLocale = "en" | "te";
export type AppRole = "citizen" | "official" | "mp";

const LOCALE_KEY = "mpconnect:locale";
const ROLE_KEY = "mpconnect:role";

interface AppContextValue {
  locale: UiLocale;
  setLocale: (locale: UiLocale) => void;
  role: AppRole;
  setRole: (role: AppRole) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  toggleMenu: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<UiLocale>("en");
  const [role, setRole] = useState<AppRole>("citizen");
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => setMenuOpen((o) => !o), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedLocale = localStorage.getItem(LOCALE_KEY);
    if (storedLocale === "en" || storedLocale === "te") {
      setLocale(storedLocale);
    }
    const storedRole = localStorage.getItem(ROLE_KEY);
    if (storedRole === "citizen" || storedRole === "official" || storedRole === "mp") {
      setRole(storedRole);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ROLE_KEY, role);
  }, [role]);

  const value = useMemo(
    () => ({ locale, setLocale, role, setRole, menuOpen, setMenuOpen, toggleMenu }),
    [locale, role, menuOpen, toggleMenu],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
