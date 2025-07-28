import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';

interface AdminContextType {
  isAdmin: boolean;
  isSubAdmin: boolean;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  canDelete: boolean;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdminPermissions = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminPermissions must be used within an AdminProvider');
  }
  return context;
};

interface AdminProviderProps {
  children: React.ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('🔍 AdminContext: Checking admin status...', { user: user?.email });
      
      if (!user) {
        console.log('🔍 AdminContext: No user found, setting loading to false');
        setIsAdmin(false);
        setIsSubAdmin(false);
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 AdminContext: User found, checking permissions...', { email: user.email });
        
        // Check if user is main admin
        const adminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'admin@gmail.com';
        console.log('🔍 AdminContext: Comparing with admin email:', { userEmail: user.email, adminEmail });
        
        if (user.email === adminEmail) {
          console.log('✅ AdminContext: User is main admin');
          setIsAdmin(true);
          setIsSubAdmin(false);
          setPermissions(['all']); // Main admin has all permissions
          setLoading(false);
          return;
        }

        console.log('🔍 AdminContext: Checking sub-admin status...');
        // Check if user is sub-admin
        const subAdminQuery = query(
          collection(db, 'subAdmins'),
          where('email', '==', user.email),
          where('isActive', '==', true)
        );
        
        const subAdminSnapshot = await getDocs(subAdminQuery);
        
        if (!subAdminSnapshot.empty) {
          const subAdminData = subAdminSnapshot.docs[0].data();
          console.log('✅ AdminContext: User is sub-admin', { permissions: subAdminData.permissions });
          setIsSubAdmin(true);
          setIsAdmin(false);
          setPermissions(subAdminData.permissions || []);
        } else {
          console.log('❌ AdminContext: User is not admin or sub-admin');
          setIsAdmin(false);
          setIsSubAdmin(false);
          setPermissions([]);
        }
      } catch (error) {
        console.error('❌ AdminContext: Error checking admin status:', error);
        setIsAdmin(false);
        setIsSubAdmin(false);
        setPermissions([]);
      } finally {
        console.log('🔍 AdminContext: Setting loading to false');
        // Add a small delay to prevent 403 flash
        setTimeout(() => {
          setLoading(false);
        }, 100);
      }
    };

    checkAdminStatus();
  }, [user]);

  const hasPermission = (permission: string): boolean => {
    if (isAdmin) return true; // Main admin has all permissions
    return permissions.includes(permission);
  };

  const canDelete = isAdmin; // Only main admin can delete

  const value: AdminContextType = {
    isAdmin,
    isSubAdmin,
    permissions,
    hasPermission,
    canDelete,
    loading
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext; 