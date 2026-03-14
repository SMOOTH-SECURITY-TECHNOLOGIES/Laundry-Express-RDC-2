// Global type declarations for third-party scripts
declare global {
  // Leaflet map variable
  var L: any;

  interface Window {
    // Meta Pixel (Facebook) and Google Tag
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    // Google Tag Manager dataLayer
    dataLayer?: Record<string, unknown>[];
    // Custom properties for domain routing
    customDomainPartnerSlug?: string;
    customDomainPartnerId?: string;
  }
}

// Make this file a module to allow global scope augmentation.
export {};