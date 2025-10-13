import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [studentId, setStudentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      console.log('🔍 Looking for student with ID:', studentId);
      
      // Step 1: Find student by Student ID in Firestore
      const studentsQuery = query(
        collection(db, 'students'),
        where('studentId', '==', studentId)
      );
      
      const studentSnapshot = await getDocs(studentsQuery);
      
      if (studentSnapshot.empty) {
        console.log('❌ Student not found for ID:', studentId);
        setError('Student ID not found. Please check your Student ID and try again.');
        toast({
          title: "Student Not Found",
          description: "The Student ID you entered was not found in our records.",
          variant: "destructive"
        });
        return;
      }

      const studentData = studentSnapshot.docs[0].data();
      const studentEmail = studentData.email; // This is the email stored in Firestore
      
      console.log('✅ Student found:', {
        name: studentData.name,
        email: studentEmail,
        studentId: studentData.studentId
      });

      // Step 2: Use Firebase's built-in password reset
      console.log('📧 Sending password reset email to:', studentEmail);
      await sendPasswordResetEmail(auth, studentEmail);
      
      setMessage(`Password reset email sent successfully to: ${studentEmail}`);
      
      toast({
        title: "Email Sent Successfully! 📧",
        description: `Password reset instructions have been sent to ${studentEmail}`,
      });
      
    } catch (error: any) {
      console.error('❌ Forgot password error:', error);
      
      let errorMessage = 'Failed to send password reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No Firebase Auth account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please wait a moment before trying again.';
      }
      
      setError(errorMessage);
      
      toast({
        title: "Error Sending Email",
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
      className="w-full max-w-md mx-auto"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Reset Password
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter your Student ID to receive password reset instructions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="studentId" className="text-sm font-medium text-gray-700">
                Student ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="studentId"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter your Student ID"
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !studentId.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending Email...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Send Reset Email</span>
                </div>
              )}
            </Button>
          </form>

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>

          {message && (
            <Alert className="border-green-200 bg-green-50">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ForgotPasswordForm;

