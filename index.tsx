import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DataProvider } from './context/DataContext';
import { OrderProvider } from './context/OrderContext';
import { NavigationProvider } from './context/NavigationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeSync } from './components/ThemeSync';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => {
          console.log('Service workers unregistered in development mode');
        })
        .catch((err) => {
          console.log('Service worker cleanup failed in development mode: ', err);
        });
      return;
    }

    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <NavigationProvider>
          <AuthProvider>
            <ThemeSync />
            <NotificationProvider>
              <DataProvider>
                <OrderProvider>
                  <App />
                </OrderProvider>
              </DataProvider>
            </NotificationProvider>
          </AuthProvider>
        </NavigationProvider>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
