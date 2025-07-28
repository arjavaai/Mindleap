import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Crown, Star, Lock } from 'lucide-react';
import StudentHeader from '../components/StudentHeader';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import StudentAuthGuard from '../components/auth/StudentAuthGuard';
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
    
    try {
      // Get current user's school information
      const currentUserDoc = await getDoc(doc(db, 'students', user.uid));
      let userSchoolCode = '';
      if (currentUserDoc.exists()) {
        const userData = currentUserDoc.data();
        userSchoolCode = userData.schoolCode || userData.school || userData.districtCode || userData.district || '';
        setCurrentUserSchool(userSchoolCode);
      }

      // Get ALL students from the students collection
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const leaderboardData: LeaderboardStudent[] = [];
      const processedUIDs = new Set<string>(); // Prevent duplicates
      
      for (const studentDoc of studentsSnapshot.docs) {
        const studentData = studentDoc.data();
        // Use the Firebase Auth UID stored in the document, not the document ID
        const studentUID = studentData.uid || studentDoc.id;
        
        // Skip if already processed (prevent duplicates)
        if (processedUIDs.has(studentUID)) {
          continue;
        }
        processedUIDs.add(studentUID);
        
        // Skip invalid students
        if (!studentData.name || studentData.name.trim() === '' || studentData.name === 'Unknown Student') {
          continue;
        }
        
        // Filter by school if user has school
        const shouldInclude = !userSchoolCode || 
          studentData.schoolCode === userSchoolCode || 
          studentData.school === userSchoolCode || 
          studentData.districtCode === userSchoolCode || 
          studentData.district === userSchoolCode;
          
        if (!shouldInclude) {
          continue;
        }
        
        // Get daily streak data for this student
        let totalPoints = 0;
        let currentStreak = 0;
        
        try {
          const streakDoc = await getDoc(doc(db, 'dailyStreaks', studentUID));
          
          if (streakDoc.exists()) {
            const streakData = streakDoc.data();
            currentStreak = streakData.currentStreak || 0;
            totalPoints = streakData.totalPoints || 0;

            // Calculate from records (same as useStudentData)
            const records = streakData.records || {};
            const calculatedPoints = Object.values(records).reduce((sum, record) => {
              return sum + (typeof record?.points === 'number' ? record.points : 0);
            }, 0);

            // Use calculated points if available
            if (calculatedPoints > 0) {
              totalPoints = calculatedPoints;
            }
          }
        } catch (error) {
          // Silently handle error - student will show 0 points
        }
        
        // Add to leaderboard
        leaderboardData.push({
          id: studentUID,
          name: studentData.name,
          studentId: studentData.studentId || studentUID.substring(0, 8).toUpperCase(),
          userId: studentUID,
          dailyStreakScore: totalPoints,
          rank: 0, // Will be set after sorting
          schoolId: userSchoolCode || 'general',
          profileSubtitle: getProfileSubtitle(totalPoints, currentStreak)
        });
        

      }
      
      // Sort by points (highest first) and assign ranks
      leaderboardData.sort((a, b) => b.dailyStreakScore - a.dailyStreakScore);
      const rankedStudents = leaderboardData.map((student, index) => ({
        ...student,
        rank: index + 1
      }));
      

      
      setStudents(rankedStudents);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getProfileSubtitle = (points: number, streak: number = 0): string => {
    // Primary classification by points (medals) - for all students
    let pointsTitle = '';
    if (points >= 4000) pointsTitle = 'Platinum Master';
    else if (points >= 3000) pointsTitle = 'Gold Champion';
    else if (points >= 2000) pointsTitle = 'Silver Achiever';
    else if (points >= 1000) pointsTitle = 'Bronze Warrior';
    else if (points >= 500) pointsTitle = 'Rising Star';
    else if (points >= 100) pointsTitle = 'Getting Started';
    else pointsTitle = 'Student'; // Changed from "New Student" to just "Student"

    // Add streak info if significant
    if (streak >= 30) return `${pointsTitle} • ${streak} Day Legend`;
    if (streak >= 14) return `${pointsTitle} • ${streak} Day Hero`;
    if (streak >= 7) return `${pointsTitle} • ${streak} Day Streak`;
    if (streak >= 3) return `${pointsTitle} • ${streak} Days`;
    
    return pointsTitle;
  };
  
  const getShieldIcon = (points: number) => {
    // Show shields based on actual points achieved, not rank
    if (points >= 4000) return '/sheild_icons/platinum_sheild.png';
    if (points >= 3000) return '/sheild_icons/gold_sheild.png';
    if (points >= 2000) return '/sheild_icons/silver_sheild.png';
    if (points >= 1000) return '/sheild_icons/broze_sheild.png';
    // Return null for students who haven't achieved any shield
    return null;
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Trophy className="w-12 h-12 text-orange-500" />
        </motion.div>
      </div>
    );
  }
  
  return (
    <StudentAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
        {/* Unified Header */}
        <StudentHeader backTo="/dashboard" />

        {/* Leaderboard Content */}
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Top 3 Podium */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              {/* Podium can be implemented here if needed */}
            </motion.div>

            {/* Remaining Rankings */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-4">
                <h2 className="text-white text-xl font-bold text-center">
                  Complete Rankings
                </h2>
              </div>
              
              {students.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {students.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className={`${getRankStyle(student.rank)} w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg`}>
                            {student.rank}
                          </div>
                          
                          {/* Shield or Lock */}
                          {getShieldIcon(student.dailyStreakScore) ? (
                            <img
                              src={getShieldIcon(student.dailyStreakScore)}
                              alt={`Shield for ${student.dailyStreakScore} points`}
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-full">
                              <Lock className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          
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
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-semibold">No Students Found</p>
                  <p className="text-sm">Start answering daily questions to appear on the leaderboard!</p>
                </div>
              )}
            </motion.div>

            {/* Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6"
            >
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
      </div>
    </StudentAuthGuard>
  );
};

export default Leaderboard;