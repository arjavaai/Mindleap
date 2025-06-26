
import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgressButton from '../components/ScrollProgressButton';
import ParentsHero from '../components/parents/ParentsHero';
import WhatMindLeapMeans from '../components/parents/WhatMindLeapMeans';
import HowToSupport from '../components/parents/HowToSupport';
import ParentTestimonials from '../components/parents/ParentTestimonials';
import ParentsCTA from '../components/parents/ParentsCTA';

const Parents = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <CustomCursor />
      <ScrollProgressButton />
      <Navbar />
      <ParentsHero />
      <WhatMindLeapMeans />
      <HowToSupport />
      <ParentTestimonials />
      <ParentsCTA />
      <Footer />
    </div>
  );
};

export default Parents;
