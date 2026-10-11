/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPRING_BOOT_URL?: string;
  readonly VITE_FASTAPI_URL?: string;
  readonly VITE_SKIP_AUTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
