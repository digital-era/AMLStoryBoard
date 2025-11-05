// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_AI_STUDIO_API_KEY: string;
  // Add other VITE_ environment variables here if you use them, e.g.:
  // readonly VITE_SOME_OTHER_VAR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
