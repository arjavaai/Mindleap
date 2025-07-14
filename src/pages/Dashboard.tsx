import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Brain, 
  Timer, 
  Clipboard, 
  Mic, 
  Trophy, 
  BarChart3, 
  Play,
  Flame,
  Crown,
  ArrowRight,
  Star,
  Zap,
  Target,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  Sparkles,
  User
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import ShieldProgressBar from '../components/ui/ShieldProgressBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
// New unified header
import StudentHeader from '../components/StudentHeader';

interface StudentData {
  streakCount: number;
  totalPoints: number;
  badge: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | null;
  name: string;
  questionsAnswered: number;
}

interface DailyStreakRecord {
  isCorrect: boolean;
  points: number;
  timestamp: any;
}

const Dashboard = () => {
  const [user] = useAuthState(auth);
  const [studentData, setStudentData] = useState<StudentData>({
    streakCount: 0,
    totalPoints: 0,
    badge: null,
    name: '',
    questionsAnswered: 0
  });
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('show-cursor');
    return () => {};
  }, []);

  // Refresh data when component mounts or becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        // Page became visible, refresh data
        fetchStudentData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const fetchStudentData = async () => {
    if (user) {
      try {
        const studentRef = doc(db, 'students', user.uid);
        const studentSnap = await getDoc(studentRef);
        
        if (studentSnap.exists()) {
          const data = studentSnap.data();
          
          // Debug: Log the student data to see what fields are available
          console.log('Student data from Firestore:', data);
          
          // Set profile data for modal
          setProfileData(data);
          
          // Fetch daily streak records to calculate current streak and total points
          const streakRecords = await fetchStreakRecords();
        
        // Also get the stored totals from dailyStreaks collection for accuracy
        const userStreakDoc = await getDoc(doc(db, 'dailyStreaks', user.uid));
        let currentStreak = 0;
        let totalPoints = 0;
        
        if (userStreakDoc.exists()) {
          const streakData = userStreakDoc.data();
          console.log('Dashboard - Daily Streak Data:', streakData);
          
          // Use stored values first
          currentStreak = streakData.currentStreak || 0;
          totalPoints = streakData.totalPoints || 0;
          
          // Also calculate from records like Daily Streak page does
          const records = streakData.records || {};
          const calculatedTotalPoints = Object.values(records).reduce((sum: number, record: any) => {
            return sum + (typeof record?.points === 'number' ? record.points : 0);
          }, 0);
          
          // Use calculated points if available and different from stored
          if (Number(calculatedTotalPoints) > 0) {
            totalPoints = Number(calculatedTotalPoints);
          }
          
          console.log('Dashboard - Stored values - Streak:', currentStreak, 'Points:', totalPoints);
          console.log('Dashboard - Calculated total points:', calculatedTotalPoints);
        } else {
          // Fallback to calculated values if no stored data
          console.log('Dashboard - No stored data, calculating from records:', streakRecords);
          currentStreak = calculateCurrentStreak(streakRecords);
          totalPoints = streakRecords.reduce((total, record) => total + (record.points || 0), 0);
          console.log('Dashboard - Calculated values - Streak:', currentStreak, 'Points:', totalPoints);
        }
        
          const questionsAnswered = streakRecords.length;
          
          setStudentData({
            streakCount: currentStreak,
            totalPoints: totalPoints,
          badge: getBadgeFromPoints(totalPoints),
            name: data.name || data.studentId || user.email?.split('@')[0] || 'Student',
            questionsAnswered: questionsAnswered
          });
        } else {
          setStudentData({
            streakCount: 0,
            totalPoints: 0,
          badge: null,
            name: user.email?.split('@')[0] || 'Student',
            questionsAnswered: 0
          });
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        setStudentData({
          streakCount: 0,
          totalPoints: 0,
        badge: null,
          name: user.email?.split('@')[0] || 'Student',
          questionsAnswered: 0
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudentData();
  }, [user]);



  const fetchStreakRecords = async (): Promise<DailyStreakRecord[]> => {
    if (!user) return [];
    
    try {
      // Get the user's daily streak data from the correct collection
      const userStreakDoc = await getDoc(doc(db, 'dailyStreaks', user.uid));
      
      if (userStreakDoc.exists()) {
        const data = userStreakDoc.data();
        const records = data.records || {};
        
        // Convert records object to array
        return Object.values(records).map((record: any) => ({
          isCorrect: record.isCorrect || false,
          points: record.points || (record.isCorrect ? 200 : 100),
          timestamp: record.timestamp
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching streak records:', error);
      return [];
    }
  };

  const calculateCurrentStreak = (records: DailyStreakRecord[]): number => {
    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);
    
    // Sort records by date (most recent first)
    const sortedRecords = records.sort((a, b) => {
      const dateA = a.timestamp?.toDate?.() || new Date(a.timestamp);
      const dateB = b.timestamp?.toDate?.() || new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime();
    });
    
    // Check consecutive days backwards from today
    for (let i = 0; i < 30; i++) { // Check up to 30 days back
      const dateString = format(currentDate, 'yyyy-MM-dd');
      const record = sortedRecords.find(r => {
        const recordDate = r.timestamp?.toDate?.() || new Date(r.timestamp);
        return format(recordDate, 'yyyy-MM-dd') === dateString;
      });
      
      if (record && record.isCorrect) {
        streak++;
      } else if (record && !record.isCorrect) {
        break; // Break on wrong answer
      } else if (format(currentDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        // Today hasn't been answered yet, continue checking previous days
      } else {
        break; // Break on missing day (except today)
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };

  const getBadgeFromPoints = (points: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | null => {
    if (points >= 4000) return 'Platinum';
    if (points >= 3000) return 'Gold';
    if (points >= 2000) return 'Silver';
    if (points >= 1000) return 'Bronze';
    return null; // No badge for less than 1000 points
  };

  const getMedalIcon = (badge: string) => {
    switch (badge) {
      case 'Bronze': return '/sheild_icons/broze_sheild.png';
      case 'Silver': return '/sheild_icons/silver_sheild.png';
      case 'Gold': return '/sheild_icons/gold_sheild.png';
      case 'Platinum': return '/sheild_icons/platinum_sheild.png';
      default: return '/sheild_icons/broze_sheild.png';
    }
  };

  const getPointsFromStreak = (streakCount: number): number => {
    // Each correct answer gives 200 points
    return streakCount * 200;
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Bronze': return 'from-amber-600 to-yellow-600';
      case 'Silver': return 'from-gray-400 to-gray-600';
      case 'Gold': return 'from-yellow-400 to-yellow-600';
      case 'Platinum': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'Bronze': return '🥉';
      case 'Silver': return '🥈';
      case 'Gold': return '🥇';
      case 'Platinum': return '💎';
      default: return '🏅';
    }
  };

  const getStreakColor = () => {
    if (studentData.streakCount === 0) return "from-gray-400 to-gray-600";
    if (studentData.streakCount < 3) return "from-blue-400 to-blue-600";
    if (studentData.streakCount < 7) return "from-green-400 to-green-600";
    if (studentData.streakCount < 14) return "from-yellow-400 to-yellow-600";
    if (studentData.streakCount < 30) return "from-orange-400 to-orange-600";
    return "from-purple-400 to-purple-600";
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const handleCardClick = (route: string) => {
    if (route === '/streak') {
      navigate('/daily-streak');
    } else if (route === '/quiz') {
      navigate('/quiz');
    } else if (route === '/webinars') {
      navigate('/webinars');
    } else if (route === '/workshops') {
      navigate('/workshops');
    } else {
      console.log(`Navigate to ${route}`);
    }
  };



  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  // Floating particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 4 + Math.random() * 2
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1, repeat: Infinity }
            }}
            className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <motion.p 
            className="text-lg font-semibold text-gray-700"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading your dashboard...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Floating Particles Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Sticky Header */}
      <StudentHeader 
        showBackButton={false} 
        totalPoints={studentData.totalPoints} 
        currentStreak={studentData.streakCount} 
      />

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 py-8"
      >
        {/* Welcome Hero Section */}
        <motion.div
          variants={itemVariants}
          className="mb-12"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-lg">
            {/* Shield Progress Bar */}
            <motion.div
              variants={itemVariants}
              className="mb-6"
            >
              <ShieldProgressBar currentPoints={studentData.totalPoints} />
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Action Cards */}
        <motion.div
          variants={itemVariants}
          className="grid md:grid-cols-3 lg:grid-cols-3 gap-6"
        >
          {/* Daily Streak Card */}
          <motion.div
            className="group cursor-pointer"
            onClick={() => handleCardClick('/streak')}
            whileHover={{ 
              scale: 1.02,
              y: -5,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">🔥 Daily Streak</h3>
                  <p className="text-purple-100">Challenge your mind today</p>
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Flame className="w-12 h-12" />
                </motion.div>
              </div>
              <motion.div
                className="flex items-center text-white/90 font-semibold group-hover:text-white transition-colors"
                animate={{
                  x: [0, 5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span>Start Challenge</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.div>
            </div>
          </motion.div>

          {/* Quizzes Card */}
              <motion.div
            className="group cursor-pointer"
            onClick={() => handleCardClick('/quiz')}
            whileHover={{ 
              scale: 1.02,
              y: -5,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">📚 Quizzes</h3>
                  <p className="text-green-100">Test your knowledge</p>
                </div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <BookOpen className="w-12 h-12" />
                </motion.div>
              </div>
              <motion.div
                className="flex items-center text-white/90 font-semibold group-hover:text-white transition-colors"
                animate={{
                  x: [0, 5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span>Take Quiz</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.div>
            </div>
          </motion.div>

          {/* Webinars Card */}
          <motion.div
            className="group cursor-pointer"
            onClick={() => handleCardClick('/webinars')}
            whileHover={{ 
              scale: 1.02,
              y: -5,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">🎥 Live Webinars</h3>
                  <p className="text-blue-100">Join interactive sessions</p>
                </div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Play className="w-12 h-12" />
                </motion.div>
              </div>
              <motion.div
                className="flex items-center text-white/90 font-semibold group-hover:text-white transition-colors"
                animate={{
                  x: [0, 5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span>Join Session</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.div>
            </div>
          </motion.div>

          {/* Workshops Card */}
          <motion.div
            className="group cursor-pointer"
            onClick={() => handleCardClick('/workshops')}
            whileHover={{ 
              scale: 1.02,
              y: -5,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">🛠️ Workshops</h3>
                  <p className="text-orange-100">Hands-on learning</p>
                </div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Timer className="w-12 h-12" />
                </motion.div>
              </div>
              <motion.div
                className="flex items-center text-white/90 font-semibold group-hover:text-white transition-colors"
                animate={{
                  x: [0, 5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span>Join Workshop</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.div>
          </div>
        </motion.div>

          {/* Leaderboard Card */}
            <motion.div
              className="group cursor-pointer"
            onClick={() => navigate('/leaderboard')}
              whileHover={{ 
              scale: 1.02,
              y: -5,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-3xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">🏆 Leaderboard</h3>
                  <p className="text-yellow-100">See top performers</p>
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trophy className="w-12 h-12" />
                </motion.div>
              </div>
              <motion.div
                className="flex items-center text-white/90 font-semibold group-hover:text-white transition-colors"
                animate={{
                  x: [0, 5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span>View Rankings</span>
                <ArrowRight className="w-5 h-5 ml-2" />
            </motion.div>
            </div>
        </motion.div>

          {/* Report Card */}
          <motion.div
            className="group cursor-pointer"
            onClick={() => navigate('/reports')}
            whileHover={{ 
              scale: 1.02,
              y: -5,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-3xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">📊 Report</h3>
                  <p className="text-teal-100">Track your progress</p>
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <BarChart3 className="w-12 h-12" />
                </motion.div>
              </div>
              <motion.div
                className="flex items-center text-white/90 font-semibold group-hover:text-white transition-colors"
              animate={{
                  x: [0, 5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
                <span>View Report</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Shield Progression Card */}
        <motion.div variants={itemVariants} className="mt-8">
          <ShieldProgressBar currentPoints={studentData.totalPoints} />
        </motion.div>

      </motion.div>
    </div>
  );
};

export default Dashboard;
