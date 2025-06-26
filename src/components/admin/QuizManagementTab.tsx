import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  Target, 
  Users, 
  School, 
  MapPin,
  Globe,
  Trophy,
  BarChart3,
  Timer,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Download,
  FileText,
  Calendar,
  Infinity
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  duration: number;
  targetType: 'all' | 'state' | 'district' | 'school';
  targetId?: string;
  targetStateId?: string;
  targetDistrictId?: string;
  expiryType: 'never' | 'hours' | 'days';
  expiryValue?: number;
  createdAt: any;
  createdBy: string;
  isActive: boolean;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizResult {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completionTime: number;
  submittedAt: any;
}

interface State {
  id: string;
  stateName: string;
  stateCode: string;
  districts: District[];
}

interface District {
  districtName: string;
  districtCode: string;
}

interface School {
  id: string;
  name: string;
  schoolCode: string;
  districtCode: string;
  districtName: string;
  state: string;
}

interface QuizStats {
  studentId: string;
  studentName: string;
  schoolName: string;
  districtName: string;
  districtCode: string;
  state: string;
  score: number;
  percentage: number;
  rank: number;
  correctAnswers: number;
  totalQuestions: number;
  completionTime: number;
  submittedAt: any;
}

const QuizManagementTab = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [selectedQuizForStats, setSelectedQuizForStats] = useState<Quiz | null>(null);
  const [statsData, setStatsData] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  // Wizard form states
  const [quizData, setQuizData] = useState({
    title: '',
    duration: 300,
    targetType: 'all' as 'all' | 'state' | 'district' | 'school',
    targetStateId: '',
    targetDistrictId: '',
    targetSchoolId: '',
    expiryType: 'never' as 'never' | 'hours' | 'days',
    expiryValue: 24
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  });

  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);

  useEffect(() => {
    fetchQuizzes();
    fetchStates();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const quizzesSnapshot = await getDocs(collection(db, 'quizzes'));
      const quizzesData: Quiz[] = [];
      quizzesSnapshot.forEach(doc => {
        quizzesData.push({ id: doc.id, ...doc.data() } as Quiz);
      });
      setQuizzes(quizzesData);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const statesSnapshot = await getDocs(collection(db, 'states'));
      const statesData: State[] = [];
      
      statesSnapshot.forEach(stateDoc => {
        const data = stateDoc.data();
        statesData.push({
          id: stateDoc.id,
          stateName: data.stateName || '',
          stateCode: data.stateCode || '',
          districts: data.districts || []
        });
      });
      
      // Fetch schools separately
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      const schoolsData: School[] = [];
      schoolsSnapshot.forEach(schoolDoc => {
        schoolsData.push({ id: schoolDoc.id, ...schoolDoc.data() } as School);
      });
      
      // Organize schools by district
      statesData.forEach(state => {
        state.districts.forEach(district => {
          (district as any).schools = schoolsData.filter(school => 
            school.districtCode === district.districtCode && 
            school.state === state.stateName
          );
        });
      });
      
      setStates(statesData);
      console.log('Fetched states:', statesData); // Debug log
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setQuizData({
      title: '',
      duration: 300,
      targetType: 'all',
      targetStateId: '',
      targetDistrictId: '',
      targetSchoolId: '',
      expiryType: 'never',
      expiryValue: 24
    });
    setQuestions([]);
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    });
    setEditingQuiz(null);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    
    // Populate form with existing quiz data
    setQuizData({
      title: quiz.title,
      duration: quiz.duration,
      targetType: quiz.targetType,
      targetStateId: quiz.targetStateId || '',
      targetDistrictId: quiz.targetDistrictId || '',
      targetSchoolId: quiz.targetId || '',
      expiryType: quiz.expiryType,
      expiryValue: quiz.expiryValue || 24
    });
    
    setQuestions(quiz.questions || []);
    setCurrentStep(1);
    setShowCreateWizard(true);
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.question || currentQuestion.options.some(opt => !opt.trim())) {
      alert('Please fill in all question fields');
      return;
    }

    const newQuestion: Question = {
      id: Date.now().toString(),
      ...currentQuestion
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    });
  };

  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleCreateQuiz = async () => {
    if (!quizData.title || questions.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const quizPayload = {
        title: quizData.title,
        questions: questions,
        duration: quizData.duration,
        targetType: quizData.targetType,
        ...(quizData.targetType === 'state' && { 
          targetId: quizData.targetStateId,
          targetStateId: quizData.targetStateId 
        }),
        ...(quizData.targetType === 'district' && { 
          targetId: quizData.targetDistrictId,
          targetStateId: quizData.targetStateId,
          targetDistrictId: quizData.targetDistrictId 
        }),
        ...(quizData.targetType === 'school' && { 
          targetId: quizData.targetSchoolId,
          targetStateId: quizData.targetStateId,
          targetDistrictId: quizData.targetDistrictId 
        }),
        expiryType: quizData.expiryType,
        ...(quizData.expiryType !== 'never' && { expiryValue: quizData.expiryValue }),
        isActive: true,
        createdBy: 'admin',
        ...(editingQuiz ? { updatedAt: new Date() } : { createdAt: new Date() })
      };

      if (editingQuiz) {
        // Update existing quiz
        await updateDoc(doc(db, 'quizzes', editingQuiz.id), quizPayload);
        console.log('Quiz updated successfully');
      } else {
        // Create new quiz
        await addDoc(collection(db, 'quizzes'), quizPayload);
        console.log('Quiz created successfully');
      }

      await fetchQuizzes();
      setShowCreateWizard(false);
      resetWizard();
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Error saving quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      await deleteDoc(doc(db, 'quizzes', quizId));
      await fetchQuizzes();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Error deleting quiz');
    }
  };

  const fetchQuizStats = async (quiz: Quiz) => {
    setLoadingStats(true);
    setSelectedQuizForStats(quiz);
    setShowStatsModal(true);

    try {
      // Fetch quiz attempts
      const attemptsRef = collection(db, 'quizAttempts');
      const attemptsQuery = query(
        attemptsRef,
        where('quizId', '==', quiz.id),
        orderBy('score', 'desc'),
        orderBy('completionTime', 'asc')
      );
      
      const attemptsSnapshot = await getDocs(attemptsQuery);
      const attempts: any[] = [];
      
      attemptsSnapshot.forEach(doc => {
        attempts.push({ id: doc.id, ...doc.data() });
      });

      // Fetch all students data for enrichment
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsMap = new Map();
      studentsSnapshot.forEach(doc => {
        const data = doc.data();
        studentsMap.set(doc.id, data);
        // Also map by studentId if available
        if (data.studentId) {
          studentsMap.set(data.studentId, data);
        }
      });

      // Fetch schools data
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      const schoolsMap = new Map();
      schoolsSnapshot.forEach(doc => {
        const data = doc.data();
        schoolsMap.set(data.schoolCode, data);
      });

      // Fetch states data
      const statesSnapshot = await getDocs(collection(db, 'states'));
      const statesMap = new Map();
      statesSnapshot.forEach(doc => {
        const data = doc.data();
        statesMap.set(data.stateName, data);
      });

      // Enrich attempts with student, school, and location data
      const enrichedStats: QuizStats[] = attempts.map((attempt, index) => {
        let studentData = studentsMap.get(attempt.studentId);
        
        // If not found by UID, try by email or studentId
        if (!studentData && attempt.studentEmail) {
          // Find student by email
          for (const [key, value] of studentsMap.entries()) {
            if (value.email === attempt.studentEmail) {
              studentData = value;
              break;
            }
          }
        }

        // Extract student ID from email if available
        let extractedStudentId = '';
        if (attempt.studentEmail && attempt.studentEmail.includes('@mindleap.edu')) {
          extractedStudentId = attempt.studentEmail.split('@')[0].toUpperCase();
          if (!studentData) {
            studentData = studentsMap.get(extractedStudentId);
          }
        }

        const schoolData = studentData ? schoolsMap.get(studentData.schoolCode) : null;
        const percentage = Math.round((attempt.score || 0));

        return {
          studentId: extractedStudentId || attempt.studentId || 'Unknown',
          studentName: attempt.studentName || studentData?.name || 'Unknown Student',
          schoolName: studentData?.schoolName || schoolData?.name || 'Unknown School',
          districtName: studentData?.districtName || schoolData?.districtName || 'Unknown District',
          districtCode: studentData?.districtCode || schoolData?.districtCode || 'Unknown',
          state: studentData?.state || schoolData?.state || 'Unknown State',
          score: attempt.score || 0,
          percentage,
          rank: index + 1,
          correctAnswers: attempt.correctAnswers || 0,
          totalQuestions: attempt.totalQuestions || quiz.questions?.length || 0,
          completionTime: attempt.completionTime || 0,
          submittedAt: attempt.submittedAt
        };
      });

      setStatsData(enrichedStats);
    } catch (error) {
      console.error('Error fetching quiz stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const exportStatsToCSV = () => {
    if (!statsData.length || !selectedQuizForStats) return;

    const headers = [
      'Rank',
      'Student Name',
      'Student ID',
      'Percentage',
      'Score',
      'Correct Answers',
      'Total Questions',
      'School Name',
      'District Name',
      'District Code',
      'State',
      'Completion Time (mins)',
      'Submitted At'
    ];

    const csvData = statsData.map(stat => [
      stat.rank,
      stat.studentName,
      stat.studentId,
      `${stat.percentage}%`,
      stat.score,
      stat.correctAnswers,
      stat.totalQuestions,
      stat.schoolName,
      stat.districtName,
      stat.districtCode,
      stat.state,
      Math.round(stat.completionTime / 60),
      stat.submittedAt ? new Date(stat.submittedAt.toDate()).toLocaleString() : 'Unknown'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedQuizForStats.title}_leaderboard.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTemplate = () => {
    const csvContent = `Question,Option A,Option B,Option C,Option D,Correct Answer (1-4)
"What is 2+2?","3","4","5","6","2"
"What is the capital of France?","London","Berlin","Paris","Madrid","3"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkImport = async () => {
    if (!bulkImportFile) {
      alert('Please select a file');
      return;
    }

    setImporting(true);
    try {
      const text = await bulkImportFile.text();
      const lines = text.split('\n').slice(1); // Skip header
      const importedQuestions: Question[] = [];

      lines.forEach((line, index) => {
        if (line.trim()) {
          const columns = line.split(',').map(col => col.replace(/"/g, '').trim());
          if (columns.length >= 6) {
            importedQuestions.push({
              id: `imported_${Date.now()}_${index}`,
              question: columns[0],
              options: [columns[1], columns[2], columns[3], columns[4]],
              correctAnswer: parseInt(columns[5]) - 1
            });
          }
        }
      });

      setQuestions([...questions, ...importedQuestions]);
      setShowBulkImportModal(false);
      setBulkImportFile(null);
      alert(`Successfully imported ${importedQuestions.length} questions!`);
    } catch (error) {
      console.error('Error importing questions:', error);
      alert('Error importing questions. Please check the file format.');
    } finally {
      setImporting(false);
    }
  };

  const getSelectedDistricts = () => {
    const selectedState = states.find(s => s.id === quizData.targetStateId);
    return selectedState?.districts || [];
  };

  const getSelectedSchools = () => {
    const selectedDistrict = getSelectedDistricts().find(d => d.districtCode === quizData.targetDistrictId);
    return (selectedDistrict as any)?.schools || [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'all': return <Globe className="w-4 h-4" />;
      case 'state': return <MapPin className="w-4 h-4" />;
      case 'district': return <Target className="w-4 h-4" />;
      case 'school': return <School className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Basic Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Title *
            </label>
            <input
              type="text"
              value={quizData.title}
              onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter quiz title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={Math.floor(quizData.duration / 60)}
              onChange={(e) => setQuizData({ ...quizData, duration: parseInt(e.target.value || '5') * 60 })}
              min="1"
              max="180"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience *
            </label>
            <div className="space-y-3">
              {[
                { value: 'all', label: 'All Users', icon: Globe },
                { value: 'state', label: 'Specific State', icon: MapPin },
                { value: 'district', label: 'Specific District', icon: Target },
                { value: 'school', label: 'Specific School', icon: School }
              ].map(({ value, label, icon: Icon }) => (
                <label key={value} className="flex items-center">
                  <input
                    type="radio"
                    name="targetType"
                    value={value}
                    checked={quizData.targetType === value}
                    onChange={(e) => setQuizData({ 
                      ...quizData, 
                      targetType: e.target.value as any,
                      targetStateId: '',
                      targetDistrictId: '',
                      targetSchoolId: ''
                    })}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                  />
                  <Icon className="w-4 h-4 ml-2 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* State Selection */}
          {(quizData.targetType === 'state' || quizData.targetType === 'district' || quizData.targetType === 'school') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select State
              </label>
              <select
                value={quizData.targetStateId}
                onChange={(e) => setQuizData({ 
                  ...quizData, 
                  targetStateId: e.target.value,
                  targetDistrictId: '',
                  targetSchoolId: ''
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state.id} value={state.id}>
                    {state.stateName} ({state.stateCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* District Selection */}
          {(quizData.targetType === 'district' || quizData.targetType === 'school') && quizData.targetStateId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select District
              </label>
              <select
                value={quizData.targetDistrictId}
                onChange={(e) => setQuizData({ 
                  ...quizData, 
                  targetDistrictId: e.target.value,
                  targetSchoolId: ''
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select District</option>
                {getSelectedDistricts().map(district => (
                  <option key={district.districtCode} value={district.districtCode}>
                    {district.districtName} ({district.districtCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* School Selection */}
          {quizData.targetType === 'school' && quizData.targetDistrictId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select School
              </label>
              <select
                value={quizData.targetSchoolId}
                onChange={(e) => setQuizData({ ...quizData, targetSchoolId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select School</option>
                {getSelectedSchools().map(school => (
                  <option key={school.id} value={school.id}>
                    {school.name} ({school.schoolCode})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Add Questions</h3>
        <button
          onClick={() => setShowBulkImportModal(true)}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Bulk Import
        </button>
      </div>

      {/* Current Question Form */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Add New Question</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question *
            </label>
            <textarea
              value={currentQuestion.question}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="Enter your question"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer Options *
            </label>
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={currentQuestion.correctAnswer === index}
                    onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700 w-6">
                    {String.fromCharCode(65 + index)}:
                  </span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...currentQuestion.options];
                      newOptions[index] = e.target.value;
                      setCurrentQuestion({ ...currentQuestion, options: newOptions });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={addQuestion}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>
      </div>

      {/* Questions List */}
      {questions.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Added Questions ({questions.length})</h4>
          <div className="space-y-3">
            {questions.map((question, index) => (
              <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Q{index + 1}: {question.question}
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-2 rounded ${
                            question.correctAnswer === optIndex 
                              ? 'bg-green-100 text-green-800 font-medium' 
                              : 'bg-gray-50'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}: {option}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Quiz Expiry Settings</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quiz Expiry
          </label>
          <div className="space-y-3">
            {[
              { value: 'never', label: 'Never Expires', icon: Infinity },
              { value: 'hours', label: 'Expire after Hours', icon: Clock },
              { value: 'days', label: 'Expire after Days', icon: Calendar }
            ].map(({ value, label, icon: Icon }) => (
              <label key={value} className="flex items-center">
                <input
                  type="radio"
                  name="expiryType"
                  value={value}
                  checked={quizData.expiryType === value}
                  onChange={(e) => setQuizData({ ...quizData, expiryType: e.target.value as any })}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                />
                <Icon className="w-4 h-4 ml-2 mr-2 text-gray-500" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {quizData.expiryType !== 'never' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Value
            </label>
            <input
              type="number"
              value={quizData.expiryValue}
              onChange={(e) => setQuizData({ ...quizData, expiryValue: parseInt(e.target.value || '1') })}
              min="1"
              max={quizData.expiryType === 'hours' ? 168 : 365}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Quiz will expire after {quizData.expiryValue} {quizData.expiryType}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Review & Submit</h3>
      
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <div>
          <h4 className="font-medium text-gray-900">Quiz Details</h4>
          <div className="mt-2 text-sm text-gray-600">
            <p><span className="font-medium">Title:</span> {quizData.title}</p>
            <p><span className="font-medium">Duration:</span> {formatTime(quizData.duration)}</p>
            <p><span className="font-medium">Target:</span> {quizData.targetType}</p>
            <p><span className="font-medium">Questions:</span> {questions.length}</p>
            <p><span className="font-medium">Expiry:</span> {
              quizData.expiryType === 'never' 
                ? 'Never expires' 
                : `${quizData.expiryValue} ${quizData.expiryType}`
            }</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quizzes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quiz Management</h2>
          <p className="text-gray-600">Create and manage quiz challenges</p>
        </div>
        <button
          onClick={() => setShowCreateWizard(true)}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Quiz
        </button>
      </div>

      {/* Quizzes List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quiz Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quizzes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No quizzes created yet</p>
                    <p className="text-sm">Create your first quiz to get started</p>
                  </td>
                </tr>
              ) : (
                quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{quiz.title}</div>
                        <div className="text-sm text-gray-500">
                          Created: {quiz.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTargetIcon(quiz.targetType)}
                        <span className="text-sm text-gray-900 capitalize">{quiz.targetType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {quiz.questions?.length || 0} questions
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {formatTime(quiz.duration)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        quiz.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {quiz.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditQuiz(quiz)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="Edit Quiz"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => fetchQuizStats(quiz)}
                          className="text-green-600 hover:text-green-900 p-1"
                          title="View Stats"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Quiz Wizard Modal */}
      <AnimatePresence>
        {showCreateWizard && (
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
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                {/* Wizard Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateWizard(false);
                      resetWizard();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= currentStep 
                          ? 'bg-orange-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step}
                      </div>
                      {step < 4 && (
                        <div className={`w-16 h-1 mx-2 ${
                          step < currentStep ? 'bg-orange-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                  {currentStep === 1 && renderStep1()}
                  {currentStep === 2 && renderStep2()}
                  {currentStep === 3 && renderStep3()}
                  {currentStep === 4 && renderStep4()}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <button
                    onClick={handlePrevStep}
                    disabled={currentStep === 1}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowCreateWizard(false);
                        resetWizard();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    
                    {currentStep < 4 ? (
                      <button
                        onClick={handleNextStep}
                        disabled={
                          (currentStep === 1 && !quizData.title) ||
                          (currentStep === 2 && questions.length === 0)
                        }
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleCreateQuiz}
                        disabled={submitting}
                        className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                      >
                        {submitting 
                          ? (editingQuiz ? 'Updating...' : 'Creating...') 
                          : (editingQuiz ? 'Update Quiz' : 'Create Quiz')
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Import Modal */}
      <AnimatePresence>
        {showBulkImportModal && (
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
              className="bg-white rounded-lg max-w-lg w-full"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Bulk Import Questions</h3>
                  <button
                    onClick={() => setShowBulkImportModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <button
                      onClick={downloadTemplate}
                      className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 text-gray-600 hover:text-gray-700"
                    >
                      <Download className="w-5 h-5" />
                      Download Template
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload CSV File
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setBulkImportFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowBulkImportModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkImport}
                      disabled={!bulkImportFile || importing}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    >
                      {importing ? 'Importing...' : 'Import'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Stats Modal */}
      <AnimatePresence>
        {showStatsModal && (
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
              className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Quiz Leaderboard: {selectedQuizForStats?.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {statsData.length} participants
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={exportStatsToCSV}
                      disabled={!statsData.length}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        setShowStatsModal(false);
                        setSelectedQuizForStats(null);
                        setStatsData([]);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {loadingStats ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    <span className="ml-3 text-gray-600">Loading quiz statistics...</span>
                  </div>
                ) : statsData.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
                    <p className="text-gray-600">No students have attempted this quiz yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Percentage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            School
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            District
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            State
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {statsData.map((stat, index) => (
                          <tr key={index} className={index < 3 ? 'bg-yellow-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {index === 0 && <Trophy className="w-5 h-5 text-yellow-500 mr-2" />}
                                {index === 1 && <Trophy className="w-5 h-5 text-gray-400 mr-2" />}
                                {index === 2 && <Trophy className="w-5 h-5 text-orange-600 mr-2" />}
                                <span className={`text-sm font-medium ${
                                  index < 3 ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  #{stat.rank}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {stat.studentName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700">
                                {stat.studentId}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`text-sm font-medium ${
                                  stat.percentage >= 80 ? 'text-green-600' :
                                  stat.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {stat.percentage}%
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700">
                                {stat.correctAnswers}/{stat.totalQuestions}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700">
                                {stat.schoolName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700">
                                {stat.districtName}
                                <div className="text-xs text-gray-500">
                                  ({stat.districtCode})
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700">
                                {stat.state}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700">
                                {Math.round(stat.completionTime / 60)}m
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizManagementTab; 