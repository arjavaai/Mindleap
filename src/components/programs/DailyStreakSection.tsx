import React, { useState } from 'react';
import { Calendar, Trophy, Zap, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollAnimation from '../ScrollAnimation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Badge } from '../ui/badge';

const DailyStreakSection = () => {
  const [streakCount, setStreakCount] = useState(12);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const correctAnswer = '42';
  const options = ['42', '40', '38', '36'];

  // Badge thresholds
  const badgeThresholds = [
    { name: 'Bronze', days: 5 },
    { name: 'Silver', days: 10 },
    { name: 'Gold', days: 15 },
    { name: 'Platinum', days: 20 }
  ];

  const getCurrentBadge = () => {
    for (let i = badgeThresholds.length - 1; i >= 0; i--) {
      if (streakCount >= badgeThresholds[i].days) {
        return badgeThresholds[i];
      }
    }
    return null; // No badge yet
  };

  const getNextMilestone = () => {
    const currentBadge = getCurrentBadge();
    const currentBadgeIndex = currentBadge 
      ? badgeThresholds.findIndex(b => b.name === currentBadge.name)
      : -1;
    
    if (currentBadgeIndex < badgeThresholds.length - 1) {
      return badgeThresholds[currentBadgeIndex + 1];
    }
    return null; // Already at highest badge
  };

  const handleOptionSelect = (option: string) => {
    if (showResult) return;
    
    setSelectedOption(option);
    setShowResult(true);
    
    if (option === correctAnswer) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  };

  const getOptionStyle = (option: string) => {
    if (!showResult) {
      return selectedOption === option 
        ? 'border-vibrant-orange bg-orange-50 text-vibrant-orange'
        : 'border-gray-200 hover:border-vibrant-orange hover:bg-orange-50 transition-colors';
    }
    
    if (option === correctAnswer) {
      return 'border-green-400 bg-green-50 text-green-700';
    }
    
    if (selectedOption === option && option !== correctAnswer) {
      return 'border-red-400 bg-red-50 text-red-700';
    }
    
    return 'border-gray-200 bg-gray-50 text-gray-500';
  };

  const getResultMessage = () => {
    if (selectedOption === correctAnswer) {
      return { text: '✅ Correct!', color: 'text-green-600' };
    }
    return { text: '❌ Wrong answer', color: 'text-red-600' };
  };

  return (
    <section className="py-16 px-4 sm:px-6 md:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimation animation="fadeUp">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-blue font-poppins mb-4">
              Think Daily. Win Daily.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Build your thinking muscle with 10 minute daily challenges that keep your mind sharp and engaged.
            </p>
          </div>
        </ScrollAnimation>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Interactive Quiz Demo */}
          <ScrollAnimation animation="slideLeft">
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-2xl p-6 relative overflow-hidden">
              {/* Confetti Animation */}
              <AnimatePresence>
                {showConfetti && (
                  <div className="absolute inset-0 pointer-events-none z-10">
                    {[...Array(30)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                        initial={{
                          x: Math.random() * 400,
                          y: -10,
                          rotate: 0,
                        }}
                        animate={{
                          y: 400,
                          rotate: 360,
                          x: Math.random() * 400,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 2,
                          delay: Math.random() * 1,
                          ease: "easeOut",
                        }}
                      />
                    ))}
                  </div>
                )}
              </AnimatePresence>

              <div className="bg-white rounded-xl p-6 shadow-lg relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-deep-blue">Daily Challenge #157</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      DEMO
                    </Badge>
                    <div className="flex items-center space-x-1 text-vibrant-orange">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-bold">200 pts</span>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-deep-blue mb-3">
                  Pattern Recognition
                </h3>
                
                <p className="text-gray-600 mb-4 text-sm">
                  Find the next number in the sequence: 2, 6, 12, 20, 30, ?
                </p>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {options.map((option, index) => (
                    <motion.button 
                      key={index}
                      onClick={() => handleOptionSelect(option)}
                      disabled={showResult}
                      className={`p-2 border rounded-lg text-sm font-medium transition-all duration-200 ${getOptionStyle(option)} ${
                        showResult ? 'cursor-not-allowed' : 'cursor-pointer'
                      }`}
                      whileHover={!showResult ? { scale: 1.02 } : {}}
                      whileTap={!showResult ? { scale: 0.98 } : {}}
                    >
                      {String.fromCharCode(65 + index)}. {option}
                      {showResult && option === correctAnswer && (
                        <span className="ml-2">✅</span>
                      )}
                      {showResult && selectedOption === option && option !== correctAnswer && (
                        <span className="ml-2">❌</span>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Result Message */}
                <AnimatePresence>
                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`text-center font-semibold mb-4 ${getResultMessage().color}`}
                    >
                      {getResultMessage().text}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Auto-showing Explanation Section */}
                <AnimatePresence>
                  {showResult && (
                    <motion.div 
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                      <div className="text-sm text-gray-700 space-y-3">
                        <p className="font-semibold">Let's analyze the given sequence:</p>
                        
                        <div>
                          <p className="font-semibold">Sequence:</p>
                          <p><strong>2, 6, 12, 20, 30, ?</strong></p>
                        </div>
                        
                        <div>
                          <p className="font-semibold">Step 1: Look at the differences between consecutive terms:</p>
                          <p>6 − 2 = 4</p>
                          <p>12 − 6 = 6</p>
                          <p>20 − 12 = 8</p>
                          <p>30 − 20 = 10</p>
                          <p>We see the differences are increasing by 2: 4, 6, 8, 10, …</p>
                          <p>So, the next difference should be 12.</p>
                        </div>
                        
                        <div>
                          <p className="font-semibold">Step 2: Add the next difference to the last number.</p>
                          <p>30 + 12 = 42</p>
                        </div>
                        
                        <p className="text-green-700 font-semibold">✅ Correct Answer: 42</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-vibrant-orange rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                ✨
              </div>
            </div>
          </ScrollAnimation>

          {/* Features */}
          <ScrollAnimation animation="slideRight">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-deep-blue mb-2">Daily Habit Building</h3>
                  <p className="text-gray-600">One challenge every day to build consistent thinking habits that last a lifetime.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-vibrant-orange" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-deep-blue mb-2">Instant Feedback</h3>
                  <p className="text-gray-600">Get immediate results with confetti celebrations and detailed explanations for every answer.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-deep-blue mb-2">Streak Rewards</h3>
                  <p className="text-gray-600">Maintain your streak and earn up to 200 points daily with badges and achievements.</p>
                </div>
              </div>

              {/* Streak Counter */}
              <div className="bg-gradient-to-r from-vibrant-orange to-orange-600 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Current Streak</p>
                    <p className="text-2xl font-bold">{streakCount} days 🔥</p>
                    {getCurrentBadge() && (
                      <p className="text-sm opacity-90 mt-1">({getCurrentBadge()?.name} Badge)</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">Next Milestone</p>
                    {getNextMilestone() ? (
                      <p className="font-semibold">{getNextMilestone()?.days} days ({getNextMilestone()?.name} Badge)</p>
                    ) : (
                      <p className="font-semibold">Max Level Reached!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
};

export default DailyStreakSection;
