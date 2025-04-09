import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <header className="fixed top-0 w-full bg-background-light shadow-lg z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-primary text-2xl font-bold">VIBES</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link
                to="/"
                className={`${
                  isActive('/') ? 'text-primary' : 'text-text-secondary'
                } hover:text-primary transition-colors`}
              >
                Home
              </Link>
              <Link
                to="/vibes"
                className={`${
                  isActive('/vibes') ? 'text-primary' : 'text-text-secondary'
                } hover:text-primary transition-colors`}
              >
                Vibes
              </Link>
              <Link
                to="/songs"
                className={`${
                  isActive('/songs') ? 'text-primary' : 'text-text-secondary'
                } hover:text-primary transition-colors`}
              >
                Canzoni
              </Link>
              <Link
                to="/movies"
                className={`${
                  isActive('/movies') ? 'text-primary' : 'text-text-secondary'
                } hover:text-primary transition-colors`}
              >
                Film & Serie TV
              </Link>
            </nav>

            {/* Search Button */}
            <button className="p-2 text-text-secondary hover:text-primary transition-colors">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-background-light py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-text-secondary mb-4 md:mb-0">
              © 2024 VIBES. Tutti i diritti riservati.
            </div>
            <div className="flex space-x-6">
              <a
                href="#"
                className="text-text-secondary hover:text-primary transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-text-secondary hover:text-primary transition-colors"
              >
                Termini
              </a>
              <a
                href="#"
                className="text-text-secondary hover:text-primary transition-colors"
              >
                Contatti
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 