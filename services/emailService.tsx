import React from 'react';
import ReactDOMServer from 'react-dom/server';

interface EmailPayload {
  to: string;
  subject: string;
  bodyComponent: React.ReactElement;
  t: (key: string, options?: any) => string;
}

interface EmailResult {
    success: boolean;
    error?: string;
}


/**
 * Simulates sending a transactional email using Resend.
 * In a real-world application, this function would live on a secure backend
 * or in a serverless function to protect the RESEND_API_KEY.
 *
 * It takes a React component, renders it to an HTML string (like react-email),
 * and then "sends" it by logging the details to the console.
 *
 * @param {EmailPayload} payload - The email details.
 */
export const sendTransactionalEmail = async (payload: EmailPayload): Promise<EmailResult> => {
  const { to, subject, bodyComponent, t } = payload;

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

    // 1. Clone the element to inject the `t` prop, making it available for rendering.
    const bodyWithT = React.cloneElement(bodyComponent as React.ReactElement<{ t: any }>, { t });

    // 2. Render the React component to an HTML string
    // This is the core concept of react-email
    const htmlBody = ReactDOMServer.renderToStaticMarkup(bodyWithT);

    // 3. In a real backend, you would use the Resend SDK here:
    /*
    import { Resend } from 'resend';
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: 'Laundry Express <noreply@yourdomain.com>',
      to: [to],
      subject: subject,
      react: bodyComponent, // Resend can take the component directly
      // or
      // html: htmlBody
    });

    if (error) {
      throw new Error(error.message);
    }
    */

    // 4. For our simulation, we log the details to the console.
    console.log(`[Email Service] Pretending to send email via Resend.`);
    console.log(`- TO: ${to}`);
    console.log(`- SUBJECT: ${subject}`);
    console.log('- BODY (HTML):');
    // We log the raw HTML to show what would be sent.
    // For a prettier view, you can copy-paste this into an HTML file.
    console.log(htmlBody);
    console.log('--- EMAIL DISPATCH SIMULATION COMPLETE ---');
    return { success: true };
    
  } catch (error) {
    console.error('[Email Service] Failed to simulate email sending:', error);
    return { success: false, error: (error as Error).message };
  }
};