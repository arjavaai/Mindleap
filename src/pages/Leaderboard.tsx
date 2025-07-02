import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Medal, Crown, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const [students, setStudents] = useState<LeaderboardStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserSchool] = useState('school-123'); // This should come from auth context

  useEffect(() => {
    // TODO: Replace with actual API call to get leaderboard data
    // This should filter by currentUserSchool
    const mockData: LeaderboardStudent[] = [
      {
        id: '1',
        name: 'Arjun Patel',
        studentId: 'STU001',
        userId: 'USER001',
        dailyStreakScore: 450,
        rank: 1,
        schoolId: 'school-123',
        profileSubtitle: 'Math Whiz'
      },
      {
        id: '2',
        name: 'Priya Sharma',
        studentId: 'STU002',
        userId: 'USER002',
        dailyStreakScore: 425,
        rank: 2,
        schoolId: 'school-123',
        profileSubtitle: 'Science Expert'
      },
      {
        id: '3',
        name: 'Rohan Kumar',
        studentId: 'STU003',
        userId: 'USER003',
        dailyStreakScore: 400,
        rank: 3,
        schoolId: 'school-123',
        profileSubtitle: 'All Rounder'
      },
      {
        id: '4',
        name: 'Anita Singh',
        studentId: 'STU004',
        userId: 'USER004',
        dailyStreakScore: 375,
        rank: 4,
        schoolId: 'school-123',
        profileSubtitle: 'Quiz Master'
      },
      {
        id: '5',
        name: 'Vikram Joshi',
        studentId: 'STU005',
        userId: 'USER005',
        dailyStreakScore: 350,
        rank: 5,
        schoolId: 'school-123',
        profileSubtitle: 'Problem Solver'
      }
    ];

    // Simulate API call
    setTimeout(() => {
      setStudents(mockData);
      setLoading(false);
    }, 1000);
  }, [currentUserSchool]);

  const getShieldIcon = (rank: number) => {
    if (rank === 1) return '/sheild_icons/gold_sheild.png';
    if (rank === 2) return '/sheild_icons/silver_sheild.png';
    if (rank === 3) return '/sheild_icons/broze_sheild.png';
    return '/sheild_icons/broze_sheild.png';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-6 h-6 text-amber-600" />;
    return <Star className="w-6 h-6 text-blue-500" />;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
    return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
  };

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {students.slice(0, 3).map((student, index) => {
                const podiumOrder = [1, 0, 2]; // Second, First, Third
                const actualIndex = podiumOrder[index];
                const actualStudent = students[actualIndex];
                
                return (
                  <motion.div
                    key={actualStudent.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                    className={`relative ${actualStudent.rank === 1 ? 'md:order-2 transform md:-translate-y-4' : 
                      actualStudent.rank === 2 ? 'md:order-1' : 'md:order-3'}`}
                  >
                    <div className={`${getRankStyle(actualStudent.rank)} rounded-2xl p-6 text-center shadow-xl`}>
                      {/* Rank Badge */}
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          <img
                            src={getShieldIcon(actualStudent.rank)}
                            alt={`Rank ${actualStudent.rank} Shield`}
                            className="w-16 h-16 object-contain"
                          />
                          <div className="absolute -top-2 -right-2">
                            {getRankIcon(actualStudent.rank)}
                          </div>
                        </div>
                      </div>

                      {/* Student Info */}
                      <h3 className="text-xl font-bold mb-1">{actualStudent.name}</h3>
                      <p className="text-sm opacity-90 mb-2">{actualStudent.profileSubtitle}</p>
                      <div className="space-y-1 text-sm">
                        <p>ID: {actualStudent.studentId}</p>
                        <p>User: {actualStudent.userId}</p>
                        <p className="font-bold text-lg">{actualStudent.dailyStreakScore} points</p>
                      </div>
                      
                      {/* Rank Number */}
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg shadow-lg">
                          {actualStudent.rank}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Remaining Rankings */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-4">
              <h2 className="text-white text-xl font-bold text-center">Complete Rankings</h2>
            </div>
            
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
                      
                      {/* Shield */}
                      <img
                        src={getShieldIcon(student.rank)}
                        alt={`Rank ${student.rank} Shield`}
                        className="w-10 h-10 object-contain"
                      />
                      
                      {/* Student Details */}
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">{student.name}</h3>
                        <p className="text-gray-600 text-sm">{student.profileSubtitle}</p>
                        <div className="flex gap-4 text-xs text-gray-500 mt-1">
                          <span>ID: {student.studentId}</span>
                          <span>User: {student.userId}</span>
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
                Only students from your school are shown in this ranking.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;