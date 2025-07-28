import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Star, Trophy, Crown, Sparkles, User, Eye } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface ShieldProgressBarProps {
  currentPoints: number;
  className?: string;
}

interface ShieldUnlockModal {
  isOpen: boolean;
  shield: any;
  onClose: () => void;
}

// Shield Unlock Modal Component
const ShieldUnlockModal: React.FC<ShieldUnlockModal> = ({ isOpen, shield, onClose }) => {
  if (!isOpen || !shield) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden"
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Animated background particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 bg-yellow-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}

          <motion.div
            className="relative z-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <motion.h2 
              className="text-3xl font-bold text-white mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎉 Shield Unlocked! 🎉
            </motion.h2>

            {/* Shield with shine effect */}
            <motion.div
              className="relative w-32 h-32 mx-auto mb-6"
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 rounded-full opacity-30 animate-pulse" />
              <div className="relative w-full h-full bg-white rounded-full p-4 flex items-center justify-center">
                {shield.icon === 'user' ? (
                  <User className="w-20 h-20 text-purple-600" />
                ) : (
                  <img 
                    src={shield.icon} 
                    alt={shield.name} 
                    className="w-24 h-24 object-contain" 
                  />
                )}
              </div>
              
              {/* Shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>

            <motion.h3 
              className="text-2xl font-bold text-yellow-400 mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {shield.name} Shield
            </motion.h3>

            <motion.p 
              className="text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              Congratulations! You've reached {shield.points.toLocaleString()} points and unlocked the {shield.name} shield!
            </motion.p>

            <motion.button
              onClick={onClose}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-3 px-8 rounded-full hover:shadow-lg transition-all duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              Awesome! 🚀
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ShieldProgressBar: React.FC<ShieldProgressBarProps> = ({ currentPoints, className = '' }) => {
  const [user] = useAuthState(auth);
  const [unlockedShields, setUnlockedShields] = useState<Set<number>>(new Set([0])); // Student shield is always unlocked
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [modalShield, setModalShield] = useState<any>(null);
  
  console.log('ShieldProgressBar received currentPoints:', currentPoints);

  // Load unlocked shields from Firebase on component mount
  useEffect(() => {
    const loadUnlockedShields = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'students', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const unlocked = userData.unlockedShields || [0]; // Student shield always unlocked
          setUnlockedShields(new Set(unlocked));
        }
      } catch (error) {
        console.error('Error loading unlocked shields:', error);
      }
    };

    loadUnlockedShields();
  }, [user]);

  // Check for new shield unlocks when points change
  useEffect(() => {
    const checkForNewUnlocks = async () => {
      if (!user) return;

      const newUnlocks: number[] = [];
      
      shields.forEach((shield, index) => {
        if (currentPoints >= shield.points && !unlockedShields.has(index)) {
          newUnlocks.push(index);
        }
      });

      if (newUnlocks.length > 0) {
        // Update local state
        const updatedUnlocked = new Set([...unlockedShields, ...newUnlocks]);
        setUnlockedShields(updatedUnlocked);

        // Save to Firebase
        try {
          await setDoc(doc(db, 'students', user.uid), {
            unlockedShields: Array.from(updatedUnlocked)
          }, { merge: true });
        } catch (error) {
          console.error('Error saving unlocked shields:', error);
        }
      }
    };

    checkForNewUnlocks();
  }, [currentPoints, unlockedShields, user]);

  const handleShieldClick = (shield: any, index: number) => {
    if (unlockedShields.has(index)) {
      // Already unlocked, show shield directly
      setModalShield(shield);
      setShowUnlockModal(true);
    } else if (currentPoints >= shield.points) {
      // Can unlock - show unlock modal and mark as unlocked
      const updatedUnlocked = new Set([...unlockedShields, index]);
      setUnlockedShields(updatedUnlocked);
      
      // Save to Firebase
      if (user) {
        setDoc(doc(db, 'students', user.uid), {
          unlockedShields: Array.from(updatedUnlocked)
        }, { merge: true }).catch(error => {
          console.error('Error saving unlocked shields:', error);
        });
      }
      
      setModalShield(shield);
      setShowUnlockModal(true);
    }
    // If not unlocked and can't unlock, do nothing
  };

  const canUnlockButNotUnlocked = (shield: any, index: number) => {
    return currentPoints >= shield.points && !unlockedShields.has(index);
  };
  
  const shields = [
    {
      name: 'Student',
      icon: 'user',
      points: 0,
      color: 'from-slate-400 to-slate-600',
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-700',
      ringColor: 'ring-slate-400',
      position: 0
    },
    {
      name: 'Bronze',
      icon: '/sheild_icons/broze_sheild.png',
      points: 1000,
      color: 'from-orange-500 to-amber-600',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      ringColor: 'ring-orange-400',
      position: 1
    },
    {
      name: 'Silver',
      icon: '/sheild_icons/silver_sheild.png',
      points: 2000,
      color: 'from-gray-300 to-gray-500',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      ringColor: 'ring-gray-400',
      position: 2
    },
    {
      name: 'Gold',
      icon: '/sheild_icons/gold_sheild.png',
      points: 3000,
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      ringColor: 'ring-yellow-400',
      position: 3
    },
    {
      name: 'Platinum',
      icon: '/sheild_icons/platinum_sheild.png',
      points: 4000,
      color: 'from-purple-400 to-indigo-600',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      ringColor: 'ring-purple-400',
      position: 4
    }
  ];

  const getCurrentShieldIndex = () => {
    if (currentPoints >= 4000) return 4;
    if (currentPoints >= 3000) return 3;
    if (currentPoints >= 2000) return 2;
    if (currentPoints >= 1000) return 1;
    return 0;
  };

  const getNextShieldIndex = () => {
    const current = getCurrentShieldIndex();
    return current < 4 ? current + 1 : 4;
  };

  const currentShieldIndex = getCurrentShieldIndex();
  const nextShieldIndex = getNextShieldIndex();
  const nextShield = shields[nextShieldIndex];
  const pointsToNext = currentShieldIndex < 4 ? nextShield.points - currentPoints : 0;

  return (
    <motion.div 
      className={`relative overflow-hidden rounded-3xl p-6 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Content Container */}
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <motion.h3 
            className="text-xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Shield Progression
          </motion.h3>
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Star className="w-5 h-5 text-yellow-400" />
            </motion.div>
            <span className="text-2xl font-bold text-yellow-400">
              {currentPoints.toLocaleString()} Points
            </span>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Star className="w-5 h-5 text-yellow-400" />
            </motion.div>
          </div>
        </div>

                 {/* Desktop Layout */}
         <div className="hidden md:block">
           {/* Shield Icons Container */}
           <div className="relative">
             {/* Progress Line - positioned to pass through center of circles */}
             <div className="absolute top-10 left-8 right-8 h-2 bg-white/20 rounded-full">
               <motion.div
                 className="h-full bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-600 rounded-full relative overflow-hidden"
                 initial={{ width: 0 }}
                 animate={{ width: `${Math.min(100, (currentPoints / 4000) * 100)}%` }}
                 transition={{ duration: 2, ease: "easeOut" }}
               >
                 <motion.div
                   className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                   animate={{ x: ['-200%', '200%'] }}
                   transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                 />
               </motion.div>
             </div>
           
             <div className="flex items-start justify-between relative z-10 px-4">
             {shields.map((shield, index) => {
               const isUnlocked = unlockedShields.has(index);
               const canUnlock = canUnlockButNotUnlocked(shield, index);
               const isCurrent = currentShieldIndex === index;
               const isNext = nextShieldIndex === index && currentShieldIndex < 4;

               return (
                 <motion.div
                   key={shield.name}
                   className="flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0, y: 30 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isCurrent ? 1.2 : 1,
                    y: 0
                  }}
                  transition={{ 
                    delay: index * 0.15,
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                >
                  {/* Shield Container */}
                  <motion.div
                    className={`relative ${
                      isCurrent ? 'w-20 h-20' : 'w-16 h-16'
                    } rounded-full p-1 border-4 flex items-center justify-center ${
                      isUnlocked 
                        ? `border-white shadow-lg ${shield.bgColor} cursor-pointer` 
                        : canUnlock
                        ? 'border-yellow-400 bg-yellow-100 cursor-pointer'
                        : 'border-gray-400 bg-gray-300 cursor-default'
                    } ${isCurrent ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''}`}
                    animate={isCurrent ? {
                      boxShadow: [
                        '0 0 0 rgba(255, 255, 255, 0.5)',
                        '0 0 30px rgba(255, 255, 255, 0.8)',
                        '0 0 0 rgba(255, 255, 255, 0.5)'
                      ],
                    } : canUnlock ? {
                      boxShadow: [
                        '0 0 0 rgba(255, 193, 7, 0.4)',
                        '0 0 20px rgba(255, 193, 7, 0.6)',
                        '0 0 0 rgba(255, 193, 7, 0.4)'
                      ],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    whileHover={{ scale: (isUnlocked || canUnlock) ? 1.05 : 1.02 }}
                    onClick={() => handleShieldClick(shield, index)}
                  >
                    <AnimatePresence mode="wait">
                      {isUnlocked ? (
                        <motion.div
                          key="shield"
                          initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
                          className="w-full h-full flex items-center justify-center"
                        >
                           {shield.icon === 'user' ? (
                             <User className={`${isCurrent ? 'w-12 h-12' : 'w-10 h-10'} ${shield.textColor}`} />
                           ) : (
                             <img 
                               src={shield.icon} 
                               alt={shield.name} 
                               className={`${isCurrent ? 'w-14 h-14' : 'w-12 h-12'} object-contain`} 
                             />
                           )}
                        </motion.div>
                      ) : canUnlock ? (
                        <motion.div
                          key="mysterybox"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-full h-full flex flex-col items-center justify-center text-center"
                        >
                          {/* Mystery Box Icon */}
                          <motion.div
                            className="relative"
                            animate={{ 
                              rotateY: [0, 10, -10, 0],
                              scale: [1, 1.05, 1]
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <div className={`${isCurrent ? 'w-10 h-8' : 'w-8 h-6'} bg-gradient-to-br from-purple-500 to-pink-500 rounded-md relative`}>
                              {/* Box lid */}
                              <div className={`absolute -top-1 left-0 right-0 ${isCurrent ? 'h-2' : 'h-1'} bg-gradient-to-r from-yellow-400 to-orange-500 rounded-t-md`} />
                              {/* Question mark */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`${isCurrent ? 'text-lg' : 'text-sm'} font-bold text-white`}>?</span>
                              </div>
                              {/* Sparkles around box */}
                              <motion.div
                                className="absolute -top-1 -right-1 w-2 h-2"
                                animate={{ 
                                  scale: [0, 1, 0],
                                  rotate: [0, 180, 360]
                                }}
                                transition={{ 
                                  duration: 1.5, 
                                  repeat: Infinity,
                                  delay: 0.5
                                }}
                              >
                                ✨
                              </motion.div>
                              <motion.div
                                className="absolute -bottom-1 -left-1 w-2 h-2"
                                animate={{ 
                                  scale: [0, 1, 0],
                                  rotate: [0, -180, -360]
                                }}
                                transition={{ 
                                  duration: 1.5, 
                                  repeat: Infinity,
                                  delay: 1
                                }}
                              >
                                ✨
                              </motion.div>
                            </div>
                          </motion.div>
                          <span className="text-xs font-bold text-orange-600 mt-1">Mystery Box!</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="lock"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-full h-full flex items-center justify-center"
                        >
                           <Lock className={`${isCurrent ? 'w-12 h-12' : 'w-10 h-10'} text-gray-500`} />
                         </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Unlock notification pulse */}
                    {canUnlock && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-yellow-400 opacity-30"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity
                        }}
                      />
                    )}
                    
                    {isNext && currentShieldIndex < 4 && !canUnlock && (
                      <motion.div
                        className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                        animate={{
                          scale: [1, 1.3, 1],
                          rotate: [0, 180, 360]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Sparkles className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Shield Name */}
                  <motion.p 
                    className={`mt-2 font-bold text-sm ${isCurrent ? 'text-yellow-400' : 'text-white'}`}
                    animate={isCurrent ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {shield.name}
                  </motion.p>
                  <p className="text-xs text-gray-300">
                     {shield.points === 0 ? currentPoints.toLocaleString() : shield.points.toLocaleString()}
                   </p>
                  
                  {/* Status indicators */}
                  {isCurrent && (
                    <motion.div
                      className="mt-1 px-3 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center gap-1"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Crown className="w-3 h-3" />
                      CURRENT
                    </motion.div>
                  )}
                  
                  {isUnlocked && !isCurrent && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="mt-1"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-500 mx-auto" />
                    </motion.div>
                  )}
                  
                  {canUnlock && (
                    <motion.p 
                      className="text-xs text-orange-400 font-bold mt-1"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      Click to Open!
                    </motion.p>
                  )}
                </motion.div>
              );
            })}
          </div>
           </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="grid grid-cols-5 gap-2 mb-6">
            {shields.map((shield, index) => {
              const isUnlocked = currentPoints >= shield.points;
              const isCurrent = currentShieldIndex === index;

              return (
                <motion.div
                  key={shield.name}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isCurrent ? 1.1 : 1
                  }}
                  transition={{ delay: index * 0.1 }}
                >
                  <motion.div
                    className={`relative w-12 h-12 rounded-full p-1 border-2 flex items-center justify-center ${
                      isUnlocked 
                        ? `border-white ${shield.bgColor}` 
                        : 'border-gray-400 bg-gray-300'
                    } ${isCurrent ? 'ring-2 ring-yellow-400' : ''}`}
                    animate={isCurrent ? {
                      boxShadow: [
                        '0 0 0 rgba(255, 255, 255, 0.5)',
                        '0 0 20px rgba(255, 255, 255, 0.8)',
                        '0 0 0 rgba(255, 255, 255, 0.5)'
                      ],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {isUnlocked ? (
                      shield.icon === 'user' ? (
                        <User className={`w-6 h-6 ${shield.textColor}`} />
                      ) : (
                        <img src={shield.icon} alt={shield.name} className="w-7 h-7 object-contain" />
                      )
                    ) : (
                      <Lock className="w-6 h-6 text-gray-500" />
                    )}
                  </motion.div>
                  <p className={`mt-1 text-xs font-bold ${isCurrent ? 'text-yellow-400' : 'text-white'}`}>
                    {shield.name}
                  </p>
                  <p className="text-xs text-gray-300">
                    {shield.points === 0 ? currentPoints.toLocaleString() : shield.points.toLocaleString()}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Progress Message */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {currentShieldIndex < 4 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
              <p className="text-lg font-bold text-white">
                <motion.span 
                  className="text-yellow-400"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {pointsToNext.toLocaleString()}
                </motion.span>
                {' '}points to unlock
              </p>
                             <p className="text-sm text-white">
                 <span className="font-bold text-white">
                   {nextShield.name} Shield
                 </span>
               </p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full px-6 py-3">
              <p className="text-lg font-bold text-black flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5" />
                All Shields Unlocked!
                <Trophy className="w-5 h-5" />
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Shield Unlock Modal */}
      <ShieldUnlockModal 
        isOpen={showUnlockModal}
        shield={modalShield}
        onClose={() => setShowUnlockModal(false)}
      />
    </motion.div>
  );
};

export default ShieldProgressBar; 