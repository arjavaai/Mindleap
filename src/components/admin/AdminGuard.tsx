
import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { ShieldX } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard = ({ children }: AdminGuardProps) => {
  const [user, loading] = useAuthState(auth);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    console.log('AdminGuard - User state:', user);
    console.log('AdminGuard - User email:', user?.email);
    console.log('AdminGuard - Loading:', loading);

    if (!loading) {
      if (user && user.email === 'admin@gmail.com') {
        console.log('AdminGuard - Admin user authorized');
        setIsAuthorized(true);
      } else {
        console.log('AdminGuard - User not authorized or no user');
        setIsAuthorized(false);
      }
      setCheckingAuth(false);
    }
  }, [user, loading]);

  if (loading || checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Access Required</h2>
          <p className="text-gray-600 mb-4">Please login with admin credentials to access this panel.</p>
          <button 
            onClick={() => window.location.href = '/auth'}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <ShieldX className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-red-600 mb-4">403 Unauthorized</h2>
          <p className="text-gray-600 mb-4">
            Current user: {user.email}
          </p>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin panel. Only authorized administrators can access this area.
          </p>
          <button 
            onClick={() => {
              auth.signOut();
              window.location.href = '/auth';
            }}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
