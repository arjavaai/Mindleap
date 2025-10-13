import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const auth = getAuth();

  useEffect(() => {
    const validateResetCode = async () => {
      const oobCode = searchParams.get('oobCode');
      
      if (!oobCode) {
        setError('Invalid or missing reset link. Please request a new password reset.');
        setIsValidating(false);
        return;
      }

      try {
        // Verify the password reset code
        await verifyPasswordResetCode(auth, oobCode);
        setIsValidCode(true);
        setMessage('Please enter your new password below.');
      } catch (error: any) {
        console.error('❌ Invalid reset code:', error);
        
        let errorMessage = 'Invalid or expired reset link.';
        
        if (error.code === 'auth/expired-action-code') {
          errorMessage = 'This reset link has expired. Please request a new password reset.';
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = 'Invalid reset link. Please request a new password reset.';
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = 'This account has been disabled. Please contact support.';
        }
        
        setError(errorMessage);
      } finally {
        setIsValidating(false);
      }
    };

    validateResetCode();
  }, [searchParams, auth]);

  const validatePassword = (password: string) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    return {
      length: password.length >= minLength,
      upperCase: hasUpperCase,
      lowerCase: hasLowerCase,
      numbers: hasNumbers,
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers
    };
  };

  const passwordValidation = validatePassword(newPassword);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordValidation.isValid) {
      setError('Password must be at least 6 characters long and contain uppercase, lowercase, and numbers.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const oobCode = searchParams.get('oobCode');
    if (!oobCode) {
      setError('Invalid reset link.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      setMessage('Password reset successfully! You can now login with your new password.');
      
      toast({
        title: "Password Reset Successful! 🎉",
        description: "Your password has been updated. You can now login with your new password.",
      });

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.code === 'auth/expired-action-code') {
        errorMessage = 'This reset link has expired. Please request a new password reset.';
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'Invalid reset link. Please request a new password reset.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      
      setError(errorMessage);
      
      toast({
        title: "Password Reset Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Validating reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">Invalid Reset Link</CardTitle>
            <CardDescription className="text-gray-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Reset Your Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New Password Field */}
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {newPassword && (
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center ${passwordValidation.length ? 'text-green-600' : 'text-red-600'}`}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      At least 6 characters
                    </div>
                    <div className={`flex items-center ${passwordValidation.upperCase ? 'text-green-600' : 'text-red-600'}`}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      One uppercase letter
                    </div>
                    <div className={`flex items-center ${passwordValidation.lowerCase ? 'text-green-600' : 'text-red-600'}`}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      One lowercase letter
                    </div>
                    <div className={`flex items-center ${passwordValidation.numbers ? 'text-green-600' : 'text-red-600'}`}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      One number
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !passwordValidation.isValid || newPassword !== confirmPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Resetting Password...</span>
                  </div>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/login')}
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>

            {message && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;

