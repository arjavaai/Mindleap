import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import AboutMindLeap from '../components/AboutMindLeap';
import WhyMindLeapVideo from '../components/WhyMindLeapVideo';
import WhySkillsMatter from '../components/WhySkillsMatter';
import FourPillars from '../components/FourPillars';
import WhyAreWeUnique from '../components/WhyAreWeUnique';
import HowItWorks from '../components/HowItWorks';
import TopPerformers from '../components/TopPerformers';
import WhatStudentGets from '../components/WhatStudentGets';
import WhatSchoolGets from '../components/WhatSchoolGets';
import Testimonials from '../components/Testimonials';
import JoinTheMovement from '../components/JoinTheMovement';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgressButton from '../components/ScrollProgressButton';
import { usePageAnimations } from '../hooks/usePageAnimations';

const Index = () => {
  // Initialize page animations
  const { triggerAnimation } = usePageAnimations({
    enableScrollAnimations: true,
    enablePageLoadAnimations: true,
    reducedMotionRespect: true
  });

  useEffect(() => {
    // Remove show-cursor class for homepage to enable custom cursor
    document.body.classList.remove('show-cursor');
    
    // Scroll to top on page load
    window.scrollTo(0, 0);
    
    // Trigger initial page load animations
    setTimeout(() => {
      triggerAnimation('.animate-on-load', 'animate-fade-in');
    }, 100);
    
    return () => {
      // Cleanup
      document.body.classList.remove('show-cursor');
    };
  }, [triggerAnimation]);

  return (
    <div className="font-poppins cursor-none">
      <CustomCursor />
      <Navbar />
      <div id="home" className="animate-on-load">
        <HeroSection />
      </div>
      <div id="about-mindleap" className="animate-on-load">
        <AboutMindLeap />
      </div>
      <div className="animate-on-load">
        <WhyMindLeapVideo />
      </div>
      <div id="why-skills-matter" className="animate-on-load">
        <WhySkillsMatter />
      </div>
      <div id="four-pillars" className="animate-on-load">
        <FourPillars />
      </div>
      <div className="animate-on-load">
        <WhyAreWeUnique />
      </div>
      <div className="animate-on-load">
        <HowItWorks />
      </div>
      <div id="top-performers" className="animate-on-load">
        <TopPerformers />
      </div>
      <div id="what-students-get" className="animate-on-load">
        <WhatStudentGets />
      </div>
      <div className="animate-on-load">
        <WhatSchoolGets />
      </div>
      <div className="animate-on-load">
        <Testimonials />
      </div>
      <div className="animate-on-load">
        <JoinTheMovement />
      </div>
      <Footer />
      <ScrollProgressButton />
    </div>
  );
};

export default Index;
