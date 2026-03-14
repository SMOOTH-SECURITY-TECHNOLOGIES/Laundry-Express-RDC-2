import React from 'react';
import { PartnerApplication } from '../../types';

interface NewLogisticsPartnerWelcomeEmailProps {
  application: PartnerApplication;
  t?: (key: string, options?: any) => string;
}

const styles = {
    container: { padding: '20px', maxWidth: '600px', margin: 'auto', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'sans-serif', color: '#333' },
    header: { fontSize: '24px', fontWeight: 'bold', color: '#03045E' },
    button: { backgroundColor: '#0077B6', color: 'white', padding: '12px 20px', textDecoration: 'none', borderRadius: '5px', display: 'inline-block' }
};

export const NewLogisticsPartnerWelcomeEmail: React.FC<NewLogisticsPartnerWelcomeEmailProps> = ({ application, t }) => {
  if (!t) return null;

  return (
    <html lang={t('language')}>
       <head>
        <title>{t('emails.newLogisticsPartnerWelcome.title')}</title>
      </head>
      <body style={{fontFamily: 'sans-serif'}}>
        <div style={styles.container}>
          <p style={styles.header}>{t('emails.newLogisticsPartnerWelcome.header', { name: application.contactName })}</p>
          <p>{t('emails.newLogisticsPartnerWelcome.body1', { companyName: application.companyName })}</p>
          <p>{t('emails.newLogisticsPartnerWelcome.body2', { email: application.email })}</p>
          <a href="#" style={styles.button}>{t('emails.newLogisticsPartnerWelcome.cta')}</a>
          <p>{t('emails.newLogisticsPartnerWelcome.body3')}</p>
          <p>{t('emails.newLogisticsPartnerWelcome.footer')}<br/>{t('emails.newLogisticsPartnerWelcome.team')}</p>
        </div>
      </body>
    </html>
  );
};
