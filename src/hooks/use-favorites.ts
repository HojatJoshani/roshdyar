"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "roshdgar:favorites";

// Module-level cache so getSnapshot returns a stable reference between writes.
// This is REQUIRED for useSyncExternalStore — otherwise it returns a new
// array reference each call and React loops forever re-rendering.
let cached: string[] | null = null;

function read(): string[] {
  if (typeof window === "undefined") return EMPTY;
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cached = EMPTY;
      return EMPTY;
    }
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === "string")
      : EMPTY;
    cached = arr;
    return arr;
  } catch {
    cached = EMPTY;
    return EMPTY;
  }
}

function write(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    cached = ids; // update cache so the next getSnapshot returns the new ref
    window.dispatchEvent(new CustomEvent("roshdgar:favorites-changed"));
  } catch {
    // ignore quota errors
  }
}

const EMPTY: string[] = [];

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("roshdgar:favorites-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("roshdgar:favorites-changed", callback);
    window.removeEventListener("storage", callback);
  };
};

const getSnapshot = (): string[] => read();
const getServerSnapshot = (): string[] => EMPTY;

/**
 * Client-side favorites (wishlist) for services. Uses localStorage so the
 * list persists across sessions without needing a DB table. Bound to the
 * service slug so reordering or slugs remain stable. Uses useSyncExternalStore
 * for hydration-safe, lint-clean external subscription with a module-level
 * cache to keep snapshot references stable between writes.
 */
export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites]
  );

  const toggle = useCallback((slug: string) => {
    const current = read();
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    write(next);
  }, []);

  const remove = useCallback((slug: string) => {
    const next = read().filter((s) => s !== slug);
    write(next);
  }, []);

  const clear = useCallback(() => {
    write([]);
  }, []);

  const hydrated = useIsHydrated();

  return { favorites, isFavorite, toggle, remove, clear, hydrated };
}

// Hydration-safe primitive: returns false on server + first client render,
// then true after subscribe attaches on the client.
const subscribeNoop = () => () => {};
const getTrue = () => true;
const getFalse = () => false;
function useIsHydrated() {
  return useSyncExternalStore(subscribeNoop, getTrue, getFalse);
}
