import { useCallback, useEffect, useState } from "react";

type AccessibilityPreferences = { largeText: boolean; highContrast: boolean; reduceMotion: boolean };
const STORAGE_KEY = "edunexus:accessibility-preferences";
const CHANGE_EVENT = "edunexus:accessibility-preferences-changed";
const defaults: AccessibilityPreferences = { largeText: false, highContrast: false, reduceMotion: false };

function readPreferences(): AccessibilityPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaults;
    const parsed = JSON.parse(stored) as Partial<AccessibilityPreferences>;
    return { largeText: parsed.largeText === true, highContrast: parsed.highContrast === true, reduceMotion: parsed.reduceMotion === true };
  } catch {
    return defaults;
  }
}

export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(defaults);

  useEffect(() => {
    const sync = () => setPreferences(readPreferences());
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("accessibility-large-text", preferences.largeText);
    root.classList.toggle("accessibility-high-contrast", preferences.highContrast);
    root.classList.toggle("accessibility-reduce-motion", preferences.reduceMotion);
  }, [preferences]);

  const update = useCallback((key: keyof AccessibilityPreferences, value: boolean) => {
    const next = { ...readPreferences(), [key]: value };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Keep the current session preference. */ }
    setPreferences(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return {
    ...preferences,
    setLargeText: (value: boolean) => update("largeText", value),
    setHighContrast: (value: boolean) => update("highContrast", value),
    setReduceMotion: (value: boolean) => update("reduceMotion", value),
  };
}
