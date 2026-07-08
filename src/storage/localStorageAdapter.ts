import type { LocalStoragePort, StorageEventName } from "./types";

function emit(eventName?: StorageEventName) {
  if (!eventName || typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(eventName));
  } catch {}
}

export const localStorageAdapter: LocalStoragePort = {
  read<T = unknown>(key: string): T | undefined {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return undefined;
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },

  write<T = unknown>(key: string, value: T, eventName?: StorageEventName) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      emit(eventName);
    } catch (error) {
      console.warn(`storage.write failed for ${key}:`, error);
    }
  },

  remove(key: string, eventName?: StorageEventName) {
    try {
      localStorage.removeItem(key);
      emit(eventName);
    } catch (error) {
      console.warn(`storage.remove failed for ${key}:`, error);
    }
  },

  keys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  },
};
