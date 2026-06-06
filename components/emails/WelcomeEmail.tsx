import React from 'react';

interface WelcomeEmailProps {
  userName: string;
  t?: (key: string, options?: any) => string;
}

const styles = {
    container: { padding: '20px', maxWidth: '600px', margin: 'auto', border: '1px solid #ddd', borderRadius: '8px', fontFamily: 'sans-serif', color: '#333' },
    header: { fontSize: '24px', fontWeight: 'bold', color: '#03045E' },
    button: { backgroundColor: '#0066CC', color: 'white', padding: '12px 20px', textDecoration: 'none', borderRadius: '5px', display: 'inline-block' }
};

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ userName, t }) => {
  if (!t) return null;

  return (
    <html lang={t('language')}>
      <head>
        <title>{t('emails.welcome.title')}</title>
      </head>
      <body style={{fontFamily: 'sans-serif'}}>
        <div style={styles.container}>
          <p style={styles.header}>{t('emails.welcome.header', { name: userName })}</p>
          <p>{t('emails.welcome.body1')}</p>
          <p>{t('emails.welcome.body2')}</p>
          <ul>
            <li>{t('emails.welcome.listItem1')}</li>
            <li>{t('emails.welcome.listItem2')}</li>
            <li>{t('emails.welcome.listItem3')}</li>
          </ul>
          <p>{t('emails.welcome.body3')}</p>
          <a href="#" style={styles.button}>{t('emails.welcome.cta')}</a>
          <p>{t('emails.welcome.footer')}<br/>{t('emails.welcome.team')}</p>
        </div>
      </body>
    </html>
  );
};
