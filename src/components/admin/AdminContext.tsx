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
      if (!user) {
        setIsAdmin(false);
        setIsSubAdmin(false);
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        // Check if user is main admin
        const adminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'admin@gmail.com';
        
        if (user.email === adminEmail) {
          setIsAdmin(true);
          setIsSubAdmin(false);
          setPermissions(['all']); // Main admin has all permissions
          setLoading(false);
          return;
        }

        // Check if user is sub-admin
        const subAdminQuery = query(
          collection(db, 'subAdmins'),
          where('email', '==', user.email),
          where('isActive', '==', true)
        );
        
        const subAdminSnapshot = await getDocs(subAdminQuery);
        
        if (!subAdminSnapshot.empty) {
          const subAdminData = subAdminSnapshot.docs[0].data();
          setIsSubAdmin(true);
          setIsAdmin(false);
          setPermissions(subAdminData.permissions || []);
        } else {
          setIsAdmin(false);
          setIsSubAdmin(false);
          setPermissions([]);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setIsSubAdmin(false);
        setPermissions([]);
      } finally {
        // Add a small delay to prevent 403 flash
        setTimeout(() => {
          setLoading(false);
        }, 200);
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