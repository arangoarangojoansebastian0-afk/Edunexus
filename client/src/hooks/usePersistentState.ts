import { useCallback, useEffect, useState } from "react";

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(`edunexus:${key}`);
      return raw === null ? initialValue : (JSON.parse(raw) as T);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(`edunexus:${key}`, JSON.stringify(value)); } catch { /* storage may be unavailable */ }
  }, [key, value]);

  const reset = useCallback(() => setValue(initialValue), [initialValue]);
  return [value, setValue, reset] as const;
}
