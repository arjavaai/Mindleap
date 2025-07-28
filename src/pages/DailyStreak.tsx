import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Trophy, Flame, Brain, ArrowLeft, Zap, Star, Target, CheckCircle, XCircle, Play, Award, TrendingUp, Sparkles } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { collection, doc, getDoc, setDoc, query, where, getDocs, orderBy, arrayUnion, updateDoc, limit } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import DailyQuestionModal from '../components/streak/DailyQuestionModal';
import StreakCalendar from '../components/streak/StreakCalendar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import StudentHeader from '../components/StudentHeader';
import StudentAuthGuard from '../components/auth/StudentAuthGuard';
import { isInCurrentWeek, formatTime, stripHtml } from '../utils/htmlUtils';
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

  // Get scheduled question for today - same question for all students
  const getScheduledQuestionForToday = async (subjectId: string, todayDateString: string) => {
    try {
      // First, check if there's already a scheduled question for today
      const dailyQuestionDoc = await getDoc(doc(db, 'dailyQuestions', todayDateString));
      
      if (dailyQuestionDoc.exists()) {
        const dailyQuestionData = dailyQuestionDoc.data();
        if (dailyQuestionData.subject === await getTodaySubject()?.then(s => s?.name)) {
          // Get the actual question from the subjects collection
          const questionDoc = await getDoc(doc(db, 'subjects', subjectId, 'questions', dailyQuestionData.questionId));
          if (questionDoc.exists()) {
            return {
              id: questionDoc.id,
              ...questionDoc.data()
            } as Question;
          }
        }
      }

      // If no scheduled question exists, create one
      await scheduleQuestionForToday(subjectId, todayDateString);
      
      // Fetch the newly scheduled question
      const newDailyQuestionDoc = await getDoc(doc(db, 'dailyQuestions', todayDateString));
      if (newDailyQuestionDoc.exists()) {
        const dailyQuestionData = newDailyQuestionDoc.data();
        const questionDoc = await getDoc(doc(db, 'subjects', subjectId, 'questions', dailyQuestionData.questionId));
        if (questionDoc.exists()) {
          return {
            id: questionDoc.id,
            ...questionDoc.data()
          } as Question;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting scheduled question:', error);
      return null;
    }
  };

  // Schedule a question for today - this ensures all students get the same question
  const scheduleQuestionForToday = async (subjectId: string, dateString: string) => {
    try {
      const todaySubject = await getTodaySubject();
      if (!todaySubject) return;

      // Get all questions for this subject
      const questionsSnapshot = await getDocs(collection(db, 'subjects', subjectId, 'questions'));
      if (questionsSnapshot.empty) {
        console.log('No questions available for this subject');
        return;
      }

      // Get previously used questions to avoid immediate repeats
      const recentQuestions = await getRecentlyUsedQuestions(subjectId, 30); // Last 30 days

      // Filter out recently used questions
      const availableQuestions = questionsSnapshot.docs.filter(doc => 
        !recentQuestions.includes(doc.id)
      );

      // If no unused questions, use all questions (reset cycle)
      const questionsToChooseFrom = availableQuestions.length > 0 ? availableQuestions : questionsSnapshot.docs;

      // Select a random question from available ones
      const randomIndex = Math.floor(Math.random() * questionsToChooseFrom.length);
      const selectedQuestion = questionsToChooseFrom[randomIndex];

      // Save the scheduled question for today
      await setDoc(doc(db, 'dailyQuestions', dateString), {
        date: dateString,
        questionId: selectedQuestion.id,
        subject: todaySubject.name,
        subjectId: subjectId,
        scheduledDay: todaySubject.scheduledDay,
        createdAt: new Date(),
        totalAttempts: 0,
        correctAttempts: 0
      });

      console.log(`Scheduled question ${selectedQuestion.id} for ${dateString}`);
    } catch (error) {
      console.error('Error scheduling question:', error);
    }
  };

  // Get recently used question IDs to avoid repeats
  const getRecentlyUsedQuestions = async (subjectId: string, days: number): Promise<string[]> => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const recentQuestions: string[] = [];
      
      // Query recent daily questions
      const dailyQuestionsQuery = query(
        collection(db, 'dailyQuestions'),
        where('subjectId', '==', subjectId),
        orderBy('date', 'desc'),
        limit(days)
      );

      const dailyQuestionsSnapshot = await getDocs(dailyQuestionsQuery);
      dailyQuestionsSnapshot.forEach(doc => {
        const data = doc.data();
        recentQuestions.push(data.questionId);
      });

      return recentQuestions;
    } catch (error) {
      console.error('Error getting recently used questions:', error);
      return [];
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
  // Get question for a specific date (used for missed questions)
  const getQuestionForDate = async (subjectId: string, dateString: string) => {
    try {
      const questionsSnapshot = await getDocs(collection(db, 'subjects', subjectId, 'questions'));
      if (!questionsSnapshot.empty) {
        const questions = questionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (questions.length === 0) {
          console.log('No questions available for this subject');
          return null;
        }

        // Use date as seed for consistent question selection for that date
        const dateHash = dateString.split('-').join('');
        const questionIndex = parseInt(dateHash) % questions.length;
        
        return questions[questionIndex] as Question;
      }
      return null;
    } catch (error) {
      console.error('Error getting question for date:', error);
      return null;
    }
  };

  const loadTodayQuestion = async () => {
    const todaySubject = await getTodaySubject();
    if (!todaySubject) return;
    const question = await getScheduledQuestionForToday(todaySubject.id, todayString);
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

        // Calculate current streak with new weekday-only logic
        const records = streakData.records || {};
        let streak = 0;
        let currentDate = new Date();
        let consecutiveMissedWeekdays = 0;
        
        while (true) {
          const dateString = format(currentDate, 'yyyy-MM-dd');
          const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
          const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
          const record = records[dateString];
          
          if (isWeekday) {
            // Only count weekdays for streak calculation
            if (record) {
              // Student attempted on this weekday - increment streak regardless of correctness
              streak++;
              consecutiveMissedWeekdays = 0;
            } else {
              // Student missed this weekday - check if it's recent enough to break streak
              const daysDifference = Math.floor((new Date().getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
              if (daysDifference > 0) { // Don't count today if not attempted yet
                consecutiveMissedWeekdays++;
                if (consecutiveMissedWeekdays >= 1) { // Break streak on first missed weekday
                  break;
                }
              }
            }
          }
          // Skip weekends (Saturday/Sunday) - they don't affect streak
          
          currentDate.setDate(currentDate.getDate() - 1);
          
          // Prevent infinite loop - stop after checking 60 days back
          const totalDaysBack = Math.floor((new Date().getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          if (totalDaysBack > 60) break;
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
  const handleAnswerSubmit = async (selectedOption: string, questionDate?: string) => {
    if (!todayQuestion || !user || !questionStartTime) return;
    
    const endTime = new Date();
    const timeTaken = Math.floor((endTime.getTime() - questionStartTime.getTime()) / 1000);
    const isCorrect = selectedOption === todayQuestion.correctOption;
    
    // Determine target date and week context
    const targetDate = questionDate || todayString;
    const targetDateObj = new Date(targetDate);
    const isCurrentDay = targetDate === todayString;
    const isCurrentWeek = isInCurrentWeek(targetDateObj);
    
    // Points logic based on timing
    let points = 0;
    if (isCurrentDay) {
      points = isCorrect ? 200 : 100; // Full points for current day
    } else if (isCurrentWeek) {
      points = 100; // Fixed 100 points for missed questions in same week (regardless of correct/wrong)
    } else {
      points = 0; // No points for past weeks
    }
    
    const record: DailyStreakRecord = {
      questionId: todayQuestion.id,
      subject: todayQuestion.subject,
      selectedOption,
      correctOption: todayQuestion.correctOption,
      isCorrect,
      timeTaken,
      timestamp: new Date(), // Always use current timestamp for when answered
      explanation: todayQuestion.explanation,
      status: isCorrect ? 'correct' : 'wrong',
      points
    };
    
    try {
      // Calculate new streak only for current day questions
      let newStreak = currentStreak;
      if (isCurrentDay) {
        const dayOfWeek = today.getDay();
        const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
        if (isWeekday) {
          newStreak = currentStreak + 1; // Increment on any attempt during weekdays
        }
      }
      
      await setDoc(doc(db, 'dailyStreaks', user.uid), {
        records: {
          [targetDate]: record
        },
        currentStreak: newStreak,
        totalPoints: totalPoints + points,
        lastUpdated: new Date()
      }, {
        merge: true
      });

      // Update daily question statistics only for current day
      if (isCurrentDay) {
        const dailyQuestionRef = doc(db, 'dailyQuestions', todayString);
        const dailyQuestionDoc = await getDoc(dailyQuestionRef);
        if (dailyQuestionDoc.exists()) {
          const data = dailyQuestionDoc.data();
          await updateDoc(dailyQuestionRef, {
            totalAttempts: (data.totalAttempts || 0) + 1,
            correctAttempts: (data.correctAttempts || 0) + (isCorrect ? 1 : 0)
          });
        }
      }

      // Update local state
      if (isCurrentDay) {
        setTodayRecord(record);
        setCurrentStreak(newStreak);
      }
      
      setTotalPoints(prev => prev + points);
      
      // Update streak records for calendar
      setStreakRecords(prev => ({
        ...prev,
        [targetDate]: record
      }));
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };
  const handleCloseModal = () => {
    setShowQuestionModal(false);
  };

  const handleDateClick = async (dateString: string) => {
    try {
      // Check if this date is in the current week and is a past date
      const clickedDate = new Date(dateString);
      const isCurrentWeek = isInCurrentWeek(clickedDate);
      const isPastDate = clickedDate < today;
      
      if (!isCurrentWeek || !isPastDate) {
        return; // Only allow clicking on past dates in current week
      }

      // Check if there's already a record for this date
      if (streakRecords[dateString]) {
        return; // Already answered
      }

      // Get the subject for that day
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[clickedDate.getDay()];
      
      const subjectsQuery = query(collection(db, 'subjects'), where('scheduledDay', '==', dayName));
      const subjectsSnapshot = await getDocs(subjectsQuery);
      
      if (subjectsSnapshot.empty) {
        console.log('No subject scheduled for', dayName);
        return;
      }

      const subjectDoc = subjectsSnapshot.docs[0];
      const subject = {
        id: subjectDoc.id,
        name: subjectDoc.data().name,
        scheduledDay: subjectDoc.data().scheduledDay
      };

      // Get the scheduled question for that date
      const question = await getQuestionForDate(subject.id, dateString);
      
      if (question) {
        setTodayQuestion({
          ...question,
          subject: subject.name
        });
        setQuestionStartTime(new Date());
        setShowQuestionModal(true);
      }
    } catch (error) {
      console.error('Error handling date click:', error);
    }
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
  return <StudentAuthGuard>
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
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

      {/* Unified Header */}
      <StudentHeader backTo="/dashboard" backLabel="Back to Dashboard" />

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

                  {todayRecord.explanation && <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl text-left overflow-hidden">
                      <h5 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        Explanation:
                      </h5>
                      <div 
                        className="text-purple-700 text-sm leading-relaxed break-words overflow-wrap-anywhere"
                        style={{
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          hyphens: 'auto'
                        }}
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
              <StreakCalendar 
                records={streakRecords} 
                onDateClick={handleDateClick}
              />
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
      <DailyQuestionModal 
        isOpen={showQuestionModal} 
        onClose={handleCloseModal} 
        question={todayQuestion!} 
        onSubmit={(selectedOption) => handleAnswerSubmit(selectedOption)}
      />
    </div>
  </StudentAuthGuard>;
};
export default DailyStreak;