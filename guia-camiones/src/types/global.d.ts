export {};

declare global {
  interface Window {
    dataLayer: Array<unknown>;
    // Si más adelante querés usar gtag directo, tipéalo:
    gtag?: (...args: unknown[]) => void;
  }
}
