// src/lib/config.ts
export const ENV = import.meta.env.VITE_ENV || "development";
export const DEBUG = (import.meta.env.VITE_DEBUG ?? "false") === "true";
export const API_URL = import.meta.env.VITE_API_URL || "";
export const STORAGE_KEY = import.meta.env.VITE_STORAGE_KEY || 
"pam-register-v1";
export const SECURE_LOCAL_STORAGE =
  (import.meta.env.VITE_SECURE_LOCAL_STORAGE ?? "false") === "true";
