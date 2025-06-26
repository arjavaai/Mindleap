
import { useEffect } from 'react';

interface PageAnimationConfig {
  enableScrollAnimations?: boolean;
  enablePageLoadAnimations?: boolean;
  reducedMotionRespect?: boolean;
}

export const usePageAnimations = (config: PageAnimationConfig = {}) => {
  const {
    enableScrollAnimations = true,
    enablePageLoadAnimations = true,
    reducedMotionRespect = true
  } = config;

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (reducedMotionRespect && prefersReducedMotion) {
      // Add class to disable animations for users who prefer reduced motion
      document.body.classList.add('prefers-reduced-motion');
      return;
    }

    // Initialize page load animations
    if (enablePageLoadAnimations) {
      const animatedElements = document.querySelectorAll('.animate-on-load');
      animatedElements.forEach((element, index) => {
        setTimeout(() => {
          element.classList.add('animate-fade-in');
        }, index * 100);
      });
    }

    // Performance optimization: throttle scroll events on mobile
    const isMobile = window.innerWidth <= 768;
    let ticking = false;

    const optimizeScrollPerformance = () => {
      if (!ticking && enableScrollAnimations) {
        requestAnimationFrame(() => {
          // Force reflow for any lazy-loaded scroll animations
          const hiddenElements = document.querySelectorAll('.scroll-hidden:not(.scroll-visible)');
          hiddenElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            
            if (isVisible && !element.classList.contains('scroll-visible')) {
              element.classList.add('scroll-visible');
            }
          });
          
          ticking = false;
        });
        ticking = true;
      }
    };

    // Add scroll listener for performance optimization
    if (isMobile && enableScrollAnimations) {
      let scrollTimeout: NodeJS.Timeout;
      const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(optimizeScrollPerformance, 10);
      };
      
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        window.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimeout);
      };
    }
  }, [enableScrollAnimations, enablePageLoadAnimations, reducedMotionRespect]);

  return {
    // Return animation utilities
    triggerAnimation: (selector: string, animationClass: string) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.classList.add(animationClass);
      });
    },
    
    resetAnimations: (selector: string) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.classList.remove('scroll-visible', 'animate-fade-in', 'animate-slide-in-left', 'animate-slide-in-right');
      });
    }
  };
};
