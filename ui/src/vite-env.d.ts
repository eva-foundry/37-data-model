/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_MODEL_URL?: string;
  // Add more env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
