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
  const [cache, setCache] = useState<{[key: string]: {isAdmin: boolean, isSubAdmin: boolean, permissions: string[], timestamp: number}}>({});

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsSubAdmin(false);
        setPermissions([]);
        setLoading(false);
        return;
      }

      // Check cache first (cache for 5 minutes)
      const cacheKey = user.email;
      const cached = cache[cacheKey];
      const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setIsAdmin(cached.isAdmin);
        setIsSubAdmin(cached.isSubAdmin);
        setPermissions(cached.permissions);
        setLoading(false);
        return;
      }

      try {
        // Check if user is main admin (fast check, no DB query needed)
        const adminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'admin@gmail.com';

        if (user.email === adminEmail) {
          const adminData = {
            isAdmin: true,
            isSubAdmin: false,
            permissions: ['all']
          };
          setIsAdmin(true);
          setIsSubAdmin(false);
          setPermissions(['all']);

          // Cache the result
          setCache(prev => ({
            ...prev,
            [cacheKey]: { ...adminData, timestamp: Date.now() }
          }));

          setLoading(false);
          return;
        }

        // Check if user is sub-admin (single optimized query)
        const subAdminQuery = query(
          collection(db, 'subAdmins'),
          where('email', '==', user.email),
          where('isActive', '==', true)
        );

        const subAdminSnapshot = await getDocs(subAdminQuery);

        let result = {
          isAdmin: false,
          isSubAdmin: false,
          permissions: [] as string[]
        };

        if (!subAdminSnapshot.empty) {
          const subAdminData = subAdminSnapshot.docs[0].data();
          result = {
            isAdmin: false,
            isSubAdmin: true,
            permissions: subAdminData.permissions || []
          };
        }

        // Update state
        setIsAdmin(result.isAdmin);
        setIsSubAdmin(result.isSubAdmin);
        setPermissions(result.permissions);

        // Cache the result
        setCache(prev => ({
          ...prev,
          [cacheKey]: { ...result, timestamp: Date.now() }
        }));

      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setIsSubAdmin(false);
        setPermissions([]);
      } finally {
        // Reduced delay to 50ms for faster loading
        setTimeout(() => {
          setLoading(false);
        }, 50);
      }
    };

    checkAdminStatus();
  }, [user, cache]);

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