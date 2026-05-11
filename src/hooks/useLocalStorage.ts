import { useState } from 'react';

type SetValue<T> = (value: T | ((prev: T) => T)) => void;

/**
 * useState that automatically persists to localStorage as JSON.
 * Accepts an initializer function to avoid serializing on every render.
 */
export function useLocalStorage<T>(
  key: string,
  initializer: () => T,
): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initializer();
    } catch {
      return initializer();
    }
  });

  const setValue: SetValue<T> = (value) => {
    try {
      const next = value instanceof Function ? value(storedValue) : value;
      setStoredValue(next);
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch (err) {
      console.error('[useLocalStorage] write error:', err);
    }
  };

  return [storedValue, setValue];
}
