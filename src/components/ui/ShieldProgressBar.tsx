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
    <div className={`bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
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
      <div className="relative pt-4">
        {/* Background Progress Line */}
        <div className="absolute top-7 left-12 right-12 h-2 bg-gray-200 rounded-full">
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
        <div className="flex justify-between items-start relative z-10">
          {shields.map((shield, index) => {
            const isUnlocked = currentPoints >= shield.points;
            const isCurrent = currentShieldIndex === index;
            const isNext = currentShieldIndex + 1 === index && currentShieldIndex < 4;

            return (
              <motion.div
                key={shield.name}
                className="flex flex-col items-center text-center w-20"
                initial={{ opacity: 0, scale: 0, y: 30 }}
                animate={{ 
                  opacity: 1, 
                  scale: isCurrent ? 1.05 : 0.9,
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
                  className={`relative w-14 h-14 rounded-full p-1 border-2 flex items-center justify-center ${
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
                    scale: [1.05, 1.1, 1.05]
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  whileHover={{ scale: isUnlocked ? 1.03 : 1.01 }}
                >
                  {/* Shield Icon or Animated Lock */}
                  <AnimatePresence mode="wait">
                    {isUnlocked ? (
                      <motion.div
                        key="shield"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        {shield.icon === 'user' ? (
                          <User className={`w-7 h-7 ${isUnlocked ? shield.textColor : 'text-gray-400'}`} />
                        ) : (
                          <img src={shield.icon} alt={shield.name} className="w-8 h-8 object-contain" />
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="lock"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <Lock className="w-7 h-7 text-gray-400" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {isNext && (
                    <motion.div
                      className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white"
                      animate={{
                        scale: [1, 1.2, 1],
                        boxShadow: [
                          "0 0 0px rgba(59, 130, 246, 0)",
                          "0 0 10px rgba(59, 130, 246, 0.7)",
                          "0 0 0px rgba(59, 130, 246, 0)"
                        ]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Shield Label */}
                <div className="mt-2">
                  <p className={`font-bold text-sm ${isUnlocked ? shield.textColor : 'text-gray-500'}`}>{shield.name}</p>
                  <p className="text-xs text-gray-500">{shield.points.toLocaleString()}</p>
                </div>
                
                {isCurrent && (
                  <div className="absolute -bottom-7">
                    <div className="relative">
                      <div className="px-2 py-1 bg-yellow-400 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        CURRENT
                      </div>
                    </div>
                  </div>
                )}
                
                {isNext && (
                   <div className="absolute -bottom-7">
                    <div className="relative">
                      <div className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        NEXT
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer Text */}
      <div className="text-center mt-8">
        <p className="text-sm text-gray-600">
          {currentShieldIndex < 4 
            ? <>
                <span className="font-bold text-purple-600">
                  {(shields[currentShieldIndex + 1].points - currentPoints).toLocaleString()}
                </span> 
                {' '}points to unlock{' '}
                <span className="font-bold" style={{color: shields[currentShieldIndex + 1].textColor.replace('text-', '')}}>
                  {shields[currentShieldIndex + 1].name} Shield
                </span>
              </>
            : <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                You have unlocked all shields!
              </span>
          }
        </p>
      </div>
    </div>
  );
};

export default ShieldProgressBar; 