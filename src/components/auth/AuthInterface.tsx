
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import StudentLoginForm from './StudentLoginForm';
import AdminLoginForm from './AdminLoginForm';
import { Brain, Lightbulb } from 'lucide-react';

const AuthInterface = () => {
  const [isStudentLogin, setIsStudentLogin] = useState(true);

  const toggleForm = () => {
    setIsStudentLogin(!isStudentLogin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-full opacity-30 blur-3xl"></div>
        
        {/* Floating Icons */}
        <motion.div
          className="absolute top-20 left-20 text-orange-400"
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Brain className="w-12 h-12" />
        </motion.div>
        
        <motion.div
          className="absolute top-32 right-32 text-blue-400"
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -10, 10, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        >
          <Lightbulb className="w-10 h-10" />
        </motion.div>
        
        <motion.div
          className="absolute bottom-32 left-32 text-orange-400"
          animate={{ 
            y: [0, -15, 0],
            x: [0, 10, 0]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        >
          <Brain className="w-8 h-8" />
        </motion.div>
      </div>

      {/* Main Auth Container */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className="flex items-center justify-center mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <img 
              src="/lovable-uploads/7f6ab2a8-9863-4f75-ae5a-f2b087639caa.png" 
              alt="MindLeap - Ignite Young Minds" 
              className="h-16 w-auto"
            />
          </motion.div>
          
          <motion.p
            className="text-gray-600 font-poppins"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Your Learning Journey Starts Here
          </motion.p>
        </div>

        {/* Form Container */}
        <motion.div
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8"
          layoutId="form-container"
        >
          {isStudentLogin ? (
            <StudentLoginForm onToggleForm={toggleForm} />
          ) : (
            <AdminLoginForm onToggleForm={toggleForm} />
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center mt-6 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Made with ❤️ for students of Classes 8, 9 & 10
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AuthInterface;
