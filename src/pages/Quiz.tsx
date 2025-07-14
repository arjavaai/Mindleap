import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Trophy, 
  Target, 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  Play,
  Users,
  Award,
  Timer,
  Brain,
  Zap,
  BookOpen,
  Calendar,
  Globe,
  MapPin,
  School,
  BarChart3,
  ArrowRight,
  User,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  orderBy, 
  limit,
  addDoc
} from 'firebase/firestore';

interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  duration: number; // in seconds
  targetType: 'all' | 'state' | 'district' | 'school' | 'students';
  targetId?: string;
  targetStateId?: string;
  targetDistrictId?: string;
  targetStudentIds?: string[];
  expiryType: 'never' | 'hours' | 'days';
  expiryValue?: number;
  createdAt: any;
  createdBy: string;
  title: string;
  questions: Question[];
  isActive: boolean;
}

interface QuizResult {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completionTime: number; // in seconds
  submittedAt: any;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizAttempt {
  quizId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  answers: number[];
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completionTime: number;
  submittedAt: any;
}

const Quiz = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  const [quizAttempts, setQuizAttempts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Fetch quizzes immediately when component mounts
    fetchAvailableQuizzes();
    // Load quiz attempts from localStorage
    const attempts = localStorage.getItem('quizAttempts');
    if (attempts) {
      setQuizAttempts(JSON.parse(attempts));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  // Refetch quizzes once we have student information to include student-specific quizzes
  useEffect(() => {
    if (user && studentData) {
      setLoading(true);
      fetchAvailableQuizzes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentData]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (quizStarted && timeLeft > 0 && !showResults) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && quizStarted && !showResults) {
      handleAutoSubmit();
    }
    return () => clearInterval(interval);
  }, [timeLeft, quizStarted, showResults]);

  const fetchStudentData = async () => {
    try {
      if (!user) return;
      
      console.log('Fetching student data for user:', user.uid, user.email);
      
      // Extract student ID from email (AP2503222002@mindleap.edu -> AP2503222002)
      let studentIdFromEmail = '';
      if (user.email && user.email.includes('@mindleap.edu')) {
        studentIdFromEmail = user.email.split('@')[0].toUpperCase();
      }
      
      console.log('Extracted student ID from email:', studentIdFromEmail);
      
      // First try to find by user UID (for backward compatibility)
      const studentDoc = await getDoc(doc(db, 'students', user.uid));
      if (studentDoc.exists()) {
        console.log('Found student data by UID:', studentDoc.data());
        setStudentData(studentDoc.data());
        return;
      }
      
      // Search by studentId field
      if (studentIdFromEmail) {
        console.log('Searching for student by studentId:', studentIdFromEmail);
        const studentsRef = collection(db, 'students');
        const studentIdQuery = query(studentsRef, where('studentId', '==', studentIdFromEmail));
        const studentIdSnapshot = await getDocs(studentIdQuery);
        
        if (!studentIdSnapshot.empty) {
          const studentData = studentIdSnapshot.docs[0].data();
          console.log('Found student data by studentId:', studentData);
          setStudentData(studentData);
          return;
        }
      }
      
      // If not found by studentId, try by email
      if (user.email) {
        console.log('Searching for student by email:', user.email);
        const studentsRef = collection(db, 'students');
        const emailQuery = query(studentsRef, where('email', '==', user.email));
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
          const studentData = emailSnapshot.docs[0].data();
          console.log('Found student data by email:', studentData);
          setStudentData(studentData);
          return;
        }
      }
      
      console.log('Student data not found for:', user.email);
      
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const fetchAvailableQuizzes = async () => {
    try {
      const quizzesRef = collection(db, 'quizzes');
      const quizzes: Quiz[] = [];
      
      console.log('Fetching quizzes for user:', user?.uid);
      console.log('Student data:', studentData);
      console.log('Student schoolCode:', studentData?.schoolCode);
      console.log('Student districtCode:', studentData?.districtCode);
      console.log('Student stateCode:', studentData?.stateCode);
      
      // Always fetch all quizzes first
      const allQuizzesQuery = query(
        quizzesRef, 
        where('targetType', '==', 'all')
      );
      const allQuizzesSnapshot = await getDocs(allQuizzesQuery);
      allQuizzesSnapshot.forEach(doc => {
        const quizData = { id: doc.id, ...doc.data() } as Quiz;
        // Check if quiz is active (if isActive field exists, it should be true, otherwise default to true)
        const isActive = quizData.isActive !== undefined ? quizData.isActive : true;
        if (isActive && isQuizActive(quizData)) {
          quizzes.push(quizData);
        }
      });

      console.log('Found "all" quizzes:', quizzes.length);

      // If user is logged in and has student data, fetch targeted quizzes
      if (user && studentData) {
        // Fetch state-specific quizzes
        if (studentData.stateCode) {
          const stateQuizzesQuery = query(
            quizzesRef, 
            where('targetType', '==', 'state'), 
            where('targetId', '==', studentData.stateCode)
          );
          const stateQuizzesSnapshot = await getDocs(stateQuizzesQuery);
          stateQuizzesSnapshot.forEach(doc => {
            const quizData = { id: doc.id, ...doc.data() } as Quiz;
            const isActive = quizData.isActive !== undefined ? quizData.isActive : true;
            if (isActive && isQuizActive(quizData)) {
              quizzes.push(quizData);
            }
          });
          console.log('Found state-specific quizzes:', stateQuizzesSnapshot.size);
        }

        // Fetch district-specific quizzes
        if (studentData.districtCode) {
          const districtQuizzesQuery = query(
            quizzesRef, 
            where('targetType', '==', 'district'), 
            where('targetId', '==', studentData.districtCode)
          );
          const districtQuizzesSnapshot = await getDocs(districtQuizzesQuery);
          districtQuizzesSnapshot.forEach(doc => {
            const quizData = { id: doc.id, ...doc.data() } as Quiz;
            const isActive = quizData.isActive !== undefined ? quizData.isActive : true;
            if (isActive && isQuizActive(quizData)) {
              quizzes.push(quizData);
            }
          });
          console.log('Found district-specific quizzes:', districtQuizzesSnapshot.size);
        }

        // Fetch school-specific quizzes
        if (studentData.schoolCode) {
          // First, find the school document ID based on schoolCode
          const schoolsRef = collection(db, 'schools');
          const schoolQuery = query(schoolsRef, where('schoolCode', '==', studentData.schoolCode));
          const schoolSnapshot = await getDocs(schoolQuery);
          
          if (!schoolSnapshot.empty) {
            const schoolDoc = schoolSnapshot.docs[0];
            const schoolDocId = schoolDoc.id;
            
            console.log(`Found school document ID ${schoolDocId} for schoolCode ${studentData.schoolCode}`);
            
            // Now fetch quizzes targeted to this school
            const schoolQuizzesQuery = query(
              quizzesRef, 
              where('targetType', '==', 'school'), 
              where('targetId', '==', schoolDocId)
            );
            const schoolQuizzesSnapshot = await getDocs(schoolQuizzesQuery);
            console.log(`Found school-specific quizzes for school ${schoolDocId}:`, schoolQuizzesSnapshot.size);
            
            schoolQuizzesSnapshot.forEach(doc => {
              const quizData = { id: doc.id, ...doc.data() } as Quiz;
              const isActive = quizData.isActive !== undefined ? quizData.isActive : true;
              if (isActive && isQuizActive(quizData)) {
                quizzes.push(quizData);
              }
            });
          } else {
            console.log(`No school found with schoolCode: ${studentData.schoolCode}`);
          }
        }

        // Fetch student-specific quizzes
        if (studentData.studentId) {
          const studentQuizzesQuery = query(
            quizzesRef,
            where('targetType', '==', 'students'),
            where('targetStudentIds', 'array-contains', studentData.studentId)
          );
          const studentQuizzesSnapshot = await getDocs(studentQuizzesQuery);
          console.log('Found student-specific quizzes:', studentQuizzesSnapshot.size);

          studentQuizzesSnapshot.forEach((doc) => {
            const quizData = { id: doc.id, ...doc.data() } as Quiz;
            const isActive = quizData.isActive !== undefined ? quizData.isActive : true;
            if (isActive && isQuizActive(quizData)) {
              quizzes.push(quizData);
            }
          });
        }
      }

      // Remove duplicates
      const uniqueQuizzes = quizzes.filter((quiz, index, self) => 
        index === self.findIndex(q => q.id === quiz.id)
      );

      console.log('Total unique quizzes found:', uniqueQuizzes.length);
      setAvailableQuizzes(uniqueQuizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const isQuizActive = (quiz: Quiz): boolean => {
    if (quiz.expiryType === 'never') return true;
    
    if (!quiz.createdAt || !quiz.expiryValue) return true;
    
    try {
      const createdDate = quiz.createdAt.toDate ? quiz.createdAt.toDate() : new Date(quiz.createdAt);
      const expiryDate = new Date(createdDate);
      
      if (quiz.expiryType === 'hours') {
        expiryDate.setHours(expiryDate.getHours() + quiz.expiryValue);
      } else if (quiz.expiryType === 'days') {
        expiryDate.setDate(expiryDate.getDate() + quiz.expiryValue);
      }
      
      return new Date() <= expiryDate;
    } catch (error) {
      console.error('Error checking quiz expiry:', error);
      return true; // Default to active if there's an error
    }
  };

  const startQuiz = (quiz: Quiz) => {
    // Ensure quiz has questions
    if (!quiz.questions || quiz.questions.length === 0) {
      console.error('Quiz has no questions:', quiz);
      alert('This quiz has no questions available. Please try another quiz.');
      return;
    }
    
    setCurrentQuiz(quiz);
    setTimeLeft(quiz.duration);
    setQuizStarted(true);
    setSelectedAnswer(null);
    setShowResults(false);
    setAnswers([]);
    setScore(0);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!showResults) {
      setSelectedAnswer(answerIndex);
    }
  };

  const handleAutoSubmit = () => {
    if (currentQuiz) {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    if (!currentQuiz || !user || !studentData) return;

    setSubmitting(true);
    const completionTime = currentQuiz.duration - timeLeft;
    let correctAnswers = 0;
    const detailedAnswers = answers.map((answer, index) => {
      const isCorrect = answer === currentQuiz.questions[index].correctAnswer;
      if (isCorrect) correctAnswers++;
      return {
        questionIndex: index,
        selectedAnswer: answer,
        correctAnswer: currentQuiz.questions[index].correctAnswer,
        isCorrect
      };
    });

    const finalScore = Math.round((correctAnswers / currentQuiz.questions.length) * 100);

    const attempt: QuizAttempt = {
      quizId: currentQuiz.id,
      studentId: user.uid,
      studentName: studentData.name || user.email?.split('@')[0] || 'Student',
      studentEmail: user.email || '',
      answers,
      score: finalScore,
      totalQuestions: currentQuiz.questions.length,
      correctAnswers,
      completionTime,
      submittedAt: new Date()
    };

    try {
      // Save to Firebase
      await setDoc(doc(db, 'quizAttempts', `${currentQuiz.id}_${user.uid}`), attempt);
      
      // Mark quiz as attempted locally
      const newAttempts = { ...quizAttempts, [currentQuiz.id]: true };
      setQuizAttempts(newAttempts);
      localStorage.setItem('quizAttempts', JSON.stringify(newAttempts));

      // Set results data
      setScore(finalScore);
      setQuizResult({
        id: `${currentQuiz.id}_${user.uid}`,
        quizId: currentQuiz.id,
        studentId: user.uid,
        studentName: studentData.name || 'Student',
        score: finalScore,
        correctAnswers,
        totalQuestions: currentQuiz.questions.length,
        completionTime,
        submittedAt: new Date()
      });

      // Fetch leaderboard
      await fetchLeaderboard(currentQuiz.id);
      
      // Show results immediately
      setQuizStarted(false);
      setShowResults(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchLeaderboard = async (quizId: string) => {
    try {
      const attemptsRef = collection(db, 'quizAttempts');
      const leaderboardQuery = query(
        attemptsRef,
        where('quizId', '==', quizId),
        orderBy('score', 'desc'),
        orderBy('completionTime', 'asc'),
        limit(10)
      );
      
      const snapshot = await getDocs(leaderboardQuery);
      const results: any[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        let studentName = data.studentName || 'Unknown Student';
        
        // If we don't have a stored name, try to fetch it
        if (!data.studentName || data.studentName === 'Unknown Student') {
          try {
            // Try to get student name by UID (document ID)
            const studentDoc = await getDoc(doc(db, 'students', data.studentId));
            if (studentDoc.exists()) {
              studentName = studentDoc.data()?.name || 'Unknown Student';
            } else {
              // If not found by UID, search by studentId field
              const studentsRef = collection(db, 'students');
              const studentQuery = query(studentsRef, where('uid', '==', data.studentId));
              const studentSnapshot = await getDocs(studentQuery);
              
              if (!studentSnapshot.empty) {
                studentName = studentSnapshot.docs[0].data()?.name || 'Unknown Student';
              } else {
                // Last resort: try to get name from email if available
                if (data.studentEmail) {
                  const emailQuery = query(studentsRef, where('email', '==', data.studentEmail));
                  const emailSnapshot = await getDocs(emailQuery);
                  if (!emailSnapshot.empty) {
                    studentName = emailSnapshot.docs[0].data()?.name || 'Unknown Student';
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error fetching student name for', data.studentId, error);
            // Use studentId as fallback name
            studentName = data.studentId || 'Unknown Student';
          }
        }
        
        results.push({
          ...data,
          studentName,
          id: docSnap.id
        });
      }
      
      setLeaderboard(results);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const viewQuizResults = async (quiz: Quiz) => {
    try {
      // Fetch the user's attempt for this quiz
      const attemptDoc = await getDoc(doc(db, 'quizAttempts', `${quiz.id}_${user?.uid}`));
      if (attemptDoc.exists()) {
        const attemptData = attemptDoc.data();
        
        // Set up the quiz and results data
        setCurrentQuiz(quiz);
        setAnswers(attemptData.answers || []);
        setScore(attemptData.score || 0);
        setQuizResult({
          id: attemptDoc.id,
          quizId: quiz.id,
          studentId: user?.uid || '',
          studentName: studentData?.name || 'Student',
          score: attemptData.score || 0,
          correctAnswers: attemptData.correctAnswers || 0,
          totalQuestions: attemptData.totalQuestions || quiz.questions.length,
          completionTime: attemptData.completionTime || 0,
          submittedAt: attemptData.submittedAt
        });
        
        // Fetch leaderboard for this quiz
        await fetchLeaderboard(quiz.id);
        
        // Show results
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error fetching quiz results:', error);
    }
  };

  const hasAttemptedQuiz = (quizId: string) => {
    return quizAttempts[quizId] || false;
  };

  const resetQuizState = () => {
    setCurrentQuiz(null);
    setQuizStarted(false);
    setShowResults(false);
    setShowDetailedResults(false);
    setQuizResult(null);
    setAnswers([]);
    setScore(0);
    setSelectedAnswer(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft > 30) return 'text-green-600';
    if (timeLeft > 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'all': return <Globe className="w-4 h-4" />;
      case 'state': return <MapPin className="w-4 h-4" />;
      case 'district': return <Target className="w-4 h-4" />;
      case 'school': return <School className="w-4 h-4" />;
      case 'students': return <Users className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const createSampleQuiz = async () => {
    try {
      const sampleQuiz = {
        title: "Sample Math Quiz",
        questions: [
          {
            id: "q1",
            question: "What is 2 + 2?",
            options: ["3", "4", "5", "6"],
            correctAnswer: 1
          },
          {
            id: "q2", 
            question: "What is 10 - 3?",
            options: ["6", "7", "8", "9"],
            correctAnswer: 1
          },
          {
            id: "q3",
            question: "What is 5 × 3?",
            options: ["12", "15", "18", "20"],
            correctAnswer: 1
          }
        ],
        duration: 300, // 5 minutes
        targetType: 'all',
        expiryType: 'never',
        isActive: true,
        createdBy: 'system',
        createdAt: new Date()
      };

      await addDoc(collection(db, 'quizzes'), sampleQuiz);
      console.log('Sample quiz created successfully');
      fetchAvailableQuizzes(); // Refresh the quiz list
    } catch (error) {
      console.error('Error creating sample quiz:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-lg font-semibold text-gray-700">Loading quizzes...</p>
        </motion.div>
      </div>
    );
  }

  if (showResults && currentQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src="/lovable-uploads/7f6ab2a8-9863-4f75-ae5a-f2b087639caa.png" 
                  alt="MindLeap Logo" 
                  className="h-12 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => navigate('/')}
                />
                <motion.button
                  onClick={() => navigate('/quiz')}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                  whileHover={{ x: -5 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Back to Quizzes</span>
                </motion.button>
              </div>
              <h1 className="text-xl font-bold text-gray-800">{currentQuiz.title} - Results</h1>
            </div>
          </div>
        </header>

        {/* Results */}
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-6xl mx-auto"
          >
            {/* Score Card */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 mb-8 text-center"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  score >= 70 
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                    : score >= 50
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                    : 'bg-gradient-to-r from-red-400 to-pink-500'
                }`}
              >
                {score >= 70 ? (
                  <Trophy className="w-12 h-12 text-white" />
                ) : score >= 50 ? (
                  <Target className="w-12 h-12 text-white" />
                ) : (
                  <Brain className="w-12 h-12 text-white" />
                )}
              </motion.div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                {score >= 70 ? 'Excellent!' : score >= 50 ? 'Good Job!' : 'Keep Learning!'}
              </h2>
              
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <motion.p 
                    className="text-4xl font-bold text-blue-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    {score}%
                  </motion.p>
                  <p className="text-gray-600">Final Score</p>
                </div>
                <div className="text-center">
                  <motion.p 
                    className="text-4xl font-bold text-green-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring" }}
                  >
                    {answers.filter((answer, index) => answer === currentQuiz.questions[index].correctAnswer).length}
                  </motion.p>
                  <p className="text-gray-600">Correct Answers</p>
                </div>
                <div className="text-center">
                  <motion.p 
                    className="text-4xl font-bold text-purple-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring" }}
                  >
                    {formatTime(currentQuiz.duration - timeLeft)}
                  </motion.p>
                  <p className="text-gray-600">Time Taken</p>
                </div>
                <div className="text-center">
                  <motion.p 
                    className="text-4xl font-bold text-orange-600"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                  >
                    {leaderboard.findIndex(r => r.studentId === user?.uid) + 1 || '-'}
                  </motion.p>
                  <p className="text-gray-600">Your Rank</p>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center gap-4 mb-8"
            >
              <motion.button
                onClick={() => setShowDetailedResults(!showDetailedResults)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Eye className="w-5 h-5" />
                {showDetailedResults ? 'Hide' : 'View'} Detailed Results
              </motion.button>
              <motion.button
                onClick={() => navigate('/quiz')}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowRight className="w-5 h-5" />
                More Quizzes
              </motion.button>
            </motion.div>

            {/* Detailed Results */}
            <AnimatePresence>
              {showDetailedResults && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 mb-8"
                >
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-blue-500" />
                    Question by Question Review
                  </h3>
                  
                  <div className="space-y-6">
                    {currentQuiz.questions.map((question, index) => {
                      const userAnswer = answers[index];
                      const correctAnswer = question.correctAnswer;
                      const isCorrect = userAnswer === correctAnswer;
                      
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-6 rounded-xl border-2 ${
                            isCorrect 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-red-200 bg-red-50'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                              isCorrect ? 'bg-green-500' : 'bg-red-500'
                            }`}>
                              {isCorrect ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <XCircle className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800 mb-3">
                                Q{index + 1}: {question.question}
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {question.options.map((option, optIndex) => (
                                  <div
                                    key={optIndex}
                                    className={`p-3 rounded-lg border ${
                                      optIndex === correctAnswer
                                        ? 'border-green-400 bg-green-100 text-green-800'
                                        : optIndex === userAnswer && !isCorrect
                                        ? 'border-red-400 bg-red-100 text-red-800'
                                        : 'border-gray-200 bg-gray-50 text-gray-600'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {optIndex === correctAnswer && (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                      )}
                                      {optIndex === userAnswer && !isCorrect && (
                                        <XCircle className="w-4 h-4 text-red-600" />
                                      )}
                                      <span className="font-medium">
                                        {String.fromCharCode(65 + optIndex)}:
                                      </span>
                                      <span>{option}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {!isCorrect && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-sm text-blue-800">
                                    <strong>Correct Answer:</strong> {String.fromCharCode(65 + correctAnswer)} - {question.options[correctAnswer]}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Leaderboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/70 backdrop-blur-sm rounded-3xl p-8"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-500" />
                Leaderboard
                {currentQuiz.targetType === 'school' && (
                  <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full">
                    School Only
                  </span>
                )}
              </h3>
              
              {leaderboard.length > 0 ? (
                <div className="space-y-4">
                  {leaderboard.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`flex items-center justify-between p-4 rounded-xl ${
                        result.studentId === user?.uid 
                          ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-300' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                            index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                            index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-800' : 
                            'bg-gradient-to-r from-blue-500 to-blue-700'
                          }`}
                          whileHover={{ scale: 1.1 }}
                        >
                          {index < 3 ? (
                            <Trophy className="w-6 h-6" />
                          ) : (
                            index + 1
                          )}
                        </motion.div>
                        <div>
                          <p className="font-semibold text-gray-800">{result.studentName}</p>
                          <p className="text-sm text-gray-600">
                            {result.correctAnswers}/{result.totalQuestions} correct
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-800">{result.score}%</p>
                        <p className="text-sm text-gray-600">{formatTime(result.completionTime)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No other attempts yet. You're the first!</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (currentQuiz && quizStarted && !showResults) {
    const currentQuestion = currentQuiz.questions[answers.length];
    
    // If no current question (quiz completed), show results
    if (!currentQuestion) {
      return null; // This will trigger the results view
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img 
                  src="/lovable-uploads/7f6ab2a8-9863-4f75-ae5a-f2b087639caa.png" 
                  alt="MindLeap Logo" 
                  className="h-12 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => navigate('/')}
                />
                <motion.button
                  onClick={() => {
                    resetQuizState();
                    navigate('/quiz');
                  }}
                  className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                  whileHover={{ x: -5 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Back to Quizzes</span>
                </motion.button>
              </div>
              
              <div className="flex items-center gap-6">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getTimeColor()} text-white font-semibold`}>
                  <Clock className="w-5 h-5" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Quiz Content */}
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-2xl font-bold text-gray-800 mb-8"
              >
                {currentQuestion.question}
              </motion.h2>

              <div className="grid gap-4">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleAnswerSelect(index)}
                    className={`p-4 rounded-xl text-left transition-all border-2 ${
                      selectedAnswer === index
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswer === index
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-lg">{option}</span>
                    </div>
                  </motion.button>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center mt-8"
              >
                <button
                  onClick={() => {
                    if (selectedAnswer !== null) {
                      const newAnswers = [...answers, selectedAnswer];
                      setAnswers(newAnswers);
                      
                      if (newAnswers.length === currentQuiz.questions.length) {
                        // All questions answered, submit quiz
                        submitQuiz();
                      } else {
                        // Move to next question
                        setSelectedAnswer(null);
                      }
                    }
                  }}
                  disabled={selectedAnswer === null || submitting}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                    selectedAnswer !== null && !submitting
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Submitting...
                    </>
                  ) : answers.length === currentQuiz.questions.length - 1 ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit Quiz
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5" />
                      Next Question ({answers.length + 1}/{currentQuiz.questions.length})
                    </>
                  )}
                </button>
              </motion.div>

              {/* Progress Bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6"
              >
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Question {answers.length + 1} of {currentQuiz.questions.length}</span>
                  <span>{Math.round(((answers.length + 1) / currentQuiz.questions.length) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((answers.length + 1) / currentQuiz.questions.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/lovable-uploads/7f6ab2a8-9863-4f75-ae5a-f2b087639caa.png" 
                alt="MindLeap Logo" 
                className="h-12 cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate('/')}
              />
              <motion.button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors"
                whileHover={{ x: -5 }}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Dashboard</span>
              </motion.button>
            </div>
            
            {/* Profile Icon removed as per request */}
          </div>
        </div>
      </header>

      {/* Quiz Selection */}
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-gray-800 mb-4"
            >
              Quiz Challenge
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600"
            >
              Test your knowledge and compete with others!
            </motion.p>
          </div>

          {availableQuizzes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Quizzes Available</h3>
              <p className="text-gray-500 mb-4">Check back later for new quiz challenges!</p>
              
              {/* Debug Information */}
              {user && (
                <div className="bg-gray-100 rounded-lg p-4 mt-6 text-left max-w-md mx-auto">
                  <h4 className="font-semibold text-gray-700 mb-2">Debug Information:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>User ID:</strong> {user.uid}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Student Data Found:</strong> {studentData ? 'Yes' : 'No'}</p>
                    {studentData && (
                      <>
                        <p><strong>Student ID:</strong> {studentData.studentId || 'Not set'}</p>
                        <p><strong>School Code:</strong> {studentData.schoolCode || 'Not set'}</p>
                        <p><strong>District Code:</strong> {studentData.districtCode || 'Not set'}</p>
                        <p><strong>State Code:</strong> {studentData.stateCode || 'Not set'}</p>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This debug info will help identify why no quizzes are showing. Check console for more details.
                  </p>
                  <button
                    onClick={createSampleQuiz}
                    className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Create Sample Quiz (Test)
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableQuizzes.map((quiz, index) => {
                const isCompleted = hasAttemptedQuiz(quiz.id);
                return (
                  <motion.div
                    key={quiz.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white/70 backdrop-blur-sm rounded-3xl p-6 transition-all relative overflow-hidden ${
                      isCompleted 
                        ? 'opacity-90' 
                        : 'hover:shadow-xl cursor-pointer group'
                    }`}
                    onClick={() => !isCompleted && startQuiz(quiz)}
                    whileHover={!isCompleted ? { scale: 1.05, y: -5 } : {}}
                  >
                    {/* Completion Badge */}
                    {isCompleted && (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </motion.div>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <motion.div
                        animate={!isCompleted ? { 
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.1, 1]
                        } : {}}
                        transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isCompleted 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}
                      >
                        {isCompleted ? (
                          <Trophy className="w-6 h-6 text-white" />
                        ) : (
                          <Brain className="w-6 h-6 text-white" />
                        )}
                      </motion.div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Duration</p>
                        <p className="font-bold text-gray-800">{formatTime(quiz.duration)}</p>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-2">{quiz.title}</h3>
                    <p className="text-gray-600 mb-4 overflow-hidden" style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>{quiz.questions.length} Questions</p>

                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        quiz.targetType === 'all' ? 'bg-green-100 text-green-700' :
                        quiz.targetType === 'state' ? 'bg-blue-100 text-blue-700' :
                        quiz.targetType === 'district' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {getTargetIcon(quiz.targetType)}
                        <span className="ml-1">
                          {quiz.targetType.charAt(0).toUpperCase() + quiz.targetType.slice(1)}
                        </span>
                      </span>
                      
                      {isCompleted ? (
                        <motion.div
                          className="flex items-center text-green-600 font-semibold"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <CheckCircle className="w-5 h-5 mr-1" />
                          <span className="text-sm">Done</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          className="flex items-center text-blue-600 font-semibold group-hover:text-blue-700"
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Play className="w-5 h-5 mr-1" />
                          <span className="text-sm">Start</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {isCompleted ? (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewQuizResults(quiz);
                        }}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Eye className="w-5 h-5" />
                        View Results
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={() => startQuiz(quiz)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Play className="w-5 h-5" />
                        Start Quiz
                      </motion.button>
                    )}

                    {/* Overlay for completed quizzes */}
                    {isCompleted && (
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 rounded-3xl pointer-events-none" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Student Profile</h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {studentData ? (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">{studentData.name}</h4>
                    <p className="text-gray-600">{studentData.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Student ID</p>
                      <p className="font-semibold text-gray-900">{studentData.studentId}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">School Code</p>
                      <p className="font-semibold text-gray-900">{studentData.schoolCode || 'Not assigned'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">District</p>
                      <p className="font-semibold text-gray-900">{studentData.districtCode || 'Not assigned'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">State</p>
                      <p className="font-semibold text-gray-900">{studentData.stateCode || 'Not assigned'}</p>
                    </div>
                  </div>

                  {studentData.createdAt && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-600">Member Since</p>
                      <p className="font-semibold text-blue-900">
                        {new Date(studentData.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Student profile not found</p>
                  <p className="text-sm text-gray-500">Please contact support if this issue persists</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Quiz; 