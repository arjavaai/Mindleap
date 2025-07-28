import React, { useEffect } from 'react';
import AuthInterface from '../components/auth/AuthInterface';
import Navbar from '../components/Navbar';

const Auth = () => {
  useEffect(() => {
    // Show normal cursor on auth page
    document.body.classList.add('show-cursor');
    
    return () => {
      // Keep the show-cursor class when leaving to avoid flicker
    };
  }, []);

  return (
    <>
      <Navbar />
      <AuthInterface />
    </>
  );
};

export default Auth;
