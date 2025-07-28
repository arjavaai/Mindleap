import React, { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';

interface StudentAuthGuardProps {
  children: React.ReactNode;
}

const StudentAuthGuard: React.FC<StudentAuthGuardProps> = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to access the student dashboard.</p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default StudentAuthGuard; 