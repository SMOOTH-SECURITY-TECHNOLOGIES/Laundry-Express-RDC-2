// Standard way to interact with Google Tag Manager
export const trackEvent = (eventName: string, eventData: any) => {
  // Log to console for debugging purposes
  console.log(`[Tracking Event] Firing "${eventName}"`, eventData);

  // Ensure dataLayer is initialized before pushing
  window.dataLayer = window.dataLayer || [];
  
  // These events follow the GA4 ecommerce data structure and should be nested under an 'ecommerce' object.
  const ecommerceEvents = [
    'view_item', 
    'select_item', 
    'AddToCart', 
    'InitiateCheckout', 
    'AddPaymentInfo',
    'purchase'
  ];

  if (ecommerceEvents.includes(eventName)) {
      const { user_data, ...ecommercePayload } = eventData;
      const dataLayerObject: any = {
        event: eventName,
        ecommerce: ecommercePayload,
      };
      if (user_data) {
        dataLayerObject.user_data = user_data;
      }
      window.dataLayer.push(dataLayerObject);
  } else {
       // Other events (like Lead, CompleteRegistration, Search) have their data at the top level.
       window.dataLayer.push({
        event: eventName,
        ...eventData,
      });
  }
};
