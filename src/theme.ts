import { useEffect, useState } from "react";

export type Theme = "light" | "dark";
export const THEME_KEY = "talkin-ball-theme";
const isTheme = (value: string | null): value is Theme =>
  value === "light" || value === "dark";

function readPreference(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function useTheme() {
  const [preference, setPreference] = useState(readPreference);
  const [systemTheme, setSystemTheme] = useState<Theme>(() =>
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );
  const theme = preference ?? systemTheme;

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const syncSystem = () => setSystemTheme(media?.matches ? "dark" : "light");
    const syncStorage = (event: StorageEvent) => {
      if (event.key === THEME_KEY || event.key === null) {
        setPreference(readPreference());
      }
    };
    syncSystem();
    media?.addEventListener("change", syncSystem);
    window.addEventListener("storage", syncStorage);
    return () => {
      media?.removeEventListener("change", syncSystem);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        getComputedStyle(document.documentElement)
          .getPropertyValue("--bg")
          .trim(),
      );
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setPreference(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // The selected theme still works when storage is unavailable.
    }
  };

  return { theme, toggleTheme };
}
