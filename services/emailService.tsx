interface EmailPayload {
  to: string;
  subject: string;
  bodyComponent: any;
  t: (key: string, options?: any) => string;
}

interface EmailResult {
    success: boolean;
    error?: string;
}

/**
 * Simulates sending a transactional email.
 * This is a client-side simulation that logs email details to the console.
 * In production, email sending should be handled by a backend service.
 */
export const sendTransactionalEmail = async (payload: EmailPayload): Promise<EmailResult> => {
  const { to, subject, t } = payload;

  console.log('--- SIMULATING EMAIL DISPATCH ---');
  
  try {
    // SIMULATE FAILURE CONDITIONS
    if (to.includes('bounce@test.com')) {
        const error = t('emailService.errors.hardBounce');
        console.warn(`[Email Service] SIMULATED FAILURE for ${to}: ${error}`);
        console.log('--- EMAIL DISPATCH SIMULATION FAILED ---');
        return { success: false, error };
    }
     if (to.includes('fail@test.com')) {
        const error = t('emailService.errors.invalidRequest');
        console.warn(`[Email Service] SIMULATED FAILURE for ${to}: ${error}`);
        console.log('--- EMAIL DISPATCH SIMULATION FAILED ---');
        return { success: false, error };
    }

    // Client-side simulation: log email details without rendering to HTML
    // (react-dom/server is not available in browser bundles)
    console.log(`[Email Service] Pretending to send email via Resend.`);
    console.log(`- TO: ${to}`);
    console.log(`- SUBJECT: ${subject}`);
    console.log('- BODY: [React Component - rendered on server in production]');
    console.log('--- EMAIL DISPATCH SIMULATION COMPLETE ---');
    return { success: true };
    
  } catch (error) {
    console.error('[Email Service] Failed to simulate email sending:', error);
    return { success: false, error: (error as Error).message };
  }
};