import React from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: 'home' | 'calendar-events' | 'employees' | 'cronjob-config';
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage = 'home' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <Navbar currentPage={currentPage} />
      <main>
        {children}
      </main>
    </div>
  );
};

export default Layout;