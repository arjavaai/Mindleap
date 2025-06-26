import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [cursorColor, setCursorColor] = useState('orange');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const location = useLocation();
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Don't show custom cursor on admin or auth pages
  const shouldHideCustomCursor = location.pathname === '/admin' || 
                                 location.pathname === '/auth' || 
                                 location.pathname === '/dashboard';

  // Check if any modal is open
  const checkModalState = useCallback(() => {
    const modalBackdrop = document.querySelector('.modal-backdrop');
    const modalRoot = document.getElementById('modal-root');
    const hasModal = modalBackdrop || (modalRoot && modalRoot.hasChildNodes());
    setIsModalOpen(!!hasModal);
  }, []);

  // Optimized background color detection with throttling
  const detectBackgroundColor = useCallback((x: number, y: number) => {
    const element = document.elementFromPoint(x, y);
    if (!element) return;

    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor;
    
    // Simplified background detection for better performance
    const hasOrangeBackground = element.closest('[class*="orange"], [class*="vibrant-orange"]') ||
                               backgroundColor.includes('255, 114, 44');

    const hasBlueBackground = element.closest('[class*="blue"], [class*="deep-blue"]') ||
                             backgroundColor.includes('10, 59, 119');

    const hasWhiteBackground = backgroundColor === 'rgb(255, 255, 255)' || 
                              backgroundColor === 'rgba(255, 255, 255, 1)' ||
                              element.closest('[class*="bg-white"]');

    const hasDarkBackground = backgroundColor.includes('rgb(0, 0, 0)') ||
                             element.closest('[class*="bg-black"], [class*="bg-gray-8"], [class*="bg-gray-9"]');

    // Set cursor color based on background
    if (hasOrangeBackground) {
      setCursorColor('blue');
    } else if (hasBlueBackground || hasDarkBackground) {
      setCursorColor('orange');
    } else if (hasWhiteBackground) {
      setCursorColor('blue');
    } else {
      setCursorColor('orange');
    }
  }, []);

  // Optimized position update using requestAnimationFrame
  const updateCursorPosition = useCallback((x: number, y: number) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      setPosition({ x, y });
      
      // Direct DOM manipulation for better performance
      if (cursorRef.current && ringRef.current) {
        cursorRef.current.style.transform = `translate3d(${x - 8}px, ${y - 8}px, 0)`;
        ringRef.current.style.transform = `translate3d(${x - 16}px, ${y - 16}px, 0)`;
      }
    });
  }, []);

  useEffect(() => {
    // Check if it's mobile or touch device
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Set up mutation observer to watch for modal changes
    const observer = new MutationObserver(checkModalState);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    // Initial modal state check
    checkModalState();

    // Throttled mouse move handler
    let lastMoveTime = 0;
    const updatePosition = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastMoveTime < 16) return; // Throttle to ~60fps
      lastMoveTime = now;

      const x = e.clientX;
      const y = e.clientY;
      
      updateCursorPosition(x, y);
      detectBackgroundColor(x, y);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.matches('button, a, [role="button"], .cursor-pointer, input, textarea, select') ||
                           target.closest('button, a, [role="button"], .cursor-pointer, [class*="hover:"], .group');
      setIsHovering(!!isInteractive);
    };

    // Only add mouse events if not mobile, should show custom cursor, and no modal is open
    if (!isMobile && !shouldHideCustomCursor && !isModalOpen) {
      document.addEventListener('mousemove', updatePosition, { passive: true });
      document.addEventListener('mousedown', handleMouseDown, { passive: true });
      document.addEventListener('mouseup', handleMouseUp, { passive: true });
      document.addEventListener('mouseover', handleMouseOver, { passive: true });
      
      // Hide default cursor on all elements
      const style = document.createElement('style');
      style.id = 'custom-cursor-styles';
      style.textContent = `
        *, *::before, *::after {
          cursor: none !important;
        }
        body, html {
          cursor: none !important;
        }
        input, textarea, select, button, a {
          cursor: none !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        window.removeEventListener('resize', checkMobile);
        observer.disconnect();
        document.removeEventListener('mousemove', updatePosition);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseover', handleMouseOver);
        
        // Remove custom cursor styles
        const existingStyle = document.getElementById('custom-cursor-styles');
        if (existingStyle) {
          document.head.removeChild(existingStyle);
        }
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      // Show default cursor when modal is open
      const existingStyle = document.getElementById('custom-cursor-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
      
      return () => {
        window.removeEventListener('resize', checkMobile);
        observer.disconnect();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isMobile, shouldHideCustomCursor, isModalOpen, updateCursorPosition, detectBackgroundColor, checkModalState]);

  // Don't render cursor on mobile, on pages where it should be hidden, or when modal is open
  if (isMobile || shouldHideCustomCursor || isModalOpen) {
    return null;
  }

  const getColors = () => {
    if (cursorColor === 'orange') {
      return {
        main: 'bg-vibrant-orange',
        ring: 'border-vibrant-orange',
        sparkle: 'bg-yellow-400'
      };
    } else {
      return {
        main: 'bg-deep-blue',
        ring: 'border-deep-blue',
        sparkle: 'bg-teal-custom'
      };
    }
  };

  const colors = getColors();

  return (
    <>
      {/* Main cursor dot */}
      <div
        ref={cursorRef}
        className={`fixed pointer-events-none z-[9999] w-4 h-4 rounded-full ${colors.main} transition-transform duration-100 ease-out ${
          isClicking
            ? 'scale-75'
            : isHovering
            ? 'scale-150'
            : 'scale-100'
        }`}
        style={{
          transform: `translate3d(${position.x - 8}px, ${position.y - 8}px, 0)`,
          willChange: 'transform',
        }}
      />
      
      {/* Outer ring */}
      <div
        ref={ringRef}
        className={`fixed pointer-events-none z-[9998] w-8 h-8 rounded-full border-2 ${colors.ring} transition-all duration-150 ease-out ${
          isClicking
            ? 'scale-50 opacity-80'
            : isHovering
            ? 'scale-200 opacity-60'
            : 'scale-100 opacity-40'
        }`}
        style={{
          transform: `translate3d(${position.x - 16}px, ${position.y - 16}px, 0)`,
          willChange: 'transform',
        }}
      />
      
      {/* Sparkle effect when hovering */}
      {isHovering && (
        <div
          className={`fixed pointer-events-none z-[9997] w-2 h-2 ${colors.sparkle} rounded-full animate-ping opacity-75`}
          style={{
            transform: `translate3d(${position.x - 4}px, ${position.y - 4}px, 0)`,
            willChange: 'transform',
          }}
        />
      )}
    </>
  );
};

export default CustomCursor;
