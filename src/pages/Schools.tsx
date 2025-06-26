
import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgressButton from '../components/ScrollProgressButton';
import SchoolsHero from '../components/schools/SchoolsHero';
import WhyPartnerWithMindLeap from '../components/schools/WhyPartnerWithMindLeap';

import WhatSchoolsReceive from '../components/schools/WhatSchoolsReceive';
import SchoolTestimonials from '../components/schools/SchoolTestimonials';
import SchoolInquiryForm from '../components/schools/SchoolInquiryForm';

const Schools = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <CustomCursor />
      <ScrollProgressButton />
      <Navbar />
      <SchoolsHero />
      <WhyPartnerWithMindLeap />
      <WhatSchoolsReceive />
      <SchoolTestimonials />
      <SchoolInquiryForm />
      <Footer />
    </div>
  );
};

export default Schools;
