export const THEME_STORAGE_KEY = "ui.darkMode";

export function getStoredDarkMode(): boolean | null {
  if (typeof window === "undefined") {
    return null;
  }

  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "true") {
    return true;
  }
  if (saved === "false") {
    return false;
  }
  return null;
}

export function applyDarkMode(enabled: boolean): void {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.classList.toggle("dark", enabled);
}

export function setStoredDarkMode(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, String(enabled));
}

export function setDarkModePreference(enabled: boolean): void {
  setStoredDarkMode(enabled);
  applyDarkMode(enabled);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("theme:change", { detail: { darkMode: enabled } }));
  }
}
