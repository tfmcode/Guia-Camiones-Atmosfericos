// types/google-maps.d.ts

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps?: () => void;
  }
}

export {};
