import React, { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { Menu, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './Sidebar';
import Home from '../pages/Home';
import FileUpload from '../pages/FileUpload';
import Settings from '../pages/Settings';
import AuditHistory from '../pages/AuditHistory';
import AnamolyAutoFix from '../pages/AnamolyAutoFix';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-md"
              >
                <Menu size={24} />
              </button>
              <h1 className="ml-4 text-xl font-semibold text-gray-800 dark:text-white">
                Smart Minds
              </h1>
            </div>

            <div className="flex items-center">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md mr-2"
              >
                {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-md"
                >
                  <User size={24} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10">
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        // Add logout logic here
                        setIsUserMenuOpen(false);
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<FileUpload />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/audit-history" element={<AuditHistory />} />
          <Route path="/anamoly-autofix" element={<AnamolyAutoFix />} />
        </Routes>
      </main>
    </div>
  );
}
