import React from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: 'calendar-events' | 'dashboard' | 'employees' | 'cronjob-config';
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage = 'calendar-events' }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex flex-col">
      <Navbar currentPage={currentPage} />
      <main className="flex-1">
        {children}
      </main>
      <footer className="flex justify-end items-center pt-8 pb-4 px-6 text-xs text-gray-500 dark:text-gray-400">
        ©2025 loveable x claude code x chitsanuphong.cha. All rights reserved
      </footer>
    </div>
  );
};

export default Layout;