/// <reference types="vite/client" />
declare module "plotly.js-dist-min";
declare module "virtual:pwa-register";

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}
