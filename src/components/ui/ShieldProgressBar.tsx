import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Star, Trophy, Crown, Zap, Sparkles, User } from 'lucide-react';

interface ShieldProgressBarProps {
  currentPoints: number;
  className?: string;
}

const ShieldProgressBar: React.FC<ShieldProgressBarProps> = ({ currentPoints, className = '' }) => {
  console.log('ShieldProgressBar received currentPoints:', currentPoints);
  const shields = [
    {
      name: 'Student',
      icon: 'user', // Special case for User icon
      points: 0,
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      shadowColor: 'shadow-gray-500/50',
      glowColor: 'shadow-gray-400',
      position: 0
    },
    {
      name: 'Bronze',
      icon: '/sheild_icons/broze_sheild.png',
      points: 1000,
      color: 'from-amber-600 to-amber-800',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-800',
      shadowColor: 'shadow-amber-500/50',
      glowColor: 'shadow-amber-400',
      position: 1
    },
    {
      name: 'Silver',
      icon: '/sheild_icons/silver_sheild.png',
      points: 2000,
      color: 'from-gray-400 to-gray-600',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      shadowColor: 'shadow-gray-500/50',
      glowColor: 'shadow-gray-400',
      position: 2
    },
    {
      name: 'Gold',
      icon: '/sheild_icons/gold_sheild.png',
      points: 3000,
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      shadowColor: 'shadow-yellow-500/50',
      glowColor: 'shadow-yellow-400',
      position: 3
    },
    {
      name: 'Platinum',
      icon: '/sheild_icons/platinum_sheild.png',
      points: 4000,
      color: 'from-indigo-400 to-indigo-600',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-800',
      shadowColor: 'shadow-indigo-500/50',
      glowColor: 'shadow-indigo-400',
      position: 4
    }
  ];

  const getCurrentShieldIndex = () => {
    if (currentPoints >= 4000) return 4; // Platinum
    if (currentPoints >= 3000) return 3; // Gold
    if (currentPoints >= 2000) return 2; // Silver
    if (currentPoints >= 1000) return 1; // Bronze
    return 0; // Student (always achieved at 0 points)
  };

  const getOverallProgress = () => {
    return Math.min(100, (currentPoints / 4000) * 100);
  };

  const getSegmentProgress = (shieldIndex: number) => {
    if (shieldIndex === 0) return 100; // Student is always achieved
    
    const segmentStart = shields[shieldIndex - 1].points;
    const segmentEnd = shields[shieldIndex].points;
    const segmentSize = segmentEnd - segmentStart;
    
    if (currentPoints <= segmentStart) return 0;
    if (currentPoints >= segmentEnd) return 100;
    
    return ((currentPoints - segmentStart) / segmentSize) * 100;
  };

  const currentShieldIndex = getCurrentShieldIndex();
  const overallProgress = getOverallProgress();

  return (
    <div className={`bg-white rounded-xl p-2 shadow-xl border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="text-center mb-2">
        <motion.h3 
          className="text-lg font-bold text-gray-800 mb-1"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🛡️ Shield Progression
        </motion.h3>
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Star className="w-4 h-4 text-yellow-500" />
          </motion.div>
          <span className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            {currentPoints.toLocaleString()} Points
          </span>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Star className="w-4 h-4 text-yellow-500" />
          </motion.div>
        </div>
      </div>

      {/* Progress Line and Shields */}
      <div className="relative">
        {/* Background Progress Line */}
        <div className="absolute top-7 left-4 right-4 h-1 bg-gray-200 rounded-full">
          {/* Animated Progress Fill */}
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 rounded-full relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
              animate={{
                x: ['-200%', '200%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </motion.div>
        </div>

        {/* Shields Row */}
        <div className="flex justify-between items-center relative z-10">
          {shields.map((shield, index) => {
            const isUnlocked = currentPoints >= shield.points;
            const isCurrent = currentShieldIndex === index;
            const isNext = currentShieldIndex + 1 === index && currentShieldIndex < 4;

            return (
              <motion.div
                key={shield.name}
                className="flex flex-col items-center"
                initial={{ opacity: 0, scale: 0, y: 30 }}
                animate={{ 
                  opacity: 1, 
                  scale: isCurrent ? 1.08 : 0.95,
                  y: 0
                }}
                transition={{ 
                  delay: index * 0.12,
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
              >
                {/* Shield Container */}
                <motion.div
                  className={`relative w-12 h-12 rounded-full p-1 border-2 ${
                    isUnlocked 
                      ? `border-current ${shield.textColor} ${shield.bgColor}` 
                      : 'border-gray-300 bg-gray-100'
                  }`}
                  animate={isCurrent ? {
                    boxShadow: [
                      '0 0 0 rgba(147, 51, 234, 0)',
                      '0 0 15px rgba(147, 51, 234, 0.5)',
                      '0 0 0 rgba(147, 51, 234, 0)'
                    ],
                    scale: [1.08, 1.13, 1.08]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  whileHover={{ scale: isUnlocked ? 1.03 : 1.01 }}
                >
                  {/* Shield Icon or Animated Lock */}
                  <AnimatePresence mode="wait">
                    {isUnlocked ? (
                      <motion.div
                        key="shield"
                        initial={{ opacity: 0, rotate: -180, scale: 0 }}
                        animate={{ 
                          opacity: 1, 
                          rotate: 0, 
                          scale: 1
                        }}
                        exit={{ opacity: 0, rotate: 180, scale: 0 }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        {shield.icon === 'user' ? (
                          <motion.div
                            animate={isCurrent ? {
                              rotateY: [0, 360]
                            } : {}}
                            transition={{ duration: 3, repeat: Infinity }}
                          >
                            <User className="w-8 h-8 text-gray-600" />
                          </motion.div>
                        ) : (
                          <motion.img 
                            src={shield.icon} 
                            alt={`${shield.name} Shield`}
                            className="w-10 h-10 object-contain"
                            animate={isCurrent ? {
                              rotateY: [0, 360]
                            } : {}}
                            transition={{ duration: 3, repeat: Infinity }}
                          />
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="lock"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <motion.div
                          animate={isNext ? {
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0]
                          } : {
                            y: [0, -2, 0]
                          }}
                          transition={{ 
                            duration: isNext ? 1 : 2, 
                            repeat: Infinity 
                          }}
                        >
                          <Lock className="w-6 h-6 text-gray-500" />
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Glow effect for current shield */}
                  {isCurrent && isUnlocked && (
                    <motion.div
                      className={`absolute inset-0 rounded-full ${shield.glowColor} blur-lg opacity-75`}
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0.9, 0.5]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  {/* Progress indicator for next shield */}
                  {isNext && !isUnlocked && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center"
                      animate={{
                        scale: [1, 1.2, 1],
                        boxShadow: [
                          '0 0 0 rgba(59, 130, 246, 0)',
                          '0 0 15px rgba(59, 130, 246, 0.8)',
                          '0 0 0 rgba(59, 130, 246, 0)'
                        ]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Shield Info */}
                <motion.div 
                  className="text-center mt-1"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.12 + 0.2 }}
                >
                  <h4 className={`font-bold text-[11px] mb-0.5 ${
                    isUnlocked ? shield.textColor : 'text-gray-500'
                  }`}>
                    {shield.name}
                  </h4>
                  <p className={`text-[11px] font-medium ${
                    isUnlocked ? shield.textColor : 'text-gray-400'
                  }`}>
                    {shield.points === 0 ? '0' : shield.points.toLocaleString()}
                  </p>
                  
                  {/* Badges */}
                  <AnimatePresence>
                    {isCurrent && isUnlocked && (
                      <motion.div
                        className="mt-0.5 inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-1 py-0.5 rounded-full text-[10px] font-bold"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Crown className="w-2 h-2" />
                        CURRENT
                      </motion.div>
                    )}
                    
                    {isNext && !isUnlocked && (
                      <motion.div
                        className="mt-0.5 inline-flex items-center gap-1 bg-gradient-to-r from-blue-400 to-indigo-500 text-white px-1 py-0.5 rounded-full text-[10px] font-bold"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <Zap className="w-2 h-2" />
                        NEXT
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Progress Details */}
      <div className="mt-2 space-y-1">
        {currentPoints < 4000 && (
          <>
            <div className="flex justify-between items-center text-xs font-medium text-gray-700">
              <span>Overall Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            
            {currentShieldIndex < 4 && (
              <div className="text-center text-xs text-gray-600">
                <span className="font-semibold">
                  {shields[currentShieldIndex + 1].points - currentPoints}
                </span>{' '}
                points to unlock{' '}
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  {shields[currentShieldIndex + 1].name} Shield
                </span>
              </div>
            )}
          </>
        )}

        {/* Completed Message */}
        {currentPoints >= 4000 && (
          <motion.div
            className="text-center p-2 bg-gradient-to-r from-purple-100 via-pink-100 to-indigo-100 rounded-xl border border-purple-200"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex justify-center items-center gap-1 mb-1">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Trophy className="w-4 h-4 text-purple-600" />
              </motion.div>
              <span className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                All Shields Unlocked!
              </span>
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Trophy className="w-4 h-4 text-purple-600" />
              </motion.div>
            </div>
            <p className="text-purple-700 font-bold text-xs">
              🎉 Congratulations! You've mastered all levels! 🎉
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ShieldProgressBar; 