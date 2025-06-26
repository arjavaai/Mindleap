import React from 'react';
import { MapPin, Globe, Mail, Phone, Instagram, Youtube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const navigate = useNavigate();

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
  };

  const handleAboutClick = () => {
    navigate('/about');
  };

  const handleProgramsClick = () => {
    navigate('/programs');
  };

  const handleFAQClick = () => {
    navigate('/faq');
  };

  const handleParentsClick = () => {
    navigate('/parents');
  };

  const handleSchoolsClick = () => {
    navigate('/schools');
  };

  const handleContactClick = () => {
    navigate('/contact');
  };

  const navItems = [{
    label: 'Home',
    id: 'home'
  }, {
    label: 'About Us',
    id: 'about',
    isPage: true,
    action: 'about'
  }, {
    label: 'Programs',
    id: 'programs',
    isPage: true,
    action: 'programs'
  }, {
    label: 'For Schools',
    id: 'schools',
    isPage: true,
    action: 'schools'
  }, {
    label: 'For Parents',
    id: 'parents',
    isPage: true,
    action: 'parents'
  }, {
    label: 'Why Skills Matter',
    id: 'why-skills-matter'
  }, {
    label: 'Four Pillars',
    id: 'four-pillars'
  }, {
    label: 'What Students Get',
    id: 'what-students-get'
  }, {
    label: 'What School Gets',
    id: 'what-school-gets'
  }, {
    label: 'Join The Movement',
    id: 'join-the-movement'
  }, {
    label: 'Contact',
    id: 'contact',
    isPage: true,
    action: 'contact'
  }, {
    label: 'FAQ',
    id: 'faq',
    isPage: true,
    action: 'faq'
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

  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 sm:py-10 px-4 sm:px-6 md:px-8 lg:px-12">
        
        {/* Mobile Logo Section - Large and Centered */}
        <div className="md:hidden mb-8 text-center">
          <div className="mb-6">
            <img 
              src="/lovable-uploads/7f6ab2a8-9863-4f75-ae5a-f2b087639caa.png" 
              alt="MindLeap Logo" 
              className="h-24 sm:h-32 w-auto mx-auto cursor-pointer hover:scale-105 transition-transform duration-300" 
              onClick={() => navigate('/')} 
            />
          </div>
          <p className="text-sm text-gray-600 font-poppins max-w-sm mx-auto">
            Empowering students with essential life skills through innovative learning experiences.
          </p>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
          {/* Left Column - Logo & Tagline (Desktop Only) */}
          <div className="hidden md:block text-center md:text-left">
            <div className="mb-4 sm:mb-6">
              <img src="/lovable-uploads/7f6ab2a8-9863-4f75-ae5a-f2b087639caa.png" alt="MindLeap Logo" className="h-12 sm:h-16 md:h-20 lg:h-24 w-auto mx-auto md:mx-0 cursor-pointer" onClick={() => navigate('/')} />
            </div>
            <div className="space-y-2">
              <p className="text-sm sm:text-base text-deep-blue font-poppins font-bold tracking-wider uppercase"></p>
              <p className="text-xs sm:text-sm text-gray-600 font-poppins max-w-xs mx-auto md:mx-0">
                Empowering students with essential life skills through innovative learning experiences.
              </p>
            </div>
          </div>

          {/* Middle Column - Navigation Links */}
          <div className="text-center md:text-left">
            <h3 className="text-base sm:text-lg font-bold text-deep-blue font-poppins mb-4 sm:mb-6">Quick Links</h3>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {navItems.map(item => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className="text-gray-600 font-poppins hover:text-vibrant-orange transition-colors duration-300 text-left text-xs sm:text-sm py-1 sm:py-1.5"
                >
                  {item.label}
                </button>
              ))}
            </div>
            {/* Social Media Icons */}
            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://www.instagram.com/mind_leap_official?igsh=MTJ4NWJnenhnZHZtbw%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-vibrant-orange transition-colors duration-300"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href="https://youtube.com/@mindleapofficial?si=ZokigqZNrF7bmleZ"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-vibrant-orange transition-colors duration-300"
              >
                <Youtube className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Right Column - Contact Details */}
          <div className="text-center md:text-left">
            <h3 className="text-base sm:text-lg font-bold text-deep-blue font-poppins mb-4 sm:mb-6">Contact</h3>
            <div className="space-y-3 sm:space-y-4">
              {/* Address */}
              <div className="flex items-center justify-center md:justify-start gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-vibrant-orange flex-shrink-0" />
                <span className="text-gray-600 font-poppins text-sm sm:text-base">Guntur, Andhra Pradesh</span>
              </div>

              {/* Website */}
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-vibrant-orange flex-shrink-0" />
                <a href="https://www.mindleap.org.in" target="_blank" rel="noopener noreferrer" className="text-gray-600 font-poppins hover:text-vibrant-orange transition-colors duration-300 text-sm sm:text-base">
                  mindleap.org.in
                </a>
              </div>

              {/* Email */}
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-vibrant-orange flex-shrink-0" />
                <a href="mailto:support@mindleap.org.in" className="text-gray-600 font-poppins hover:text-vibrant-orange transition-colors duration-300 text-sm sm:text-base">
                  support@mindleap.org.in
                </a>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-vibrant-orange flex-shrink-0" />
                <a href="tel:+918886554455" className="text-gray-600 font-poppins hover:text-vibrant-orange transition-colors duration-300 text-sm sm:text-base">
                  +91 8886 55 44 55
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Links Section */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            {/* Legal Links */}
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 sm:gap-6">
              <button onClick={() => navigate('/privacy-policy')} className="text-xs sm:text-sm text-gray-500 font-poppins hover:text-vibrant-orange hover:underline transition-colors duration-300">
                Privacy Policy
              </button>
              <button onClick={() => navigate('/terms')} className="text-xs sm:text-sm text-gray-500 font-poppins hover:text-vibrant-orange hover:underline transition-colors duration-300">
                Terms & Conditions
              </button>
              <button onClick={() => navigate('/refund-policy')} className="text-xs sm:text-sm text-gray-500 font-poppins hover:text-vibrant-orange hover:underline transition-colors duration-300">
                Refund Policy
              </button>
            </div>

            {/* Copyright */}
            <p className="text-center text-xs sm:text-sm text-gray-500 font-poppins">
              © 2025 MindLeap. All rights reserved.
            </p>
          </div>
          
          {/* Credits */}
          <div className="text-center mt-4 text-xs text-gray-400 font-poppins">
            Designed & Developed by{' '}
            <a 
              href="https://webbingprotechnologies.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-vibrant-orange hover:underline"
            >
              Webbing Pro Technologies
            </a>
            {' '}– 9059329297
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
