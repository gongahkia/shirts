import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  FolderIcon,
  CogIcon,
  UserGroupIcon,
  PlayIcon,
  ChartBarIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';
import { NavigationItem } from '@/types';
import { useDarkMode } from '@/hooks/useDarkMode';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Cases', href: '/cases', icon: FolderIcon },
  { name: 'Workflows', href: '/workflows', icon: PlayIcon },
  { name: 'Agents', href: '/agents', icon: UserGroupIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu */}
      <div className={`relative z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />

        <div className="fixed inset-y-0 left-0 flex w-64 flex-col">
          <div className="flex min-h-0 flex-1 flex-col bg-legal-800">
            <div className="flex h-16 flex-shrink-0 items-center justify-between px-4">
              <Link to="/dashboard" className="flex items-center">
                <div className="h-8 w-8 bg-gold-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="ml-3 text-white font-legal text-xl font-semibold">Shirts Legal</span>
              </Link>
              <button
                type="button"
                className="text-legal-300 hover:text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const current = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={
                      current
                        ? 'sidebar-nav-item-active'
                        : 'sidebar-nav-item-inactive text-legal-300 hover:bg-legal-700 hover:text-white'
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="mr-3 h-6 w-6 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-legal-800">
          <div className="flex h-16 flex-shrink-0 items-center px-4">
            <Link to="/dashboard" className="flex items-center">
              <div className="h-8 w-8 bg-gold-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="ml-3 text-white font-legal text-xl font-semibold">Shirts Legal</span>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const current = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={
                    current
                      ? 'sidebar-nav-item-active'
                      : 'sidebar-nav-item-inactive text-legal-300 hover:bg-legal-700 hover:text-white'
                  }
                >
                  <item.icon className="mr-3 h-6 w-6 flex-shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section with dark mode toggle */}
          <div className="border-t border-legal-700 p-4">
            <button
              onClick={toggleDarkMode}
              className="flex w-full items-center rounded-md px-4 py-2 text-sm font-medium text-legal-300 hover:bg-legal-700 hover:text-white transition-colors duration-200"
            >
              {isDarkMode ? (
                <>
                  <SunIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                  Light Mode
                </>
              ) : (
                <>
                  <MoonIcon className="mr-3 h-5 w-5 flex-shrink-0" />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-legal-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 justify-between px-4 lg:px-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-2xl font-legal font-semibold text-gray-900 dark:text-white">
                {navigation.find(item => item.href === location.pathname)?.name || 'Shirts Legal Workflow'}
              </h1>
            </div>

            <div className="ml-4 flex items-center lg:ml-6">
              {/* Dark mode toggle for desktop */}
              <button
                onClick={toggleDarkMode}
                className="rounded-full bg-white dark:bg-gray-800 p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-legal-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                {isDarkMode ? (
                  <SunIcon className="h-6 w-6" />
                ) : (
                  <MoonIcon className="h-6 w-6" />
                )}
              </button>

              {/* User menu placeholder */}
              <div className="relative ml-3">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-legal-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">U</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;