
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { User, Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface AdminLoginFormProps {
  onToggleForm: () => void;
}

const AdminLoginForm = ({ onToggleForm }: AdminLoginFormProps) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createAdminUser = async () => {
    try {
      const adminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'admin@gmail.com';
      const adminPassword = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || 'admin12345';
      console.log('Debug: Creating admin user with email:', adminEmail);
      await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('Admin user created successfully');
      return true;
    } catch (error: any) {
      console.error('Error creating admin user:', error.code, error.message, error);
      if (error.code === 'auth/email-already-in-use') {
        // User exists, try to sign in again
        console.log('Debug: Admin user already exists, proceeding with login');
        return true;
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Get admin credentials from environment variables
      const adminEmail = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'admin@gmail.com';
      const adminPassword = import.meta.env.VITE_SUPER_ADMIN_PASSWORD || 'admin12345';
      
      console.log('Debug: Environment admin credentials:', {
        adminEmail,
        adminPassword: adminPassword ? '***' : 'MISSING',
        envVarEmail: import.meta.env.VITE_SUPER_ADMIN_EMAIL ? '***' : 'MISSING',
        envVarPassword: import.meta.env.VITE_SUPER_ADMIN_PASSWORD ? '***' : 'MISSING'
      });
      
      console.log('Debug: Form data:', {
        email: formData.email,
        password: formData.password ? '***' : 'MISSING'
      });
      
      // First, check if this is a main admin login
      const isMainAdmin = formData.email === adminEmail && formData.password === adminPassword;
      
      console.log('Debug: Main admin check:', {
        isMainAdmin,
        emailMatch: formData.email === adminEmail,
        passwordMatch: formData.password === adminPassword
      });
      
      if (isMainAdmin) {
        console.log('Debug: Attempting main admin login...');
        try {
          await signInWithEmailAndPassword(auth, formData.email, formData.password);
          
          console.log('Debug: Main admin login successful');
          toast({
            title: "Admin Access Granted",
            description: "Welcome to the MindLeap Admin Panel.",
          });
          
          // Redirect to admin panel
          window.location.href = '/admin';
          return;
        } catch (error: any) {
          console.log('Debug: Main admin login failed:', error.code, error.message);
          if (error.code === 'auth/user-not-found') {
            // Create admin user and try again
            console.log('Debug: User not found, creating admin user...');
            toast({
              title: "Creating Admin Account",
              description: "Setting up admin account for first time...",
            });
            
            const created = await createAdminUser();
            console.log('Debug: Admin user creation result:', created);
            if (created) {
              try {
                console.log('Debug: Retrying login after user creation...');
                await signInWithEmailAndPassword(auth, formData.email, formData.password);
                console.log('Debug: Login successful after user creation');
                toast({
                  title: "Admin Access Granted",
                  description: "Welcome to the MindLeap Admin Panel.",
                });
                window.location.href = '/admin';
                return;
              } catch (retryError: any) {
                console.error('Debug: Retry login failed:', retryError);
                toast({
                  title: "Admin Login Error",
                  description: "Failed to login after account creation. Please try again.",
                  variant: "destructive"
                });
                return;
              }
            }
          } else {
            console.error('Debug: Unexpected login error:', error);
            throw error; // Re-throw to be handled by outer catch
          }
        }
      }
      
      console.log('Debug: Not main admin, checking sub-admin...');
      // Check if this is a sub-admin
      const subAdminQuery = query(
        collection(db, 'subAdmins'),
        where('email', '==', formData.email),
        where('isActive', '==', true)
      );
      
      const subAdminSnapshot = await getDocs(subAdminQuery);
      console.log('Debug: Sub-admin query result:', {
        found: !subAdminSnapshot.empty,
        count: subAdminSnapshot.size
      });
      
      if (subAdminSnapshot.empty && !isMainAdmin) {
        console.log('Debug: No admin or sub-admin found for email:', formData.email);
        toast({
          title: "Access Denied",
          description: "This email is not registered as an admin or sub-admin.",
          variant: "destructive"
        });
        return;
      }
      
      // Try to sign in with Firebase Auth
      console.log('Debug: Attempting Firebase auth signin...');
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      console.log('Debug: Firebase auth signin successful');
      toast({
        title: "Admin Access Granted",
        description: "Welcome to the MindLeap Admin Panel.",
      });
      
      // Redirect to admin panel
      window.location.href = '/admin';
      
    } catch (error: any) {
      console.error('Debug: Login error caught in outer catch:', error.code, error.message, error);
      
      let errorMessage = "Login failed. Please check your credentials.";
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = "Incorrect password. Please try again.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Please enter a valid email address.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        case 'auth/user-not-found':
          errorMessage = "This email is not registered as an admin or sub-admin.";
          break;
        case 'auth/invalid-credential':
          errorMessage = "Invalid credentials. Please check your email and password.";
          break;
      }
      
      toast({
        title: "Admin Login Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-800 font-poppins">
            Admin Login 🔐
          </h2>
        </div>
        <p className="text-gray-600 text-sm">
          Administrative access only
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 font-poppins">
            Admin Email
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter admin email"
              className={`pl-10 h-12 transition-all duration-200 ${
                errors.email 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'focus:border-red-500 focus:ring-red-500/20'
              }`}
            />
          </div>
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-xs font-medium"
            >
              {errors.email}
            </motion.p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 font-poppins">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              className={`pl-10 pr-10 h-12 transition-all duration-200 ${
                errors.password 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'focus:border-red-500 focus:ring-red-500/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-xs font-medium"
            >
              {errors.password}
            </motion.p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Authenticating...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              Admin Login
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </Button>

        {/* Toggle to Student Login */}
        <div className="text-center pt-4">
          <p className="text-gray-600 text-sm font-poppins">
            Are you a student?{' '}
            <button
              type="button"
              onClick={onToggleForm}
              className="text-orange-500 hover:text-orange-600 font-bold transition-colors"
            >
              Student Login
            </button>
          </p>
        </div>
      </form>
    </motion.div>
  );
};

export default AdminLoginForm;
