/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV: string;
  readonly VITE_DEBUG?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_STORAGE_KEY?: string;
  readonly VITE_SECURE_LOCAL_STORAGE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
