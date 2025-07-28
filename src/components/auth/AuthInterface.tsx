
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


      {/* Main Auth Container */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >


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
