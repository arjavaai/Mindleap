import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Trophy, Flame, Brain, ArrowLeft, Zap, Star, Target, CheckCircle, XCircle, Play, Award, TrendingUp, Sparkles } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, query, where, getDocs, orderBy, arrayUnion, updateDoc } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import DailyQuestionModal from '../components/streak/DailyQuestionModal';
import StreakCalendar from '../components/streak/StreakCalendar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
interface DailyStreakRecord {
  questionId: string;
  subject: string;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
  timeTaken: number;
  timestamp: Date;
  explanation: string;
  status: 'correct' | 'wrong' | 'skipped' | 'pending';
  points: number;
}
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
interface Subject {
  id: string;
  name: string;
  scheduledDay: string;
}
const DailyStreak = () => {
  const [user] = useAuthState(auth);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [todayQuestion, setTodayQuestion] = useState<Question | null>(null);
  const [todayRecord, setTodayRecord] = useState<DailyStreakRecord | null>(null);
  const [streakRecords, setStreakRecords] = useState<Record<string, DailyStreakRecord>>({});
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const navigate = useNavigate();
  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');

  // Animation variants
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      y: 20,
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  // Floating particles animation
  const particles = Array.from({
    length: 20
  }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2
  }));

  // Get today's day of week for subject scheduling
  const getTodaySubject = async (): Promise<Subject | null> => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayDayName = dayNames[today.getDay()];
    try {
      const subjectsQuery = query(collection(db, 'subjects'), where('scheduledDay', '==', todayDayName));
      const subjectsSnapshot = await getDocs(subjectsQuery);
      if (!subjectsSnapshot.empty) {
        const subjectDoc = subjectsSnapshot.docs[0];
        return {
          id: subjectDoc.id,
          name: subjectDoc.data().name,
          scheduledDay: subjectDoc.data().scheduledDay
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting today subject:', error);
      return null;
    }
  };

  // Get user's answered questions to avoid repeats
  const getUserAnsweredQuestions = async () => {
    if (!user) return [];
    try {
      const userDoc = await getDoc(doc(db, 'students', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.questionsAnswered || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting user answered questions:', error);
      return [];
    }
  };

  // Get random question for today
  const getRandomQuestionForToday = async (subjectId: string, answeredQuestionIds: string[]) => {
    try {
      const questionsSnapshot = await getDocs(collection(db, 'subjects', subjectId, 'questions'));
      if (!questionsSnapshot.empty) {
        // Filter out already answered questions
        const availableQuestions = questionsSnapshot.docs.filter(doc => !answeredQuestionIds.includes(doc.id));
        if (availableQuestions.length === 0) {
          console.log('No more questions available for this subject');
          return null;
        }

        // Get random question from available ones
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const selectedQuestion = availableQuestions[randomIndex];
        return {
          id: selectedQuestion.id,
          ...selectedQuestion.data()
        } as Question;
      }
      return null;
    } catch (error) {
      console.error('Error getting random question:', error);
      return null;
    }
  };
  useEffect(() => {
    // Ensure normal cursor is visible
    document.body.classList.add('show-cursor');
    document.body.style.cursor = 'auto';
    if (user) {
      loadTodayData();
      loadStreakRecords();
    }
    return () => {
      document.body.classList.remove('show-cursor');
      document.body.style.cursor = '';
    };
  }, [user]);
  const loadTodayData = async () => {
    try {
      if (!user) return;
      const streakDoc = await getDoc(doc(db, 'dailyStreaks', user.uid));
      if (streakDoc.exists()) {
        const streakData = streakDoc.data();
        const todayRecord = streakData.records?.[todayString];
        if (todayRecord) {
          setTodayRecord(todayRecord);
        } else {
          await loadTodayQuestion();
        }
      } else {
        await loadTodayQuestion();
      }
    } catch (error) {
      console.error('Error loading today data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const loadTodayQuestion = async () => {
    const todaySubject = await getTodaySubject();
    if (!todaySubject) return;
    const answeredQuestions = await getUserAnsweredQuestions();
    const question = await getRandomQuestionForToday(todaySubject.id, answeredQuestions);
    if (question) {
      setTodayQuestion({
        ...question,
        subject: todaySubject.name
      });
    }
  };
  const loadStreakRecords = async () => {
    try {
      if (!user) return;
      const streakDoc = await getDoc(doc(db, 'dailyStreaks', user.uid));
      if (streakDoc.exists()) {
        const streakData = streakDoc.data();
        setStreakRecords(streakData.records || {});
        setCurrentStreak(streakData.currentStreak || 0);
        setTotalPoints(streakData.totalPoints || 0);

        // Calculate current streak
        const records = streakData.records || {};
        let streak = 0;
        let currentDate = new Date();
        while (true) {
          const dateString = format(currentDate, 'yyyy-MM-dd');
          const record = records[dateString];
          if (record && record.isCorrect) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else if (dateString === todayString && record) {
            // Today's record exists but might not be correct
            break;
          } else {
            break;
          }
        }
        setCurrentStreak(streak);

        // Calculate total points
        const totalPts = Object.values(records).reduce((sum: number, record: any) => {
          return sum + (typeof record?.points === 'number' ? record.points : 0);
        }, 0);
        setTotalPoints(Number(totalPts));
      }
    } catch (error) {
      console.error('Error loading streak records:', error);
    }
  };
  const handleStartChallenge = () => {
    setQuestionStartTime(new Date());
    setShowQuestionModal(true);
  };
  const handleAnswerSubmit = async (selectedOption: string) => {
    if (!todayQuestion || !user || !questionStartTime) return;
    const endTime = new Date();
    const timeTaken = Math.floor((endTime.getTime() - questionStartTime.getTime()) / 1000);
    const isCorrect = selectedOption === todayQuestion.correctOption;
    const points = isCorrect ? 200 : 100;
    const record: DailyStreakRecord = {
      questionId: todayQuestion.id,
      subject: todayQuestion.subject,
      selectedOption,
      correctOption: todayQuestion.correctOption,
      isCorrect,
      timeTaken,
      timestamp: new Date(),
      explanation: todayQuestion.explanation,
      status: isCorrect ? 'correct' : 'wrong',
      points
    };
    try {
      await setDoc(doc(db, 'dailyStreaks', user.uid), {
        records: {
          [todayString]: record
        },
        currentStreak: isCorrect ? currentStreak + 1 : 0,
        totalPoints: totalPoints + points,
        lastUpdated: new Date()
      }, {
        merge: true
      });
      setTodayRecord(record);
      setCurrentStreak(isCorrect ? currentStreak + 1 : 0);
      setTotalPoints(prev => prev + points);
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };
  const handleCloseModal = () => {
    setShowQuestionModal(false);
  };
  const getStreakMessage = () => {
    if (currentStreak === 0) return "Start Your Streak Today!";
    if (currentStreak < 5) return `${currentStreak} Day Streak - Keep Going!`;
    if (currentStreak < 10) return `${currentStreak} Day Streak - You're on Fire!`;
    return `${currentStreak} Day Streak - Unstoppable!`;
  };
  const getStreakColor = () => {
    if (currentStreak === 0) return "from-gray-400 to-gray-500";
    if (currentStreak < 5) return "from-blue-400 to-blue-500";
    if (currentStreak < 10) return "from-orange-400 to-red-500";
    return "from-purple-400 to-pink-500";
  };
  const getBadgeFromPoints = (points: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' => {
    if (points >= 4000) return 'Platinum';
    if (points >= 3000) return 'Gold';
    if (points >= 2000) return 'Silver';
    if (points >= 1000) return 'Bronze';
    return 'Bronze'; // Default for less than 1000 points
  };
  const getMedalIcon = (badge: string) => {
    switch (badge) {
      case 'Bronze':
        return '/sheild_icons/broze_sheild.png';
      case 'Silver':
        return '/sheild_icons/silver_sheild.png';
      case 'Gold':
        return '/sheild_icons/gold_sheild.png';
      case 'Platinum':
        return '/sheild_icons/platinum_sheild.png';
      default:
        return '/sheild_icons/broze_sheild.png';
    }
  };
  const getPointsFromStreak = (streakCount: number): number => {
    // Each correct answer gives 200 points
    return streakCount * 200;
  };
  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Bronze':
        return 'from-amber-600 to-yellow-600';
      case 'Silver':
        return 'from-gray-400 to-gray-600';
      case 'Gold':
        return 'from-yellow-400 to-yellow-600';
      case 'Platinum':
        return 'from-purple-400 to-purple-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };
  if (isLoading) {
    return <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div initial={{
        opacity: 0,
        scale: 0.8
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="text-center">
          <motion.div animate={{
          rotate: 360,
          scale: [1, 1.1, 1]
        }} transition={{
          rotate: {
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          },
          scale: {
            duration: 1,
            repeat: Infinity
          }
        }} className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <motion.p className="text-lg font-semibold text-gray-700" animate={{
          opacity: [0.5, 1, 0.5]
        }} transition={{
          duration: 1.5,
          repeat: Infinity
        }}>
            Loading your challenge...
          </motion.p>
        </motion.div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Floating Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => <motion.div key={particle.id} className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20" style={{
        left: `${particle.x}%`,
        top: `${particle.y}%`
      }} animate={{
        y: [0, -100, 0],
        opacity: [0.2, 0.5, 0.2],
        scale: [1, 1.5, 1]
      }} transition={{
        duration: particle.duration,
        delay: particle.delay,
        repeat: Infinity,
        ease: "easeInOut"
      }} />)}
      </div>

      {/* Header */}
      <motion.header initial={{
      y: -100,
      opacity: 0
    }} animate={{
      y: 0,
      opacity: 1
    }} transition={{
      type: "spring",
      stiffness: 100
    }} className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <motion.div initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} className="flex items-center gap-3">
                <img src="/lovable-uploads/7f6ab2a8-9863-4f75-ae5a-f2b087639caa.png" alt="MindLeap - Ignite Young Minds" className="h-12 w-auto cursor-pointer" onClick={() => navigate('/')} />
              </motion.div>
              
              {/* Back Button */}
              <motion.button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors" whileHover={{
              x: -5
            }} whileTap={{
              scale: 0.95
            }}>
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </motion.button>
            </div>

            <motion.div className="flex items-center gap-4" initial={{
            opacity: 0,
            scale: 0.8
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            delay: 0.2
          }}>
              <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-full">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="font-bold text-yellow-800">{totalPoints} Points</span>
              </div>
              
              <div className={`flex items-center gap-2 bg-gradient-to-r ${getStreakColor()} px-4 py-2 rounded-full text-white`}>
                <motion.div animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }} transition={{
                duration: 2,
                repeat: Infinity
              }}>
                  <Flame className="w-5 h-5" />
                </motion.div>
                <span className="font-bold">{currentStreak} Day Streak</span>
              </div>
              
                            
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Today's Challenge Card */}
          <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Today's Challenge</h3>
                    <p className="text-purple-100">{format(today, 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                
                {todayRecord && <motion.div initial={{
                scale: 0
              }} animate={{
                scale: 1
              }} className={`w-12 h-12 rounded-full flex items-center justify-center ${todayRecord.isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                    {todayRecord.isCorrect ? <CheckCircle className="w-6 h-6 text-white" /> : <XCircle className="w-6 h-6 text-white" />}
                  </motion.div>}
              </div>
            </div>

            <div className="p-8">
              {todayRecord ? <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} className="text-center">
                  <motion.div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${todayRecord.isCorrect ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-pink-500'}`} animate={{
                scale: [1, 1.1, 1],
                rotate: todayRecord.isCorrect ? [0, 10, -10, 0] : [0, -10, 10, 0]
              }} transition={{
                duration: 2,
                repeat: Infinity
              }}>
                    {todayRecord.isCorrect ? <Trophy className="w-10 h-10 text-white" /> : <Target className="w-10 h-10 text-white" />}
                  </motion.div>

                  <h4 className={`text-2xl font-bold mb-2 ${todayRecord.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {todayRecord.isCorrect ? 'Challenge Completed!' : 'Try Again Tomorrow!'}
                  </h4>

                  <p className="text-gray-600 mb-4">
                    Subject: <span className="font-semibold text-purple-600">{todayRecord.subject}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Time Taken</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.floor(todayRecord.timeTaken / 60)}:{(todayRecord.timeTaken % 60).toString().padStart(2, '0')}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Points Earned</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {todayRecord.points}
                      </p>
                    </div>
                  </div>

                  {todayRecord.explanation && <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl text-left">
                      <h5 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Explanation:
                      </h5>
                      <p 
                        className="text-purple-700 text-sm" 
                        dangerouslySetInnerHTML={{ __html: todayRecord.explanation }}
                      />
                    </div>}
                </motion.div> : todayQuestion ? <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} className="text-center">
                  <motion.div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6" animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }} transition={{
                duration: 2,
                repeat: Infinity
              }}>
                    <Play className="w-10 h-10 text-white" />
                  </motion.div>

                  <h4 className="text-2xl font-bold text-gray-800 mb-2">Ready for Today's Challenge?</h4>
                  <p className="text-gray-600 mb-6">
                    Subject: <span className="font-semibold text-purple-600">{todayQuestion.subject}</span>
                  </p>

                  <motion.button onClick={handleStartChallenge} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform transition-all duration-200" whileHover={{
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(147, 51, 234, 0.3)"
              }} whileTap={{
                scale: 0.95
              }}>
                    <div className="flex items-center gap-3">
                      <Zap className="w-6 h-6" />
                      <span className="text-lg">Start Today's Challenge</span>
                      <Zap className="w-6 h-6" />
                    </div>
                  </motion.button>
                </motion.div> : <motion.div initial={{
              opacity: 0,
              y: 20
            }} animate={{
              opacity: 1,
              y: 0
            }} className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-600 mb-2">No Challenge Today</h4>
                  <p className="text-gray-500">Check back tomorrow for a new challenge!</p>
                </motion.div>}
            </div>
          </motion.div>

          {/* Streak Calendar */}
          <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Streak Calendar</h3>
                  <p className="text-blue-100">Track your daily progress</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <StreakCalendar records={streakRecords} />
            </div>
          </motion.div>
        </div>

        {/* Achievement Badge Section */}
        <motion.div variants={itemVariants} className="mt-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden">
            

            
          </div>
        </motion.div>
      </motion.div>

      {/* Question Modal */}
      <DailyQuestionModal isOpen={showQuestionModal} onClose={handleCloseModal} question={todayQuestion!} onSubmit={handleAnswerSubmit} />
    </div>;
};
export default DailyStreak;