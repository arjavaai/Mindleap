
import React from 'react';
import { ShieldX } from 'lucide-react';
import { AdminProvider, useAdminPermissions } from './AdminContext';

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuardContent = ({ children }: AdminGuardProps) => {
  const { isAdmin, isSubAdmin, loading } = useAdminPermissions();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAdmin && !isSubAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <ShieldX className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-red-600 mb-4">403 Unauthorized</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin panel. Only authorized administrators can access this area.
          </p>
          <button 
            onClick={() => window.location.href = '/auth'}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const AdminGuard = ({ children }: AdminGuardProps) => {
  return (
    <AdminProvider>
      <AdminGuardContent>{children}</AdminGuardContent>
    </AdminProvider>
  );
};

export default AdminGuard;
