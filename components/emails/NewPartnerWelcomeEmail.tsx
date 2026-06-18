import React from 'react';
import { PartnerApplication } from '../../types';

interface NewPartnerWelcomeEmailProps {
  application: PartnerApplication;
  temporaryPassword?: string;
  t?: (key: string, options?: any) => string;
}

const styles = {
    container: { padding: '20px', maxWidth: '600px', margin: 'auto', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'sans-serif', color: '#333' },
    header: { fontSize: '24px', fontWeight: 'bold', color: '#03045E' },
    button: { backgroundColor: '#0066CC', color: 'white', padding: '12px 20px', textDecoration: 'none', borderRadius: '5px', display: 'inline-block' }
};

export const NewPartnerWelcomeEmail: React.FC<NewPartnerWelcomeEmailProps> = ({ application, temporaryPassword, t }) => {
  if (!t) return null;

  return (
    <html lang={t('language')}>
       <head>
        <title>{t('emails.newPartnerWelcome.title')}</title>
      </head>
      <body style={{fontFamily: 'sans-serif'}}>
        <div style={styles.container}>
          <p style={styles.header}>{t('emails.newPartnerWelcome.header', { name: application.contactName })}</p>
          <p>{t('emails.newPartnerWelcome.body1', { companyName: application.companyName })}</p>
          <p>{t('emails.newPartnerWelcome.body2', { email: application.email })}</p>
          {temporaryPassword && (
            <p><strong>Mot de passe temporaire :</strong> {temporaryPassword}</p>
          )}
          <a href="#" style={styles.button}>{t('emails.newPartnerWelcome.cta')}</a>
          <p>{t('emails.newPartnerWelcome.body3')}</p>
          <p>{t('emails.newPartnerWelcome.footer')}<br/>{t('emails.newPartnerWelcome.team')}</p>
        </div>
      </body>
    </html>
  );
};
