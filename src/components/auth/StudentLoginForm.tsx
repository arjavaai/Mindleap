
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';

interface StudentLoginFormProps {
  onToggleForm: () => void;
}

const StudentLoginForm = ({ onToggleForm }: StudentLoginFormProps) => {
  const [formData, setFormData] = useState({
    studentId: '',
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

    if (!formData.studentId) {
      newErrors.studentId = 'Student ID is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      console.log('Attempting login with Student ID:', formData.studentId);
      
      // First, verify the student exists in our database
      const studentsQuery = query(
        collection(db, 'students'), 
        where('studentId', '==', formData.studentId)
      );
      
      const studentSnapshot = await getDocs(studentsQuery);
      
      if (studentSnapshot.empty) {
        console.log('Student not found in database for ID:', formData.studentId);
        toast({
          title: "Student Not Found",
          description: "Student ID not found in our records. Please check your Student ID.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const studentData = studentSnapshot.docs[0].data();
      console.log('Student found in database:', {
        name: studentData.name,
        email: studentData.email,
        hasPassword: !!studentData.password
      });
      
      // Check if the password matches what's stored in our database
      if (studentData.password !== formData.password) {
        console.log('Password mismatch for student:', studentData.name);
        toast({
          title: "Invalid Password",
          description: "Incorrect password. Please try again.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Use the actual email that was used to create the Firebase Auth account
      // This could be either a custom email or the system email format
      const email = studentData.email || `${formData.studentId}@mindleap.edu`;
      console.log('Attempting Firebase Auth with email:', email);
      
      await signInWithEmailAndPassword(auth, email, formData.password);
      
      console.log('Login successful for student:', studentData.name);
      
      toast({
        title: "Welcome back!",
        description: `Successfully logged in as ${studentData.name}`,
      });
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = "Login failed. Please check your credentials.";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "Firebase Auth account not found. Please contact admin.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password. Please try again.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Please enter a valid Student ID.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        case 'auth/user-disabled':
          errorMessage = "Your account has been disabled. Please contact admin.";
          break;
      }
      
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 font-poppins mb-2">
          Student Login 🎯
        </h2>
        <p className="text-gray-600 text-sm">
          Enter your Student ID and password to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student ID Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 font-poppins">
            Student ID
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="Enter your Student ID"
              className={`pl-10 h-12 transition-all duration-200 ${
                errors.studentId 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'focus:border-orange-500 focus:ring-orange-500/20'
              }`}
            />
          </div>
          {errors.studentId && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-xs font-medium"
            >
              {errors.studentId}
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
              placeholder="Enter your password"
              className={`pl-10 pr-10 h-12 transition-all duration-200 ${
                errors.password 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'focus:border-orange-500 focus:ring-orange-500/20'
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
          className="w-full h-12 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
              Logging in...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              Login
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </Button>

        {/* Toggle to Admin Login */}
        <div className="text-center pt-4">
          <p className="text-gray-600 text-sm font-poppins">
            Are you an admin?{' '}
            <button
              type="button"
              onClick={onToggleForm}
              className="text-orange-500 hover:text-orange-600 font-bold transition-colors"
            >
              Admin Login
            </button>
          </p>
        </div>
      </form>
    </motion.div>
  );
};

export default StudentLoginForm;
