
import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

const ScrollProgressButton = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      
      setScrollProgress(progress);
      setIsVisible(scrollTop > 200); // Show button after scrolling 200px
    };

    window.addEventListener('scroll', updateScrollProgress);
    updateScrollProgress(); // Initial call

    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  const circumference = 2 * Math.PI * 20; // radius = 20
  const strokeDasharray = `${(scrollProgress / 100) * circumference} ${circumference}`;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-deep-blue text-white rounded-full shadow-lg"
      aria-label="Back to top"
      style={{ outline: 'none', border: 'none' }}
    >
      {/* Progress Ring */}
      <svg 
        className="absolute inset-0 w-full h-full transform -rotate-90" 
        viewBox="0 0 48 48"
      >
        {/* Background Circle */}
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
        />
        {/* Progress Circle */}
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      
      {/* Up Arrow Icon */}
      <ChevronUp 
        className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" 
      />
    </button>
  );
};

export default ScrollProgressButton;
