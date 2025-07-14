import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../lib/firebase';
import { ProfileModal } from './student';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    // If we're not on the home page, navigate to home first
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
    setIsMenuOpen(false);
  };

  const handleAboutClick = () => {
    navigate('/about');
    setIsMenuOpen(false);
  };

  const handleProgramsClick = () => {
    navigate('/programs');
    setIsMenuOpen(false);
  };

  const handleFAQClick = () => {
    navigate('/faq');
    setIsMenuOpen(false);
  };

  const handleParentsClick = () => {
    navigate('/parents');
    setIsMenuOpen(false);
  };

  const handleSchoolsClick = () => {
    navigate('/schools');
    setIsMenuOpen(false);
  };

  const handleContactClick = () => {
    navigate('/contact');
    setIsMenuOpen(false);
  };

  const navItems = [{
    label: 'Home',
    id: 'home',
    path: '/'
  }, {
    label: 'About Us',
    id: 'about',
    isPage: true,
    action: 'about',
    path: '/about'
  }, {
    label: 'Programs',
    id: 'programs',
    isPage: true,
    action: 'programs',
    path: '/programs'
  }, {
    label: 'For Parents',
    id: 'parents',
    isPage: true,
    action: 'parents',
    path: '/parents'
  }, {
    label: 'For Schools',
    id: 'schools',
    isPage: true,
    action: 'schools',
    path: '/schools'
  }, {
    label: 'FAQ',
    id: 'faq',
    isPage: true,
    action: 'faq',
    path: '/faq'
  }, {
    label: 'Contact',
    id: 'contact',
    isPage: true,
    action: 'contact',
    path: '/contact'
  }];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.action === 'about') {
      handleAboutClick();
    } else if (item.action === 'programs') {
      handleProgramsClick();
    } else if (item.action === 'schools') {
      handleSchoolsClick();
    } else if (item.action === 'faq') {
      handleFAQClick();
    } else if (item.action === 'parents') {
      handleParentsClick();
    } else if (item.action === 'contact') {
      handleContactClick();
    } else {
      scrollToSection(item.id);
    }
  };

  const isActiveRoute = (item: typeof navItems[0]) => {
    if (item.path) {
      return location.pathname === item.path;
    }
    return false;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0 py-2">
            <img 
              src="/lovable-uploads/7f6ab2a8-9863-4f75-ae5a-f2b087639caa.png" 
              alt="MindLeap - Ignite Young Minds" 
              className="h-16 md:h-18 lg:h-20 w-auto max-h-full cursor-pointer" 
              onClick={() => navigate('/')} 
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(item => (
              <button 
                key={item.label} 
                onClick={() => handleNavClick(item)} 
                className={`font-medium font-poppins transition-colors duration-300 relative group ${
                  isActiveRoute(item) 
                    ? 'text-vibrant-orange' 
                    : 'text-deep-blue hover:text-vibrant-orange'
                }`}
              >
                {item.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-vibrant-orange transition-all duration-300 ${
                  isActiveRoute(item) 
                    ? 'w-full' 
                    : 'w-0 group-hover:w-full'
                }`}></span>
              </button>
            ))}
            
            {/* Login Button */}
            {user ? (
              <ProfileModal studentId={user.uid} />
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="bg-vibrant-orange text-white px-6 py-2 rounded-full font-medium font-poppins transition-all duration-300 hover:bg-deep-blue hover:scale-105 shadow-md hover:shadow-lg"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-deep-blue hover:text-vibrant-orange transition-colors duration-300">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <div className="py-4 space-y-4 pb-6">
            {navItems.map(item => (
              <button 
                key={item.label} 
                onClick={() => handleNavClick(item)} 
                className={`block w-full text-left font-medium font-poppins transition-colors duration-300 py-2 ${
                  isActiveRoute(item) 
                    ? 'text-vibrant-orange' 
                    : 'text-deep-blue hover:text-vibrant-orange'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {/* Mobile Login Button */}
            <div className="pt-4 pb-2">
              {user ? (
                <ProfileModal studentId={user.uid} />
              ) : (
                <button
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-vibrant-orange text-white px-6 py-3 rounded-full font-medium font-poppins transition-all duration-300 hover:bg-deep-blue shadow-md hover:shadow-lg"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
