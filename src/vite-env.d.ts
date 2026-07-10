/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** REST + WebSocket temel adresi (ör. https://api.uniclub.app/api). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
