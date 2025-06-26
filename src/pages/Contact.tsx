
import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import ContactUs from '../components/ContactUs';
import Footer from '../components/Footer';
import { initializeEnvironment } from '../utils/environmentUtils';

const Contact = () => {
  useEffect(() => {
    // Initialize environment for consistent rendering
    initializeEnvironment();
    
    // Show default cursor for contact page
    document.body.classList.add('show-cursor');
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    return () => {
      // Cleanup
      document.body.classList.remove('show-cursor');
    };
  }, []);

  return (
    <div className="font-poppins min-h-screen">
      <Navbar />
      <div className="pt-20">
        <ContactUs />
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
