import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Plus, Edit, Trash2, Users, CheckCircle, XCircle, Eye, EyeOff, X } from 'lucide-react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { db, auth as mainAuth } from '../../lib/firebase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { useAdminPermissions } from './AdminContext';

// Secondary Firebase app for sub-admin creation (to avoid logging out admin)
const getSecondaryFirebaseApp = () => {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  
  return initializeApp(firebaseConfig, 'subAdminCreation-' + Date.now());
};

interface SubAdmin {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  createdAt: Date;
  isActive: boolean;
}

interface SubAdminFormData {
  email: string;
  password: string;
  role: string;
  permissions: string[];
}

const SubAdminManagementTab = () => {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<SubAdminFormData>({
    email: '',
    password: '',
    role: 'sub-admin',
    permissions: []
  });

  const availablePermissions = [
    'schools',
    'users',
    'states',
    'quizzes',
    'webinars',
    'workshops',
    'contact-queries',
    'school-requests',
    'questions'
  ];

  const permissionLabels = {
    schools: 'Schools Management',
    users: 'Users Management',
    states: 'States & Districts',
    quizzes: 'Quiz Management',
    webinars: 'Live Webinars',
    workshops: 'Workshops',
    'contact-queries': 'Contact Queries',
    'school-requests': 'School Requests',
    questions: 'Question Management'
  };

  useEffect(() => {
    fetchSubAdmins();
  }, []);

  const fetchSubAdmins = async () => {
    try {
      const subAdminsQuery = query(collection(db, 'subAdmins'));
      const subAdminsSnapshot = await getDocs(subAdminsQuery);
      
      const subAdminsData = subAdminsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as SubAdmin[];

      setSubAdmins(subAdminsData);
    } catch (error) {
      console.error('Error fetching sub-admins:', error);
      toast.error('Failed to fetch sub-admins');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || formData.permissions.length === 0) {
      toast.error('Please fill all fields and select at least one permission');
      return;
    }

    try {
      // Create Firebase Auth user using secondary app to avoid logging out admin
      const secondaryApp = getSecondaryFirebaseApp();
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      
      // Sign out from secondary auth immediately to prevent admin logout
      await secondaryAuth.signOut();
      
      // Add to sub-admins collection
      await addDoc(collection(db, 'subAdmins'), {
        email: formData.email,
        role: formData.role,
        permissions: formData.permissions,
        createdAt: new Date(),
        isActive: true,
        authUid: userCredential.user.uid
      });

      toast.success('Sub-admin created successfully');
      setShowForm(false);
      setFormData({ email: '', password: '', role: 'sub-admin', permissions: [] });
      fetchSubAdmins();
    } catch (error: any) {
      console.error('Error creating sub-admin:', error);
      toast.error(error.message || 'Failed to create sub-admin');
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(p => p !== permission)
      }));
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'subAdmins', id), {
        isActive: !currentStatus
      });
      
      toast.success(`Sub-admin ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchSubAdmins();
    } catch (error) {
      console.error('Error updating sub-admin status:', error);
      toast.error('Failed to update sub-admin status');
    }
  };

  const handleDeleteSubAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sub-admin? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'subAdmins', id));
      toast.success('Sub-admin deleted successfully');
      fetchSubAdmins();
    } catch (error) {
      console.error('Error deleting sub-admin:', error);
      toast.error('Failed to delete sub-admin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Sub-Admin Management</h2>
          <p className="text-gray-600 text-sm md:text-base">Manage sub-administrators and their permissions</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-sm md:text-base"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Sub-Admin
        </Button>
      </div>

      {/* Sub-Admin List */}
      <div className="grid gap-4">
        {subAdmins.map((subAdmin) => (
          <motion.div
            key={subAdmin.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{subAdmin.email}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Role: {subAdmin.role}</p>
                  <p className="text-xs text-gray-500">
                    Created: {subAdmin.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={subAdmin.isActive ? "default" : "secondary"} className="text-xs">
                  {subAdmin.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleActive(subAdmin.id, subAdmin.isActive)}
                  className="h-8 w-8 p-0"
                >
                  {subAdmin.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSubAdmin(subAdmin.id)}
                  className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Permissions */}
            <div className="mt-4">
              <Label className="text-sm font-medium">Permissions:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {subAdmin.permissions.map((permission) => (
                  <Badge key={permission} variant="secondary" className="text-xs">
                    {permissionLabels[permission as keyof typeof permissionLabels] || permission}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Sub-Admin Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Sub-Admin</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({...prev, role: e.target.value}))}
                placeholder="sub-admin"
              />
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {availablePermissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission}
                      checked={formData.permissions.includes(permission)}
                      onCheckedChange={(checked) => handlePermissionChange(permission, checked as boolean)}
                    />
                    <Label htmlFor={permission} className="text-sm">
                      {permissionLabels[permission as keyof typeof permissionLabels] || permission}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                Create Sub-Admin
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubAdminManagementTab; 