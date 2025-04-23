import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Menu, X } from 'lucide-react';

export const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthenticated = !!localStorage.getItem('token');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed w-full z-[100] transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-md py-2'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
        <Link to="/home" className="flex items-center space-x-2">
          <Compass className="h-8 w-8 text-lime-500" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8">
          <NavLink href="/home" label="Home" isScrolled={isScrolled} />
          <NavLink href="/home#features" label="Features" isScrolled={isScrolled} />
          <NavLink href="/home#destinations" label="Destinations" isScrolled={isScrolled} />
        </div>

        {/* Auth Button */}
        <div className="hidden md:block">
          <Link
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="px-4 py-2 bg-lime-500 text-white rounded-md hover:bg-lime-400 transition-all duration-300"
          >
            {isAuthenticated ? "Dashboard" : "Sign In"}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`p-2 rounded-md ${isScrolled ? 'text-slate-700' : 'text-slate-700'}`}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <MobileNavLink href="/home" label="Home" onClick={() => setIsMenuOpen(false)} />
            <MobileNavLink href="/home#features" label="Features" onClick={() => setIsMenuOpen(false)} />
            <MobileNavLink href="/home#destinations" label="Destinations" onClick={() => setIsMenuOpen(false)} />
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="px-4 py-2 bg-lime-500 text-white rounded-md hover:bg-lime-400 transition-all duration-300 text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              {isAuthenticated ? "Dashboard" : "Sign In"}
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

const NavLink = ({ href, label, isScrolled }: { href: string; label: string; isScrolled: boolean }) => {
  return (
    <a
      href={href}
      className={`relative font-medium hover:text-lime-500 transition-colors duration-300 ${
        isScrolled ? 'text-slate-700' : 'text-slate-700'
      }`}
    >
      {label}
      <motion.span
        className="absolute -bottom-1 left-0 w-0 h-0.5 bg-lime-500"
        whileHover={{ width: '100%' }}
        transition={{ duration: 0.3 }}
      />
    </a>
  );
};

const MobileNavLink = ({ href, label, onClick }: { href: string; label: string; onClick: () => void }) => {
  return (
    <a
      href={href}
      className="font-medium text-slate-700 hover:text-lime-500 transition-colors duration-300"
      onClick={onClick}
    >
      {label}
    </a>
  );
};