import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, Settings, FileText } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/upload', icon: Upload, label: 'File Upload' },
    { to: '/settings', icon: Settings, label: 'Settings' },
    { to: '/audit-history', icon: FileText, label: 'Audit History' },
    { to: '/anamoly-autofix', icon: FileText, label: 'Anamoly AutoFix' }
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-200 ease-in-out z-30`}
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="mt-5 px-2 space-y-1">
            {links.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  location.pathname === to
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="mr-4 h-6 w-6" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}