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
import StudentHeader from '../components/StudentHeader';
import StudentAuthGuard from '../components/auth/StudentAuthGuard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('ongoing');

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
      

      
      // Extract student ID from email (AP2503222002@mindleap.edu -> AP2503222002)
      let studentIdFromEmail = '';
      if (user.email && user.email.includes('@mindleap.edu')) {
        studentIdFromEmail = user.email.split('@')[0].toUpperCase();
      }
      

      
      // First try to find by user UID (for backward compatibility)
      const studentDoc = await getDoc(doc(db, 'students', user.uid));
      if (studentDoc.exists()) {

        setStudentData(studentDoc.data());
        return;
      }
      
      // Search by studentId field
      if (studentIdFromEmail) {

        const studentsRef = collection(db, 'students');
        const studentIdQuery = query(studentsRef, where('studentId', '==', studentIdFromEmail));
        const studentIdSnapshot = await getDocs(studentIdQuery);
        
        if (!studentIdSnapshot.empty) {
          const studentData = studentIdSnapshot.docs[0].data();

          setStudentData(studentData);
          return;
        }
      }
      
      // If not found by studentId, try by email
      if (user.email) {

        const studentsRef = collection(db, 'students');
        const emailQuery = query(studentsRef, where('email', '==', user.email));
        const emailSnapshot = await getDocs(emailQuery);
        
        if (!emailSnapshot.empty) {
          const studentData = emailSnapshot.docs[0].data();

          setStudentData(studentData);
          return;
        }
      }
      

      
    } catch (error) {
      console.error('Error fetching student data:', error);
    }
  };

  const fetchAvailableQuizzes = async () => {
    try {
      const quizzesRef = collection(db, 'quizzes');
      const quizzes: Quiz[] = [];
      

      
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
        if (isActive) {
          // Include all quizzes (both active and expired) to show expired ones with different styling
          quizzes.push(quizData);
        }
      });



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
            if (isActive) {
              quizzes.push(quizData);
            }
          });

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
            if (isActive) {
              quizzes.push(quizData);
            }
          });

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
            

            
            // Now fetch quizzes targeted to this school
            const schoolQuizzesQuery = query(
              quizzesRef, 
              where('targetType', '==', 'school'), 
              where('targetId', '==', schoolDocId)
            );
            const schoolQuizzesSnapshot = await getDocs(schoolQuizzesQuery);

            
            schoolQuizzesSnapshot.forEach(doc => {
              const quizData = { id: doc.id, ...doc.data() } as Quiz;
              const isActive = quizData.isActive !== undefined ? quizData.isActive : true;
              if (isActive) {
                quizzes.push(quizData);
              }
            });
          } else {

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
            if (isActive) {
              quizzes.push(quizData);
            }
          });
        }
      }

      // Remove duplicates
      const uniqueQuizzes = quizzes.filter((quiz, index, self) => 
        index === self.findIndex(q => q.id === quiz.id)
      );

      // Sort by creation date (newest first)
      uniqueQuizzes.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

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

  // Utility function to shuffle array (Fisher-Yates shuffle)
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startQuiz = (quiz: Quiz) => {
    // Ensure quiz has questions
    if (!quiz.questions || quiz.questions.length === 0) {
      console.error('Quiz has no questions:', quiz);
      alert('This quiz has no questions available. Please try another quiz.');
      return;
    }
    
    // Create a randomized copy of questions for this student
    const shuffledQuestions = shuffleArray(quiz.questions);
    const randomizedQuiz = {
      ...quiz,
      questions: shuffledQuestions
    };
    
    setCurrentQuiz(randomizedQuiz);
    setTimeLeft(quiz.duration);
    setQuizStarted(true);
    setSelectedAnswer(null);
    setShowResults(false);
    setAnswers([]);
    setScore(0);
    setCurrentQuestionIndex(0); // Reset to first question
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
    
    // Save current answer if one is selected
    let finalAnswers = [...answers];
    if (selectedAnswer !== null && currentQuestionIndex < currentQuiz.questions.length) {
      finalAnswers[currentQuestionIndex] = selectedAnswer;
    }
    
    const completionTime = currentQuiz.duration - timeLeft;
    let correctAnswers = 0;
    
    // Calculate correct answers based on all questions
    const detailedAnswers = currentQuiz.questions.map((question, index) => {
      const userAnswer = finalAnswers[index];
      const isCorrect = userAnswer !== undefined && userAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;
      return {
        questionIndex: index,
        selectedAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect
      };
    });

    const finalScore = Math.round((correctAnswers / currentQuiz.questions.length) * 100);

    const attempt: QuizAttempt = {
      quizId: currentQuiz.id,
      studentId: user.uid,
      studentName: studentData.name || user.email?.split('@')[0] || 'Student',
      studentEmail: user.email || '',
      answers: finalAnswers,
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

  // Categorize quizzes based on their status
  const categorizeQuizzes = () => {
    const ongoing = availableQuizzes.filter(quiz => !hasAttemptedQuiz(quiz.id) && isQuizActive(quiz));
    const completed = availableQuizzes.filter(quiz => hasAttemptedQuiz(quiz.id));
    const expired = availableQuizzes.filter(quiz => !isQuizActive(quiz) && !hasAttemptedQuiz(quiz.id));
    
    return { ongoing, completed, expired };
  };

  const { ongoing, completed, expired } = categorizeQuizzes();

  // Quiz Card Component
  const QuizCard = ({ quiz, index, type }: { quiz: Quiz; index: number; type: 'ongoing' | 'completed' | 'expired' }) => {
    const isCompleted = hasAttemptedQuiz(quiz.id);
    const isExpired = !isQuizActive(quiz);
    const canStart = !isCompleted && !isExpired;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`backdrop-blur-sm rounded-3xl p-6 transition-all relative overflow-hidden ${
          type === 'expired' 
            ? 'bg-red-50/70 border-2 border-red-200' 
            : type === 'completed' 
            ? 'bg-white/70 opacity-90' 
            : 'bg-white/70 hover:shadow-xl cursor-pointer group'
        }`}
        onClick={() => canStart && startQuiz(quiz)}
        whileHover={canStart ? { scale: 1.05, y: -5 } : {}}
      >
        {/* Completion Badge and Duration - Fixed Layout */}
        <div className="flex items-start justify-between mb-4">
          <motion.div
            animate={type === 'ongoing' ? { 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            } : {}}
            transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              type === 'completed' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                : type === 'expired'
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}
          >
            {type === 'completed' ? (
              <Trophy className="w-6 h-6 text-white" />
            ) : type === 'expired' ? (
              <XCircle className="w-6 h-6 text-white" />
            ) : (
              <Brain className="w-6 h-6 text-white" />
            )}
          </motion.div>
          
          <div className="text-right">
            {/* Status Badge */}
            {type === 'completed' && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 mb-2"
              >
                <CheckCircle className="w-3 h-3" />
                Completed
              </motion.div>
            )}
            
            {type === 'expired' && (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 mb-2"
              >
                <XCircle className="w-3 h-3" />
                Expired
              </motion.div>
            )}
            
            {/* Duration */}
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="font-bold text-gray-800">{formatTime(quiz.duration)}</p>
            </div>
          </div>
        </div>

        <h3 className={`text-xl font-bold text-gray-800 mb-2 ${
          type === 'expired' ? 'line-clamp-1' : ''
        }`}>{quiz.title}</h3>
        
        <p className={`text-gray-600 mb-4 overflow-hidden ${
          type === 'expired' ? 'line-clamp-1' : 'line-clamp-2'
        }`} style={{ 
          display: '-webkit-box',
          WebkitLineClamp: type === 'expired' ? 1 : 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {type === 'expired' 
            ? `${quiz.questions.length} Questions • Access Expired` 
            : `${quiz.questions.length} Questions`
          }
        </p>

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
          
          {type === 'expired' ? (
            <motion.div
              className="flex items-center text-red-600 font-semibold"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <XCircle className="w-5 h-5 mr-1" />
              <span className="text-sm">Expired</span>
            </motion.div>
          ) : type === 'completed' ? (
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
        {type === 'expired' ? (
          <motion.button
            disabled
            className="w-full bg-gradient-to-r from-red-400 to-red-500 text-white py-3 rounded-xl font-semibold cursor-not-allowed opacity-80 flex items-center justify-center gap-2 text-sm"
          >
            <XCircle className="w-5 h-5" />
            Quiz Expired
          </motion.button>
        ) : type === 'completed' ? (
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
        {type === 'completed' && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 rounded-3xl pointer-events-none" />
        )}
        
        {/* Overlay for expired quizzes */}
        {type === 'expired' && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/5 rounded-3xl pointer-events-none" />
        )}
      </motion.div>
    );
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
    setCurrentQuestionIndex(0);
  };

  const handleBackToQuizzes = () => {
    resetQuizState();
    // Force a small delay to ensure state is reset before navigation
    setTimeout(() => {
      navigate('/quiz');
    }, 100);
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
        <div className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <img
                    src="/lovable-uploads/7f6ab2a8-9863-4f75-ae5a-f2b087639caa.png"
                    alt="MindLeap - Ignite Young Minds"
                    className="h-12 w-auto cursor-pointer"
                    onClick={() => navigate('/')}
                  />
                </motion.div>

                <motion.button
                  onClick={handleBackToQuizzes}
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                  whileHover={{ x: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Back to Quizzes</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>

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
                    {formatTime(quizResult?.completionTime || 0)}
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
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    
    // If no current question (quiz completed), show results
    if (!currentQuestion) {
      return null; // This will trigger the results view
    }

    const handleQuestionNavigation = (questionIndex: number) => {
      // Save current answer if one is selected
      if (selectedAnswer !== null) {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = selectedAnswer;
        setAnswers(newAnswers);
      }
      
      // Navigate to selected question
      setCurrentQuestionIndex(questionIndex);
      setSelectedAnswer(answers[questionIndex] ?? null);
    };

    const handleNextQuestion = () => {
      if (selectedAnswer !== null) {
        const newAnswers = [...answers];
        newAnswers[currentQuestionIndex] = selectedAnswer;
        setAnswers(newAnswers);
        
        if (currentQuestionIndex < currentQuiz.questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setSelectedAnswer(newAnswers[currentQuestionIndex + 1] ?? null);
        } else {
          // All questions completed, submit quiz
          submitQuiz();
        }
      }
    };

    const handleSkipQuestion = () => {
      if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(answers[currentQuestionIndex + 1] ?? null);
      }
    };

    const getQuestionStatus = (index: number) => {
      if (answers[index] !== undefined) return 'attempted';
      if (index === currentQuestionIndex) return 'current';
      return 'unattempted';
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        {/* Custom Header with Back Button */}
        <div className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <img
                    src="/lovable-uploads/7f6ab2a8-9863-4f75-ae5a-f2b087639caa.png"
                    alt="MindLeap - Ignite Young Minds"
                    className="h-12 w-auto cursor-pointer"
                    onClick={() => navigate('/')}
                  />
                </motion.div>

                <motion.button
                  onClick={handleBackToQuizzes}
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                  whileHover={{ x: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Back to Quizzes</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Timer Bar */}
        <div className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-sm">
          <div className="container mx-auto px-4 py-2">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${
                timeLeft > 60 ? 'from-green-500 to-green-600' :
                timeLeft > 30 ? 'from-yellow-500 to-yellow-600' :
                'from-red-500 to-red-600'
              } text-white font-semibold`}>
                <Clock className="w-5 h-5" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Content with Navigation */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
            {/* Question Navigation Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full lg:w-80 bg-white/70 backdrop-blur-sm rounded-3xl p-4 lg:p-6 h-fit lg:sticky lg:top-8"
            >
              <h3 className="text-sm lg:text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-4 lg:w-5 h-4 lg:h-5 text-blue-500" />
                Question Navigator
              </h3>
              
              <div className="grid grid-cols-8 sm:grid-cols-10 lg:grid-cols-5 gap-2 mb-6">
                {currentQuiz.questions.map((_, index) => {
                  const status = getQuestionStatus(index);
                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleQuestionNavigation(index)}
                      className={`w-8 h-8 lg:w-12 lg:h-12 rounded-lg font-semibold text-xs lg:text-sm transition-all ${
                        status === 'current' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white ring-2 ring-blue-300' :
                        status === 'attempted'
                          ? 'bg-gradient-to-r from-green-400 to-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {index + 1}
                    </motion.button>
                  );
                })}
              </div>

              <div className="space-y-3 text-xs lg:text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
                  <span>Current Question</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gradient-to-r from-green-400 to-green-500 rounded"></div>
                  <span>Attempted ({answers.filter(a => a !== undefined).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 lg:w-4 lg:h-4 bg-gray-100 rounded"></div>
                  <span>Not Attempted ({currentQuiz.questions.length - answers.filter(a => a !== undefined).length})</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 lg:mt-6">
                <div className="flex justify-between text-xs lg:text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round((answers.filter(a => a !== undefined).length / currentQuiz.questions.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(answers.filter(a => a !== undefined).length / currentQuiz.questions.length) * 100}%` 
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Main Question Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1"
            >
              <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-4 lg:p-8">
                <motion.h2
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-lg lg:text-2xl font-bold text-gray-800 mb-6 lg:mb-8"
                >
                  {currentQuestion.question}
                </motion.h2>

                <div className="grid gap-3 lg:gap-4 mb-6 lg:mb-8">
                  {currentQuestion.options.map((option, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleAnswerSelect(index)}
                      className={`p-3 lg:p-4 rounded-xl text-left transition-all border-2 text-sm lg:text-base ${
                        selectedAnswer === index
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 flex items-center justify-center text-sm lg:text-base ${
                          selectedAnswer === index
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-300'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-sm lg:text-lg">{option}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex gap-2 lg:gap-3 w-full sm:w-auto">
                    {currentQuestionIndex > 0 && (
                      <button
                        onClick={() => handleQuestionNavigation(currentQuestionIndex - 1)}
                        className="px-3 lg:px-6 py-2 lg:py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all flex items-center gap-2 text-sm lg:text-base flex-1 sm:flex-none justify-center"
                      >
                        <ArrowLeft className="w-4 lg:w-5 h-4 lg:h-5" />
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Prev</span>
                      </button>
                    )}
                    
                    <button
                      onClick={handleSkipQuestion}
                      disabled={currentQuestionIndex >= currentQuiz.questions.length - 1}
                      className="px-3 lg:px-6 py-2 lg:py-3 bg-yellow-200 text-yellow-700 rounded-xl font-semibold hover:bg-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm lg:text-base flex-1 sm:flex-none"
                    >
                      <span className="hidden sm:inline">Skip Question</span>
                      <span className="sm:hidden">Skip</span>
                    </button>
                  </div>

                  <div className="flex gap-2 lg:gap-3 w-full sm:w-auto">
                    {currentQuestionIndex < currentQuiz.questions.length - 1 ? (
                      <button
                        onClick={handleNextQuestion}
                        disabled={selectedAnswer === null}
                        className={`px-4 lg:px-8 py-2 lg:py-3 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm lg:text-base flex-1 sm:flex-none justify-center ${
                          selectedAnswer !== null
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <span className="hidden sm:inline">Next Question</span>
                        <span className="sm:hidden">Next</span>
                        <ArrowRight className="w-4 lg:w-5 h-4 lg:h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => submitQuiz()}
                        disabled={submitting}
                        className="px-4 lg:px-8 py-2 lg:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 text-sm lg:text-base flex-1 sm:flex-none justify-center"
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
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Submit Quiz
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <StudentHeader />

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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8 bg-white/70 backdrop-blur-sm">
                <TabsTrigger value="ongoing" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Ongoing ({ongoing.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                  Completed ({completed.length})
                </TabsTrigger>
                <TabsTrigger value="expired" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                  Expired ({expired.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ongoing">
                {ongoing.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Play className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Ongoing Quizzes</h3>
                    <p className="text-gray-500">All available quizzes have been completed or expired.</p>
                  </motion.div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ongoing.map((quiz, index) => (
                      <QuizCard key={quiz.id} quiz={quiz} index={index} type="ongoing" />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed">
                {completed.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Trophy className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Completed Quizzes</h3>
                    <p className="text-gray-500">Complete some quizzes to see your results here.</p>
                  </motion.div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completed.map((quiz, index) => (
                      <QuizCard key={quiz.id} quiz={quiz} index={index} type="completed" />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="expired">
                {expired.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Expired Quizzes</h3>
                    <p className="text-gray-500">All quizzes are still available for completion.</p>
                  </motion.div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {expired.map((quiz, index) => (
                      <QuizCard key={quiz.id} quiz={quiz} index={index} type="expired" />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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