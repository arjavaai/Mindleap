import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Clock, 
  Brain, 
  Zap, 
  Star, 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  Trophy,
  Target,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/button';

interface Question {
  id: string;
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctOption: string;
  explanation: string;
  subject: string;
}

interface DailyQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  onSubmit: (selectedOption: string) => void;
}

const DailyQuestionModal = ({ isOpen, onClose, question, onSubmit }: DailyQuestionModalProps) => {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && !submitted) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, submitted]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedOption('');
      setSubmitted(false);
      setShowResult(false);
      setTimer(0);
      setShowConfetti(false);
    }
  }, [isOpen]);

  const handleOptionSelect = (option: string) => {
    if (submitted) return;
    setSelectedOption(option);
  };

  const handleSubmit = () => {
    if (!selectedOption || submitted) return;
    
    setSubmitted(true);
    setShowResult(true);
    
    const isCorrect = selectedOption === question.correctOption;
    if (isCorrect) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    
    // Call parent submit handler
    setTimeout(() => {
      onSubmit(selectedOption);
    }, 3000); // Give more time to show result and explanation
  };

  const getOptionStyle = (option: string) => {
    if (!showResult) {
      return selectedOption === option 
        ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 scale-105 shadow-lg'
        : 'border-gray-200 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:scale-102 transition-all duration-300';
    }
    
    if (option.toLowerCase() === question.correctOption.toLowerCase()) {
      return 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 shadow-lg transform scale-105';
    }
    
    if (selectedOption === option && option.toLowerCase() !== question.correctOption.toLowerCase()) {
      return 'border-red-500 bg-gradient-to-r from-red-50 to-pink-50 text-red-700 shadow-lg';
    }
    
    return 'border-gray-300 bg-gray-50 text-gray-500';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Confetti particles
  const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    color: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][Math.floor(Math.random() * 6)],
    x: Math.random() * 100,
    delay: Math.random() * 1
  }));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
        {/* Confetti Animation */}
        <AnimatePresence>
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              {confettiParticles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: particle.color,
                    left: `${particle.x}%`,
                    top: '-5%'
                  }}
                  initial={{
                    y: -20,
                    rotate: 0,
                    scale: 0
                  }}
                  animate={{
                    y: window.innerHeight + 50,
                    rotate: 720,
                    scale: [0, 1, 1, 0],
                    x: [0, Math.random() * 200 - 100]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 3,
                    delay: particle.delay,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto relative"
        >
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 opacity-50" />
            <motion.div
              className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-10"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-10"
              animate={{
                scale: [1.2, 1, 1.2],
                rotate: [360, 180, 0]
              }}
              transition={{ duration: 6, repeat: Infinity }}
            />
          </div>

          {/* Header */}
          <div className="relative z-10 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6 rounded-t-3xl">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Brain className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <motion.h2 
                    className="text-2xl font-bold"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {question.subject} Challenge
                  </motion.h2>
                  <motion.p 
                    className="text-purple-100"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Critical & Deductive Thinking
                  </motion.p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <motion.div 
                  className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm"
                  animate={{
                    boxShadow: [
                      "0 0 0 rgba(255,255,255,0.1)",
                      "0 0 20px rgba(255,255,255,0.2)",
                      "0 0 0 rgba(255,255,255,0.1)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Clock className="w-5 h-5" />
                  <span className="font-mono font-bold text-lg">{formatTime(timer)}</span>
                </motion.div>
                
                <motion.button
                  onClick={onClose}
                  className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Explanation Section - Shows at top when answered */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b-4 border-indigo-200"
              >
                <div className="p-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-start gap-4"
                  >
                    <motion.div
                      className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center"
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Lightbulb className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-indigo-800 mb-3 flex items-center gap-2">
                        💡 Explanation
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Sparkles className="w-5 h-5 text-yellow-500" />
                        </motion.div>
                      </h3>
                      <motion.p 
                        className="text-indigo-700 text-lg leading-relaxed"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        {question.explanation}
                      </motion.p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question Content */}
          <div className="relative z-10 p-8">
            {/* Result Message */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="text-center mb-8"
                >
                  <motion.div
                    className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-xl font-bold ${
                      selectedOption === question.correctOption 
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-2 border-green-300' 
                        : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-2 border-red-300'
                    }`}
                    animate={{
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 0 rgba(0,0,0,0.1)",
                        "0 10px 30px rgba(0,0,0,0.2)",
                        "0 0 0 rgba(0,0,0,0.1)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {selectedOption === question.correctOption ? (
                      <>
                        <Trophy className="w-8 h-8" />
                        🎉 Fantastic! You got it right!
                        <Star className="w-8 h-8" />
                      </>
                    ) : (
                      <>
                        <Target className="w-8 h-8" />
                        💪 Good try! Learn from this!
                        <ArrowRight className="w-8 h-8" />
                      </>
                    )}
                  </motion.div>
                  
                  <motion.p 
                    className="text-lg text-gray-600 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {selectedOption === question.correctOption 
                      ? '🌟 You earned 200 points! Keep up the amazing work!' 
                      : `✨ The correct answer was ${question.correctOption.toUpperCase()}. You earned 100 points for trying!`
                    }
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Question */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border-2 border-blue-100">
                <h3 className="text-2xl font-bold text-gray-800 leading-relaxed">
                  {question.question}
                </h3>
              </div>
            </motion.div>

            {/* Options */}
            <motion.div 
              className="space-y-4 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {Object.entries(question.options).map(([key, value], index) => (
                <motion.button
                  key={key}
                  onClick={() => handleOptionSelect(key)}
                  disabled={submitted}
                  className={`w-full text-left p-6 border-3 rounded-2xl transition-all duration-300 ${getOptionStyle(key)} ${
                    submitted ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={!submitted ? { 
                    scale: 1.02,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                  } : {}}
                  whileTap={!submitted ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        selectedOption === key 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                      animate={selectedOption === key ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {key.toUpperCase()}
                    </motion.div>
                    <span className="font-semibold text-lg flex-1">{value}</span>
                    
                    {/* Result Icons */}
                    <AnimatePresence>
                      {showResult && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        >
                          {key.toLowerCase() === question.correctOption.toLowerCase() && (
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-white" />
                            </div>
                          )}
                          {selectedOption === key && key.toLowerCase() !== question.correctOption.toLowerCase() && (
                            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                              <XCircle className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              ))}
            </motion.div>

            {/* Submit Button */}
            <AnimatePresence>
              {!submitted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.button
                    onClick={handleSubmit}
                    disabled={!selectedOption}
                    className={`w-full py-4 px-8 rounded-2xl font-bold text-xl transition-all duration-300 ${
                      selectedOption 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={selectedOption ? { 
                      scale: 1.02,
                      boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)"
                    } : {}}
                    whileTap={selectedOption ? { scale: 0.98 } : {}}
                    animate={selectedOption ? {
                      boxShadow: [
                        "0 0 0 rgba(147, 51, 234, 0.4)",
                        "0 0 30px rgba(147, 51, 234, 0.6)",
                        "0 0 0 rgba(147, 51, 234, 0.4)"
                      ]
                    } : {}}
                    transition={{ 
                      boxShadow: { duration: 2, repeat: Infinity }
                    }}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Zap className="w-6 h-6" />
                      Submit Answer
                      <Zap className="w-6 h-6" />
                    </div>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Points Display */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center mt-6"
                >
                  <motion.div
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg ${
                      selectedOption === question.correctOption 
                        ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800' 
                        : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600'
                    }`}
                    animate={{
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Star className="w-6 h-6" />
                    {selectedOption === question.correctOption ? '+200 Points' : '0 Points'}
                    <Star className="w-6 h-6" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DailyQuestionModal;
