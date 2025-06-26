
import React, { useState } from 'react';
import { Trophy, Brain, Clock, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollAnimation from '../ScrollAnimation';
import { Badge } from '../ui/badge';

const QuizzesSection = () => {
  const [activeQuestion, setActiveQuestion] = useState(1);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showDemoMessage, setShowDemoMessage] = useState(false);

  const correctAnswer = 'C';
  const options = [
    'All Swimmers are sharks',
    'Some Swimmers are fish', 
    'All Sharks are Swimmers',
    'Some Fish are not Swimmers'
  ];

  const handleOptionSelect = (option: string, optionLetter: string) => {
    if (showResult) return;
    
    setSelectedOption(optionLetter);
    setShowResult(true);
  };

  const handleNextClick = () => {
    setShowDemoMessage(true);
    setTimeout(() => setShowDemoMessage(false), 3000);
  };

  const getOptionStyle = (optionLetter: string) => {
    if (!showResult) {
      return selectedOption === optionLetter 
        ? 'border-purple-500 bg-purple-50 text-purple-700'
        : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-colors';
    }
    
    if (optionLetter === correctAnswer) {
      return 'border-green-400 bg-green-50 text-green-700';
    }
    
    if (selectedOption === optionLetter && optionLetter !== correctAnswer) {
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
              Challenge Your Brain. Climb the Leaderboard.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Monthly level-based quizzes that test your logical reasoning with real-time scoring and parent reports.
            </p>
          </div>
        </ScrollAnimation>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Interactive Quiz Demo */}
          <ScrollAnimation animation="slideLeft">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Brain className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-deep-blue">Logic Master Quiz</h3>
                      <p className="text-sm text-gray-500">Level 3 • Question {activeQuestion}/10</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                      DEMO
                    </Badge>
                    <div className="flex items-center space-x-2 text-green-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">02:45</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(activeQuestion / 10) * 100}%` }}
                  ></div>
                </div>

                {/* Question */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-deep-blue mb-3">
                    Logical Reasoning
                  </h3>
                  <p className="text-deep-blue font-medium mb-4">
                    If all Sharks are Fish, and all Fish are Swimmers, then which of the following is definitely true?
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-2 mb-4">
                  {options.map((option, index) => {
                    const optionLetter = String.fromCharCode(65 + index);
                    return (
                      <motion.button 
                        key={index}
                        onClick={() => handleOptionSelect(option, optionLetter)}
                        disabled={showResult}
                        className={`w-full p-3 text-left border rounded-lg text-sm font-medium transition-all duration-200 ${getOptionStyle(optionLetter)} ${
                          showResult ? 'cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        whileHover={!showResult ? { scale: 1.02 } : {}}
                        whileTap={!showResult ? { scale: 0.98 } : {}}
                      >
                        <span className="font-medium text-gray-700">{optionLetter})</span>
                        <span className="ml-2 text-deep-blue">{option}</span>
                        {showResult && optionLetter === correctAnswer && (
                          <span className="ml-2">✅</span>
                        )}
                        {showResult && selectedOption === optionLetter && optionLetter !== correctAnswer && (
                          <span className="ml-2">❌</span>
                        )}
                      </motion.button>
                    );
                  })}
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

                {/* Demo Message */}
                <AnimatePresence>
                  {showDemoMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center font-semibold mb-4 text-purple-600 bg-purple-50 p-3 rounded-lg border border-purple-200"
                    >
                      🎮 This is Demo quiz only
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-between">
                  <button 
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    onClick={() => setActiveQuestion(Math.max(1, activeQuestion - 1))}
                  >
                    Previous
                  </button>
                  <button 
                    className="px-4 py-2 text-sm bg-gray-400 text-white rounded-lg cursor-not-allowed opacity-60"
                    onClick={handleNextClick}
                    disabled
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </ScrollAnimation>

          {/* Features */}
          <ScrollAnimation animation="slideRight">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-deep-blue mb-2">Level-Based Challenges</h3>
                  <p className="text-gray-600">Progressive difficulty levels that adapt to your thinking skills and challenge you appropriately.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-deep-blue mb-2">Real-Time Scoring</h3>
                  <p className="text-gray-600">Instant feedback with detailed explanations and performance analytics after every quiz.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-deep-blue mb-2">Leaderboard & Rankings</h3>
                  <p className="text-gray-600">Compete with peers and track your progress with detailed performance reports shared with parents.</p>
                </div>
              </div>

              {/* Sample Score Card */}
              <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Last Quiz Score</p>
                    <p className="text-2xl font-bold">8/10</p>
                    <p className="text-sm">Rank: #12 out of 150</p>
                  </div>
                  <div className="text-right">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Trophy className="w-6 h-6" />
                    </div>
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

export default QuizzesSection;
