import React, { useState, useEffect, useRef } from 'react';
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
  const [isQuestionExpanded, setIsQuestionExpanded] = useState(false);
  const explanationRef = useRef<HTMLDivElement>(null);

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
    
    // Scroll to explanation after a short delay
    setTimeout(() => {
      if (explanationRef.current) {
        explanationRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 1000);
    
    // Call parent submit handler
    setTimeout(() => {
      onSubmit(selectedOption);
    }, 4000); // Give more time to show result and explanation
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

  const isQuestionLong = (questionText: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = questionText;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    return textContent.split('\n').length > 8 || textContent.length > 400;
  };

  const truncateQuestion = (questionText: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = questionText;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    if (textContent.length > 400) {
      return questionText.substring(0, 400) + '...';
    }
    return questionText;
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
          className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative mx-4 sm:mx-6 md:mx-8"
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
          <div className="relative z-10 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-3 sm:p-4 rounded-t-3xl">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <motion.div
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm flex-shrink-0"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <motion.h2 
                    className="text-lg sm:text-2xl font-bold truncate"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {question.subject} Challenge
                  </motion.h2>
                  <motion.p 
                    className="text-purple-100 text-sm sm:text-base hidden sm:block"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Critical & Deductive Thinking
                  </motion.p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <motion.div 
                  className="flex items-center gap-1 sm:gap-2 bg-white/20 px-2 sm:px-4 py-1 sm:py-2 rounded-xl backdrop-blur-sm"
                  animate={{
                    boxShadow: [
                      "0 0 0 rgba(255,255,255,0.1)",
                      "0 0 20px rgba(255,255,255,0.2)",
                      "0 0 0 rgba(255,255,255,0.1)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="font-mono font-bold text-sm sm:text-lg">{formatTime(timer)}</span>
                </motion.div>
                
                <motion.button
                  onClick={onClose}
                  className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.button>
              </div>
            </div>
          </div>



          {/* Question Content */}
          <div className="relative z-10 p-3 sm:p-4 md:p-6">
            {/* Result Message */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="text-center mb-6"
                >
                  <motion.div
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-lg font-bold ${
                      selectedOption === question.correctOption 
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-300' 
                        : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-300'
                    }`}
                    animate={{
                      scale: [1, 1.02, 1],
                      boxShadow: [
                        "0 0 0 rgba(0,0,0,0.1)",
                        "0 5px 15px rgba(0,0,0,0.2)",
                        "0 0 0 rgba(0,0,0,0.1)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {selectedOption === question.correctOption ? (
                      <>
                        <Trophy className="w-6 h-6" />
                        🎉 Fantastic! You got it right!
                        <Star className="w-6 h-6" />
                      </>
                    ) : (
                      <>
                        <Target className="w-6 h-6" />
                        💪 Good try! Learn from this!
                        <ArrowRight className="w-6 h-6" />
                      </>
                    )}
                  </motion.div>
                  
                  <motion.p 
                    className="text-base text-gray-600 mt-3"
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
              className="mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-3 sm:p-4 rounded-xl border border-blue-100">
                <div 
                  className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 leading-snug break-words"
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    maxWidth: '100%'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: isQuestionLong(question.question) && !isQuestionExpanded 
                      ? truncateQuestion(question.question) 
                      : question.question 
                  }}
                />
                {isQuestionLong(question.question) && (
                  <button
                    onClick={() => setIsQuestionExpanded(!isQuestionExpanded)}
                    className="mt-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                  >
                    {isQuestionExpanded ? 'Read Less' : 'Read More'}
                  </button>
                )}
              </div>
            </motion.div>

            {/* Options */}
            <motion.div 
              className="space-y-2 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {Object.entries(question.options).map(([key, value], index) => (
                <motion.button
                  key={key}
                  onClick={() => handleOptionSelect(key)}
                  disabled={submitted}
                  className={`w-full text-left p-3 sm:p-4 border-2 rounded-xl transition-all duration-300 ${getOptionStyle(key)} ${
                    submitted ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={!submitted ? { 
                    scale: 1.01,
                    boxShadow: "0 5px 15px rgba(0,0,0,0.1)"
                  } : {}}
                  whileTap={!submitted ? { scale: 0.99 } : {}}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base ${
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
                    <div 
                      className="font-medium text-sm sm:text-base flex-1" 
                      dangerouslySetInnerHTML={{ __html: value }}
                    />
                    
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

            {/* Explanation Section - Shows below options when answered */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  ref={explanationRef}
                  initial={{ opacity: 0, height: 0, y: 20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 20 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="mb-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border border-indigo-200 shadow-md"
                >
                  <div className="p-3 sm:p-4 overflow-hidden">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="flex items-start gap-4 w-full"
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
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <motion.h3 
                          className="text-base sm:text-lg font-bold text-indigo-800 mb-2 flex items-center gap-2"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 }}
                        >
                          💡 Explanation
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                          </motion.div>
                        </motion.h3>
                        <motion.div 
                          className="text-indigo-700 text-sm sm:text-base leading-relaxed prose prose-sm max-w-none"
                          style={{ 
                            wordWrap: 'break-word', 
                            overflowWrap: 'break-word', 
                            hyphens: 'auto',
                            width: '100%',
                            maxWidth: '100%'
                          }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9 }}
                          dangerouslySetInnerHTML={{ __html: question.explanation }}
                        />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                    className={`w-full py-3 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
                      selectedOption 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    whileHover={selectedOption ? { 
                      scale: 1.01,
                      boxShadow: "0 10px 20px rgba(147, 51, 234, 0.3)"
                    } : {}}
                    whileTap={selectedOption ? { scale: 0.99 } : {}}
                    animate={selectedOption ? {
                      boxShadow: [
                        "0 0 0 rgba(147, 51, 234, 0.4)",
                        "0 0 15px rgba(147, 51, 234, 0.6)",
                        "0 0 0 rgba(147, 51, 234, 0.4)"
                      ]
                    } : {}}
                    transition={{ 
                      boxShadow: { duration: 2, repeat: Infinity }
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Zap className="w-5 h-5" />
                      Submit Answer
                      <Zap className="w-5 h-5" />
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
                    {selectedOption === question.correctOption ? '+200 Points' : '+100 Points'}
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
