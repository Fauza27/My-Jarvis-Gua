"use client";

import { useEffect } from "react";
import { applyDarkMode, getStoredDarkMode } from "@/lib/theme";

export function ThemeSync() {
  useEffect(() => {
    const initial = getStoredDarkMode();
    if (initial !== null) {
      applyDarkMode(initial);
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== "ui.darkMode") {
        return;
      }

      if (event.newValue === "true") {
        applyDarkMode(true);
      } else if (event.newValue === "false") {
        applyDarkMode(false);
      }
    };

    const onThemeChange = (event: Event) => {
      const custom = event as CustomEvent<{ darkMode?: boolean }>;
      const nextValue = custom.detail?.darkMode;
      if (typeof nextValue === "boolean") {
        applyDarkMode(nextValue);
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("theme:change", onThemeChange as EventListener);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("theme:change", onThemeChange as EventListener);
    };
  }, []);

  return null;
}
