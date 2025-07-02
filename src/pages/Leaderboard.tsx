import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Crown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
interface LeaderboardStudent {
  id: string;
  name: string;
  studentId: string;
  userId: string;
  dailyStreakScore: number;
  rank: number;
  schoolId: string;
  profileSubtitle?: string;
}
const Leaderboard = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [students, setStudents] = useState<LeaderboardStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserSchool, setCurrentUserSchool] = useState<string>('');
  useEffect(() => {
    if (user) {
      fetchLeaderboardData();
    }
  }, [user]);
  const fetchLeaderboardData = async () => {
    if (!user) return;
    
    console.log('=== LEADERBOARD DEBUG START ===');
    
    try {
      // First, get current user's school information
      const currentUserDoc = await getDoc(doc(db, 'students', user.uid));
      let userSchoolCode = '';
      if (currentUserDoc.exists()) {
        const userData = currentUserDoc.data();
        userSchoolCode = userData.schoolCode || userData.school || userData.districtCode || userData.district || '';
        setCurrentUserSchool(userSchoolCode);
        console.log('Current user school code:', userSchoolCode);
        console.log('Current user data:', userData);
      }

      // If no school code found, show all students as fallback
      if (!userSchoolCode) {
        console.log('No school code found, showing all students as fallback');
      }

      // Get all students from the same school
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      console.log(`Found ${studentsSnapshot.docs.length} total students in database`);
      
      const schoolStudents: any[] = [];
      for (const studentDoc of studentsSnapshot.docs) {
        const studentData = studentDoc.data();
        console.log(`Processing student: ${studentData.name || studentDoc.id}`, studentData);

        // Filter by same school if user has school, otherwise show all students
        const shouldInclude = !userSchoolCode || studentData.schoolCode === userSchoolCode || studentData.school === userSchoolCode || studentData.districtCode === userSchoolCode || studentData.district === userSchoolCode;
        if (shouldInclude) {
          // Get daily streak data for this student
          console.log(`Fetching streak data for student: ${studentData.name || studentDoc.id} (ID: ${studentDoc.id})`);
          const streakDoc = await getDoc(doc(db, 'dailyStreaks', studentDoc.id));
          let totalPoints = 0;
          let currentStreak = 0;
          
          if (streakDoc.exists()) {
            const streakData = streakDoc.data();
            console.log(`Streak data exists for ${studentData.name}:`, streakData);
            
            totalPoints = streakData.totalPoints || 0;
            currentStreak = streakData.currentStreak || 0;
            
            console.log(`Initial totalPoints: ${totalPoints}, currentStreak: ${currentStreak}`);

            // Only calculate if no stored totalPoints (same logic as DailyStreak)
            if (totalPoints === 0 && streakData.records) {
              const records = Object.values(streakData.records) as any[];
              console.log(`Found ${records.length} records for ${studentData.name}:`, records);
              
              totalPoints = records.reduce((sum: number, record: any) => {
                return sum + (typeof record?.points === 'number' ? record.points : 0);
              }, 0);
              console.log(`Calculated points for ${studentData.name}: ${totalPoints} from ${records.length} records`);
            } else if (totalPoints > 0) {
              console.log(`Using stored points for ${studentData.name}: ${totalPoints}`);
            }
          } else {
            console.log(`No streak data found for ${studentData.name || studentDoc.id}`);
          }
          console.log(`Final points for ${studentData.name}: ${totalPoints}`);
          
          schoolStudents.push({
            id: studentDoc.id,
            name: studentData.name || studentData.studentId || 'Unknown Student',
            studentId: studentData.studentId || studentDoc.id.substring(0, 8).toUpperCase(),
            userId: studentDoc.id,
            dailyStreakScore: totalPoints,
            schoolId: userSchoolCode || 'general',
            profileSubtitle: getProfileSubtitle(totalPoints, currentStreak)
          });
        }
      }

      // Sort by daily streak score (highest first) and assign ranks
      schoolStudents.sort((a, b) => b.dailyStreakScore - a.dailyStreakScore);
      const rankedStudents = schoolStudents.map((student, index) => ({
        ...student,
        rank: index + 1
      }));
      
      console.log('Final leaderboard data:', rankedStudents);
      console.log('=== LEADERBOARD DEBUG END ===');
      
      setStudents(rankedStudents);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  const getProfileSubtitle = (points: number, streak: number = 0): string => {
    // Primary classification by points (medals)
    let pointsTitle = '';
    if (points >= 4000) pointsTitle = 'Platinum Master';
    else if (points >= 3000) pointsTitle = 'Gold Champion';
    else if (points >= 2000) pointsTitle = 'Silver Achiever';
    else if (points >= 1000) pointsTitle = 'Bronze Warrior';
    else if (points >= 500) pointsTitle = 'Rising Star';
    else if (points >= 100) pointsTitle = 'Getting Started';
    else pointsTitle = 'Learning Explorer'; // Changed from "New Student"

    // Add streak info if significant
    if (streak >= 30) return `${pointsTitle} • ${streak} Day Legend`;
    if (streak >= 14) return `${pointsTitle} • ${streak} Day Hero`;
    if (streak >= 7) return `${pointsTitle} • ${streak} Day Streak`;
    if (streak >= 3) return `${pointsTitle} • ${streak} Days`;
    
    return pointsTitle;
  };
  const getShieldIcon = (rank: number) => {
    if (rank === 1) return '/sheild_icons/platinum_sheild.png';
    if (rank === 2) return '/sheild_icons/gold_sheild.png';
    if (rank === 3) return '/sheild_icons/silver_sheild.png';
    return '/sheild_icons/broze_sheild.png';
  };
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-purple-500" />;
    if (rank === 2) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-gray-400" />;
    return <Star className="w-6 h-6 text-amber-600" />;
  };
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-purple-500 to-purple-700 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
  };
  if (loading || !user) {
    return <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div animate={{
        rotate: 360
      }} transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}>
          <Trophy className="w-12 h-12 text-orange-500" />
        </motion.div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Dashboard</span>
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-800">
                🏆 School Leaderboard
              </h1>
              <p className="text-gray-600">Top performers in daily streak challenges</p>
            </div>
            <div className="w-32"></div> {/* Spacer for center alignment */}
          </div>
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Top 3 Podium */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="mb-8">
            
          </motion.div>

          {/* Remaining Rankings */}
          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.6
        }} className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-4">
              <h2 className="text-white text-xl font-bold text-center">Complete Rankings</h2>
            </div>
            
            <div className="divide-y divide-gray-100">
              {students.map((student, index) => <motion.div key={student.id} initial={{
              opacity: 0,
              x: -20
            }} animate={{
              opacity: 1,
              x: 0
            }} transition={{
              delay: 0.8 + index * 0.1
            }} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={`${getRankStyle(student.rank)} w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg`}>
                        {student.rank}
                      </div>
                      
                      {/* Shield */}
                      <img src={getShieldIcon(student.rank)} alt={`Rank ${student.rank} Shield`} className="w-10 h-10 object-contain" />
                      
                      {/* Student Details */}
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{student.name}</h3>
                        <p className="text-gray-600 text-sm">{student.profileSubtitle}</p>
                        <div className="flex gap-4 text-xs text-gray-500 mt-1">
                          <span>ID: {student.studentId}</span>
                          
                        </div>
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600">
                        {student.dailyStreakScore}
                      </div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                </motion.div>)}
            </div>
          </motion.div>

          {/* Info Card */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 1.2
        }} className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="text-center">
              <h3 className="font-bold text-blue-800 mb-2">🎯 About Daily Streak Scoring</h3>
              <p className="text-blue-700 text-sm">
                Rankings are based on daily streak scores. Answer daily questions correctly to climb the leaderboard!
                {currentUserSchool ? ' Only students from your school are shown.' : ' Showing all students.'}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>;
};
export default Leaderboard;