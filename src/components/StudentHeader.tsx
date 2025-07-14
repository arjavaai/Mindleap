// StudentHeader.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProfileModal } from './student';

interface StudentHeaderProps {
  /**
   * Show the back button on the left-hand side.
   * Defaults to true so that most pages can quickly go "back to dashboard".
   */
  showBackButton?: boolean;
  /**
   * Where should the back button navigate?
   * Defaults to "/dashboard".
   */
  backTo?: string;
  /**
   * Label that appears next to the back arrow.
   * Defaults to "Back to Dashboard".
   */
  backLabel?: string;
  /**
   * Student's total points – if omitted, the points / streak cluster will be hidden.
   */
  totalPoints?: number;
  /**
   * Student's current daily-streak – if omitted, the points / streak cluster will be hidden.
   */
  currentStreak?: number;
  /**
   * The student's ID.
   */
  studentId?: string;
}

const StudentHeader: React.FC<StudentHeaderProps> = ({
  showBackButton = true,
  backTo = '/dashboard',
  backLabel = 'Back to Dashboard',
  totalPoints,
  currentStreak,
  studentId,
}) => {
  const navigate = useNavigate();

  // Replicates the gradient logic from the Daily Streak page
  const getStreakColor = (streak: number | undefined) => {
    if (streak === undefined) return 'from-blue-400 to-indigo-500';
    if (streak === 0) return 'from-gray-400 to-gray-500';
    if (streak < 5) return 'from-blue-400 to-blue-500';
    if (streak < 10) return 'from-orange-400 to-red-500';
    return 'from-purple-400 to-pink-500';
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left section – Logo + optional back button */}
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <img
                src="/lovable-uploads/7f6ab2a8-9863-4f75-ae5a-f2b087639caa.png"
                alt="MindLeap - Ignite Young Minds"
                className="h-12 w-auto cursor-pointer"
                onClick={() => navigate('/')}
              />
            </motion.div>

            {/* Back button */}
            {showBackButton && (
              <motion.button
                onClick={() => navigate(backTo)}
                className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">{backLabel}</span>
              </motion.button>
            )}
          </div>

          {/* Right section – Stats (only if both values are provided) */}
          <div className="flex items-center gap-4">
            {totalPoints !== undefined && currentStreak !== undefined && (
              <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-full">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <span className="font-bold text-yellow-800">{totalPoints} Points</span>
                </div>

                <div
                  className={`flex items-center gap-2 bg-gradient-to-r ${getStreakColor(
                    currentStreak
                  )} px-4 py-2 rounded-full text-white`}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Flame className="w-5 h-5" />
                  </motion.div>
                  <span className="font-bold">{currentStreak} Day Streak</span>
                </div>
              </motion.div>
            )}
            {studentId && <ProfileModal studentId={studentId} />}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default StudentHeader;