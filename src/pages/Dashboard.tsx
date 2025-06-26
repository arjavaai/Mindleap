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
  Sparkles
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface StudentData {
  streakCount: number;
  totalPoints: number;
  badge: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
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
    badge: 'Bronze',
    name: '',
    questionsAnswered: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('show-cursor');
    return () => {};
  }, []);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (user) {
        try {
          const studentRef = doc(db, 'students', user.uid);
          const studentSnap = await getDoc(studentRef);
          
          if (studentSnap.exists()) {
            const data = studentSnap.data();
            
            // Fetch daily streak records to calculate current streak and total points
            const streakRecords = await fetchStreakRecords();
            const currentStreak = calculateCurrentStreak(streakRecords);
            const totalPoints = streakRecords.reduce((total, record) => total + (record.points || 0), 0);
            const questionsAnswered = streakRecords.length;
            
            // Determine badge based on points
            const badge = getBadgeFromPoints(totalPoints);
            
            setStudentData({
              streakCount: currentStreak,
              totalPoints: totalPoints,
              badge: badge,
              name: data.name || data.studentId || user.email?.split('@')[0] || 'Student',
              questionsAnswered: questionsAnswered
            });
          } else {
            setStudentData({
              streakCount: 0,
              totalPoints: 0,
              badge: 'Bronze',
              name: user.email?.split('@')[0] || 'Student',
              questionsAnswered: 0
            });
          }
        } catch (error) {
          console.error('Error fetching student data:', error);
          setStudentData({
            streakCount: 0,
            totalPoints: 0,
            badge: 'Bronze',
            name: user.email?.split('@')[0] || 'Student',
            questionsAnswered: 0
          });
        }
      }
      setLoading(false);
    };

    fetchStudentData();
  }, [user]);

  const fetchStreakRecords = async (): Promise<DailyStreakRecord[]> => {
    if (!user) return [];
    
    try {
      const recordsQuery = query(
        collection(db, 'students', user.uid, 'dailyStreaks'),
        orderBy('timestamp', 'desc')
      );
      
      const recordsSnapshot = await getDocs(recordsQuery);
      return recordsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          isCorrect: data.isCorrect || false,
          points: data.isCorrect ? 200 : 0,
          timestamp: data.timestamp
        };
      });
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

  const getBadgeFromPoints = (points: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' => {
    if (points >= 5000) return 'Platinum';
    if (points >= 2000) return 'Gold';
    if (points >= 800) return 'Silver';
    return 'Bronze';
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
    } else {
      console.log(`Navigate to ${route}`);
    }
  };

  const dashboardCards = [
    {
      id: 'streak',
      title: 'Daily Streak',
      icon: <Flame className="w-8 h-8" />,
      gradient: 'from-red-400 to-orange-500',
      route: '/streak',
      description: 'Keep learning every day!'
    },
    {
      id: 'quiz',
      title: 'Quiz Challenge',
      icon: <Target className="w-8 h-8" />,
      gradient: 'from-blue-400 to-indigo-500',
      route: '/quiz',
      description: 'Test your knowledge'
    },
    {
      id: 'webinar',
      title: 'Live Webinars',
      icon: <Play className="w-8 h-8" />,
      gradient: 'from-green-400 to-emerald-500',
      route: '/webinars',
      description: 'Join live sessions'
    },
    {
      id: 'workshop',
      title: 'Workshops',
      icon: <Users className="w-8 h-8" />,
      gradient: 'from-purple-400 to-violet-500',
      route: '/workshop',
      description: 'Interactive learning'
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard',
      icon: <Trophy className="w-8 h-8" />,
      gradient: 'from-yellow-400 to-amber-500',
      route: '/leaderboard',
      description: 'See your ranking'
    },
    {
      id: 'reports',
      title: 'Progress Report',
      icon: <TrendingUp className="w-8 h-8" />,
      gradient: 'from-teal-400 to-cyan-500',
      route: '/reports',
      description: 'Track your progress'
    }
  ];

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
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <Brain className="w-7 h-7 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Mind<span className="text-purple-600">Leap</span>
                </h1>
                <p className="text-sm text-gray-600">Learning Platform</p>
              </div>
            </motion.div>

            {/* Right Side - Stats & Actions */}
            <div className="flex items-center gap-4">
              {/* Total Points */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-full"
              >
                <Star className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-bold text-yellow-800">
                  {studentData.totalPoints} Points
                </span>
              </motion.div>

              {/* Streak Count */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-2 bg-gradient-to-r ${getStreakColor()} px-4 py-2 rounded-full text-white`}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity
                  }}
                >
                  <Flame className="w-5 h-5" />
                </motion.div>
                <span className="text-sm font-bold">
                  {studentData.streakCount} Day Streak
                </span>
              </motion.div>

              {/* Level Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <motion.div
                  animate={{ 
                    boxShadow: [
                      '0 0 20px rgba(147, 51, 234, 0.3)',
                      '0 0 30px rgba(147, 51, 234, 0.6)',
                      '0 0 20px rgba(147, 51, 234, 0.3)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`flex items-center gap-2 bg-gradient-to-r ${getBadgeColor(studentData.badge)} px-4 py-2 rounded-full text-white`}
                >
                  <span className="text-lg">{getBadgeIcon(studentData.badge)}</span>
                  <span className="text-sm font-bold">{studentData.badge}</span>
                </motion.div>
              </motion.div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="hidden md:flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white/70 backdrop-blur-sm border border-gray-300 rounded-xl hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 whitespace-nowrap flex-shrink-0"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 py-8"
      >


        {/* Dashboard Cards */}
        <motion.div
          variants={itemVariants}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {dashboardCards.map((card, index) => (
            <motion.div
              key={card.id}
              variants={itemVariants}
              className="group cursor-pointer"
              onClick={() => handleCardClick(card.route)}
              whileHover={{ 
                scale: 1.05,
                y: -10,
                boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-lg h-full">
                <div className="flex items-center justify-center mb-6">
                  <motion.div
                    className={`w-16 h-16 bg-gradient-to-r ${card.gradient} rounded-2xl flex items-center justify-center text-white`}
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                  >
                    {card.icon}
                  </motion.div>
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-3">{card.title}</h3>
                <p className="text-gray-600 mb-6">{card.description}</p>

                <motion.div
                  className="flex items-center text-purple-600 font-semibold group-hover:text-purple-700 transition-colors"
                  animate={{
                    x: [0, 5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span>Explore</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Motivational Quote */}
        <motion.div
          variants={itemVariants}
          className="mt-12 text-center"
        >
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 text-white"
            animate={{
              boxShadow: [
                "0 0 20px rgba(147, 51, 234, 0.3)",
                "0 0 40px rgba(147, 51, 234, 0.5)",
                "0 0 20px rgba(147, 51, 234, 0.3)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <motion.h3
              className="text-2xl font-bold mb-4"
              animate={{
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💡 "The mind is not a vessel to be filled, but a fire to be kindled."
            </motion.h3>
            <p className="text-purple-100 text-lg">
              Keep challenging yourself every day and watch your critical thinking skills soar!
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
