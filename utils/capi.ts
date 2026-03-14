/**
 * @fileoverview This file contains the client-side implementation for sending events
 * to our OWN backend for server-side processing, such as for the Meta Conversions API (CAPI).
 *
 * IMPORTANT: This does NOT send data directly to Meta. It sends data to our own
 * secure backend endpoint, which is then responsible for securely communicating with Meta.
 */

interface ServerEventData {
  event_name: string;
  event_time: number;
  user_data: {
    em?: string; // Email
    ph?: string; // Phone
    fn?: string; // First Name
    ln?: string; // Last Name
    client_ip_address?: string; // Should be captured by server
    client_user_agent?: string;
    fbc?: string; // Click ID
    fbp?: string; // Browser ID
  };
  custom_data: {
    value?: number;
    currency?: string;
    content_ids?: string[];
    content_type?: string;
    content_name?: string;
  };
  event_source_url: string;
  action_source: 'website';
}


/**
 * Sends an event to our backend for server-side tracking (e.g., Meta CAPI).
 * This is a client-side function that initiates a server-side event.
 *
 * @param {string} eventName The standard Meta event name (e.g., 'Purchase', 'Lead').
 * @param {any} clientEventData The data available on the client, like from dataLayer.
 */
export const sendServerSideEvent = async (eventName: string, clientEventData: any): Promise<void> => {
    console.log(`[CAPI] Sending event "${eventName}" to backend for server-side processing`, clientEventData);

    // In a real app, you would get these from cookies or server-side rendering.
    const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
    }

    const fbc = getCookie('_fbc');
    const fbp = getCookie('_fbp');

    // Transform client data (like GTM dataLayer) into CAPI format
    const userData = clientEventData.user_data || {};
    const address = userData.address || {};
    const [firstName, ...lastNameParts] = (address.first_name || '').split(' ');
    const lastName = lastNameParts.join(' ') || address.last_name || '';
    
    const serverPayload: ServerEventData = {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        user_data: {
            em: userData.email,
            ph: userData.phone_number,
            fn: firstName,
            ln: lastName,
            // These should be captured by the backend server from the request, not sent from the client
            client_ip_address: '127.0.0.1', 
            client_user_agent: navigator.userAgent,
            fbc: fbc,
            fbp: fbp,
        },
        custom_data: {
            value: clientEventData.value,
            currency: clientEventData.currency,
            content_ids: clientEventData.items?.map((item: any) => item.item_id),
            content_type: clientEventData.items ? 'product' : undefined,
            content_name: clientEventData.content_name,
        },
        event_source_url: window.location.href,
        action_source: 'website'
    };
    
    try {
        // This simulates sending the event to YOUR backend.
        // The backend at '/api/track-server-event' is responsible for hashing user data
        // and securely calling the Meta Conversions API with its secret token.
        const response = await fetch('/api/track-server-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(serverPayload),
        });

        if (!response.ok) {
            console.warn('[CAPI] Backend failed to process server-side event.');
        } else {
            console.log('[CAPI] Backend successfully received event.');
        }
    } catch (error) {
        console.error('[CAPI] Error sending event to backend:', error);
    }
};