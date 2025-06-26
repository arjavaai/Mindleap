import React, { useEffect } from 'react';
import AdminGuard from '../components/admin/AdminGuard';
import AdminPanel from '../components/admin/AdminPanel';

const Admin = () => {
  useEffect(() => {
    // Show normal cursor on admin page
    document.body.classList.add('show-cursor');
    
    return () => {
      // Keep the show-cursor class when leaving to avoid flicker
    };
  }, []);

  return (
    <AdminGuard>
      <AdminPanel />
    </AdminGuard>
  );
};

export default Admin;
