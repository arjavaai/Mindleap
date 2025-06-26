
import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgressButton from '../components/ScrollProgressButton';
import FAQ from '../components/FAQ';

const FAQPage = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <CustomCursor />
      <ScrollProgressButton />
      <Navbar />
      <FAQ />
      <Footer />
    </div>
  );
};

export default FAQPage;
