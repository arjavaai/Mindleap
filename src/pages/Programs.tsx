
import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgressButton from '../components/ScrollProgressButton';
import ProgramsHero from '../components/programs/ProgramsHero';
import DailyStreakSection from '../components/programs/DailyStreakSection';
import WebinarsSection from '../components/programs/WebinarsSection';
import QuizzesSection from '../components/programs/QuizzesSection';
import BadgesSection from '../components/programs/BadgesSection';
import ProgramsCTA from '../components/programs/ProgramsCTA';

const Programs = () => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <CustomCursor />
      <ScrollProgressButton />
      <Navbar />
      <ProgramsHero />
      <DailyStreakSection />
      <WebinarsSection />
      <QuizzesSection />
      <BadgesSection />
      <ProgramsCTA />
      <Footer />
    </div>
  );
};

export default Programs;
