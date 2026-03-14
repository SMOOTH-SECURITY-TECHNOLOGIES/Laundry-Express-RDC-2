import React, { useState, ReactNode } from 'react';
import { Icon } from '../Icon';
import { useAppContext } from '../../context/AppContext';

interface DashboardLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  mobileTitle: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ sidebar, children, mobileTitle }) => {
  const { t } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <header className="md:hidden flex items-center justify-between py-4 border-b dark:border-slate-700 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 mb-4">
        <h1 className="text-lg font-bold text-brand-dark dark:text-slate-100">{mobileTitle}</h1>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2" aria-label={t('header.openMenu')}>
          <Icon name="bars3" className="w-6 h-6" />
        </button>
      </header>

      <div className="flex flex-col md:flex-row md:gap-8 items-start">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside
          className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 p-4 shadow-xl z-50 transform transition-transform md:sticky md:top-24 md:shadow-card md:rounded-2xl md:translate-x-0 md:dark:border md:dark:border-slate-700
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex justify-between items-center md:hidden mb-4">
             <h2 className="text-xl font-bold px-2">Menu</h2>
             <button onClick={() => setIsSidebarOpen(false)} className="p-2" aria-label={t('buttons.close')}>
                 <Icon name="xmark" className="w-6 h-6"/>
             </button>
          </div>
          {sidebar}
        </aside>

        <main className="flex-grow w-full">
          {children}
        </main>
      </div>
    </>
  );
};