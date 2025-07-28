// StudentHeader.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import { Trophy, Flame, ArrowLeft, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudentData } from '../hooks/useStudentData';
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
  totalPoints: propTotalPoints,
  currentStreak: propCurrentStreak,
  studentId,
}) => {
  const navigate = useNavigate();
  const studentData = useStudentData();
  const { totalPoints, currentStreak, loading } = studentData;
  // No longer need modal state as we're using tooltip

  // Replicates the gradient logic from the Daily Streak page
  const getStreakColor = (streak: number | undefined) => {
    if (streak === undefined) return 'from-blue-400 to-indigo-500';
    if (streak === 0) return 'from-gray-400 to-gray-500';
    if (streak < 5) return 'from-blue-400 to-blue-500';
    if (streak < 10) return 'from-orange-400 to-red-500';
    return 'from-purple-400 to-pink-500';
  };

  const showStats = (totalPoints !== undefined || propTotalPoints !== undefined) && 
                   (currentStreak !== undefined || propCurrentStreak !== undefined);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg"
    >
      <div className="container mx-auto px-4 py-2 md:py-4">
        {/* Mobile Layout - Two lines */}
        <div className="md:hidden">
          {/* First line - Logo on left, Profile on right */}
          <div className="flex items-center justify-between mb-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center"
            >
              <img
                src="/lovable-uploads/7f6ab2a8-9863-4f75-ae5a-f2b087639caa.png"
                alt="MindLeap - Ignite Young Minds"
                className="h-8 w-auto cursor-pointer"
                onClick={() => navigate('/')}
              />
            </motion.div>

            {/* Profile - click to open modal */}
            <ProfileModal studentData={studentData} loading={loading} />
          </div>

          {/* Second line - Back button on left, Points + Streak on right */}
          <div className="flex items-center justify-between">
            {/* Back button */}
            {showBackButton && (
              <motion.button
                onClick={() => navigate(backTo)}
                className="flex items-center gap-1 text-gray-700 hover:text-purple-600 transition-colors text-sm"
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium text-xs">Back</span>
              </motion.button>
            )}

            {/* Points + Streak on right */}
            {showStats && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-orange-100 px-2 py-1 rounded-full">
                  <Trophy className="w-3 h-3 text-yellow-600" />
                  <span className="font-bold text-yellow-800 text-xs">
                    {loading ? '...' : `${totalPoints ?? propTotalPoints} Points`}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-1 bg-gradient-to-r ${getStreakColor(
                    currentStreak ?? propCurrentStreak
                  )} px-2 py-1 rounded-full text-white`}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Flame className="w-3 h-3" />
                  </motion.div>
                  <span className="font-bold text-xs">
                    {loading ? '...' : `${currentStreak ?? propCurrentStreak} Day Streak`}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Desktop Layout - Single line */}
        <div className="hidden md:flex items-center justify-between">
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
                className="h-16 w-auto cursor-pointer"
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

          {/* Right section – Stats and Profile */}
          <div className="flex items-center gap-4">
            {/* Use hook data if available, otherwise fall back to props */}
            {showStats && (
              <motion.div
                className="flex items-center gap-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-full">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <span className="font-bold text-yellow-800">
                    {loading ? '...' : `${totalPoints ?? propTotalPoints} Points`}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-2 bg-gradient-to-r ${getStreakColor(
                    currentStreak ?? propCurrentStreak
                  )} px-4 py-2 rounded-full text-white`}
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Flame className="w-5 h-5" />
                  </motion.div>
                  <span className="font-bold">
                    {loading ? '...' : `${currentStreak ?? propCurrentStreak} Day Streak`}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Profile - click to open modal */}
            <ProfileModal studentData={studentData} loading={loading} />
          </div>
        </div>
      </div>
    </motion.header>
  );
};

// Inline component for profile details display
const ProfileDetails: React.FC<{ studentData: any; loading?: boolean }> = ({ studentData, loading }) => (
  <div className="overflow-hidden">
    {/* Header */}
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 text-white">
      <h3 className="font-bold text-lg">Student Profile</h3>
    </div>
    
    {/* Profile content */}
    <div className="p-4 space-y-2.5 max-h-80 overflow-y-auto">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-2 text-gray-600">Loading profile...</span>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center border-b pb-1.5">
            <span className="text-gray-500 text-sm">Student ID:</span>
            <span className="font-medium text-purple-600">
              {studentData.studentId || studentData.id || 'Not Available'}
            </span>
          </div>
          <div className="flex justify-between items-center border-b pb-1.5">
            <span className="text-gray-500 text-sm">Name:</span>
            <span className="font-medium">
              {studentData.name || 'Not Available'}
            </span>
          </div>
          <div className="flex justify-between items-center border-b pb-1.5">
            <span className="text-gray-500 text-sm">Email:</span>
            <span className="font-medium text-sm">
              {studentData.email || 'Not Available'}
            </span>
          </div>
          <div className="flex justify-between items-center border-b pb-1.5">
            <span className="text-gray-500 text-sm">Phone:</span>
            <span className="font-medium">
              {studentData.phone || studentData.whatsappNumber || 'Not Available'}
            </span>
          </div>
          <div className="flex justify-between items-center border-b pb-1.5">
            <span className="text-gray-500 text-sm">Grade:</span>
            <span className="font-medium">
              {studentData.grade || studentData.class || 'Not Available'}
            </span>
          </div>
          <div className="flex justify-between items-center border-b pb-1.5">
            <span className="text-gray-500 text-sm">School:</span>
            <span className="font-medium text-sm">
              {studentData.schoolName || 'Not Available'}
            </span>
          </div>
          <div className="flex justify-between items-center border-b pb-1.5">
            <span className="text-gray-500 text-sm">District:</span>
            <span className="font-medium">
              {studentData.districtName || 'Not Available'}
            </span>
          </div>
          <div className="flex justify-between items-center border-b pb-1.5">
            <span className="text-gray-500 text-sm">State:</span>
            <span className="font-medium">
              {studentData.state || 'Not Available'}
            </span>
          </div>
          
          {/* Additional Stats */}
          <div className="mt-4 pt-2 border-t">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-500 text-sm">Total Points:</span>
              <span className="font-bold text-yellow-600">
                {studentData.totalPoints || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Current Streak:</span>
              <span className="font-bold text-orange-600">
                {studentData.currentStreak || 0} days
              </span>
            </div>
          </div>

          {/* Debug Info - Remove this in production */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 pt-2 border-t bg-gray-50 p-2 rounded text-xs">
              <div className="text-gray-600 mb-1">Debug Info:</div>
              <div className="text-gray-500">
                User ID: {studentData.id || 'N/A'}<br/>
                Data Keys: {Object.keys(studentData).join(', ')}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  </div>
);
export default StudentHeader;
