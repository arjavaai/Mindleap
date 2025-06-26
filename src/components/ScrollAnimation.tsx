
import React, { ReactNode } from 'react';
import { useInView } from '../hooks/useInView';

interface ScrollAnimationProps {
  children: ReactNode;
  animation?: 'fadeUp' | 'slideLeft' | 'slideRight' | 'scale';
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

const ScrollAnimation = ({ 
  children, 
  animation = 'fadeUp', 
  delay = 0,
  duration = 0.8,
  className = '',
  threshold = 0.1,
  triggerOnce = true
}: ScrollAnimationProps) => {
  const { ref, isInView } = useInView({ 
    threshold, 
    triggerOnce,
    rootMargin: '50px 0px -50px 0px' // Start animation slightly before element is fully visible
  });

  const getAnimationClass = () => {
    switch (animation) {
      case 'slideLeft':
        return 'scroll-slide-left';
      case 'slideRight':
        return 'scroll-slide-right';
      case 'scale':
        return 'scroll-scale';
      default:
        return 'scroll-hidden';
    }
  };

  // Mobile detection for reduced animations
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const reducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Adjust duration for mobile and reduced motion
  const finalDuration = reducedMotion ? 0.3 : (isMobile ? duration * 0.7 : duration);
  const finalDelay = reducedMotion ? 0 : (isMobile ? delay * 0.5 : delay);

  return (
    <div
      ref={ref}
      className={`${getAnimationClass()} ${isInView ? 'scroll-visible' : ''} ${className}`}
      style={{
        transitionDelay: `${finalDelay}ms`,
        transitionDuration: `${finalDuration}s`,
        willChange: isInView ? 'auto' : 'transform, opacity' // Performance optimization
      }}
    >
      {children}
    </div>
  );
};

export default ScrollAnimation;
