import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  Brain,
  Calendar,
  Download,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  ChevronLeft,
  Filter,
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';

interface SubjectReport {
  subjectName: string;
  questionsAnswered: number;
  totalScore: number;
  percentage: number;
  streak: number;
  medal: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | null;
}

interface MonthlyReport {
  month: string;
  year: number;
  totalQuestions: number;
  totalScore: number;
  streakMaintained: number;
  overallMedal: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | null;
  subjects: SubjectReport[];
}

const Reports = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchMonthlyReport();
  }, [user, selectedMonth]);

  const fetchMonthlyReport = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch student data
      const studentRef = doc(db, 'students', user.uid);
      const studentSnap = await getDoc(studentRef);
      
      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        setStudentName(studentData.name || studentData.studentId || 'Student');
      }

      // Fetch daily streak data for the selected month
      const userStreakDoc = await getDoc(doc(db, 'dailyStreaks', user.uid));
      
      if (userStreakDoc.exists()) {
        const streakData = userStreakDoc.data();
        const records = streakData.records || {};
        
        // Filter records for selected month
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);
        
        const monthRecords = Object.values(records).filter((record: any) => {
          const recordDate = record.timestamp?.toDate?.() || new Date(record.timestamp);
          return recordDate >= monthStart && recordDate <= monthEnd;
        });

        // Calculate subject-wise reports
        const subjectMap = new Map<string, SubjectReport>();
        let totalQuestions = 0;
        let totalScore = 0;
        let streakDays = 0;

        monthRecords.forEach((record: any) => {
          const subject = record.subject || 'General Knowledge';
          const points = record.points || (record.isCorrect ? 200 : 100);
          
          totalQuestions++;
          totalScore += points;
          if (record.isCorrect) streakDays++;

          if (!subjectMap.has(subject)) {
            subjectMap.set(subject, {
              subjectName: subject,
              questionsAnswered: 0,
              totalScore: 0,
              percentage: 0,
              streak: 0,
              medal: null
            });
          }

          const subjectReport = subjectMap.get(subject)!;
          subjectReport.questionsAnswered++;
          subjectReport.totalScore += points;
          if (record.isCorrect) subjectReport.streak++;
        });

        // Calculate percentages and medals for subjects
        const subjects: SubjectReport[] = Array.from(subjectMap.values()).map(subject => {
          const percentage = subject.questionsAnswered > 0 
            ? (subject.streak / subject.questionsAnswered) * 100 
            : 0;
          
          return {
            ...subject,
            percentage,
            medal: getMedalFromScore(subject.totalScore)
          };
        });

        const overallPercentage = totalQuestions > 0 ? (streakDays / totalQuestions) * 100 : 0;

        setMonthlyReport({
          month: format(selectedMonth, 'MMMM'),
          year: selectedMonth.getFullYear(),
          totalQuestions,
          totalScore,
          streakMaintained: streakDays,
          overallMedal: getMedalFromScore(totalScore),
          subjects: subjects.sort((a, b) => b.percentage - a.percentage)
        });
      } else {
        // No data for this month
        setMonthlyReport({
          month: format(selectedMonth, 'MMMM'),
          year: selectedMonth.getFullYear(),
          totalQuestions: 0,
          totalScore: 0,
          streakMaintained: 0,
          overallMedal: null,
          subjects: []
        });
      }
    } catch (error) {
      console.error('Error fetching monthly report:', error);
    }
    setLoading(false);
  };

  const getMedalFromScore = (score: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | null => {
    if (score >= 4000) return 'Platinum';
    if (score >= 3000) return 'Gold';
    if (score >= 2000) return 'Silver';
    if (score >= 1000) return 'Bronze';
    return null;
  };

  const getMedalIcon = (medal: string | null) => {
    switch (medal) {
      case 'Bronze': return '/sheild_icons/broze_sheild.png';
      case 'Silver': return '/sheild_icons/silver_sheild.png';
      case 'Gold': return '/sheild_icons/gold_sheild.png';
      case 'Platinum': return '/sheild_icons/platinum_sheild.png';
      default: return null;
    }
  };

  const getMedalColor = (medal: string | null) => {
    switch (medal) {
      case 'Bronze': return 'from-amber-600 to-yellow-600';
      case 'Silver': return 'from-gray-400 to-gray-600';
      case 'Gold': return 'from-yellow-400 to-yellow-600';
      case 'Platinum': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-300 to-gray-400';
    }
  };

  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = subMonths(currentDate, i);
      options.push({
        value: date.toISOString(),
        label: format(date, 'MMMM yyyy')
      });
    }
    
    return options;
  };

  const downloadReport = () => {
    if (!monthlyReport) return;
    
    // Create a simple text report (in a real app, you'd use a PDF library like jsPDF)
    const reportContent = `
MINDLEAP MONTHLY REPORT
Student: ${studentName}
Month: ${monthlyReport.month} ${monthlyReport.year}

OVERALL PERFORMANCE
- Total Questions Answered: ${monthlyReport.totalQuestions}
- Total Score: ${monthlyReport.totalScore}
- Streak Days: ${monthlyReport.streakMaintained}
- Medal Achieved: ${monthlyReport.overallMedal || 'None'}

SUBJECT-WISE BREAKDOWN
${monthlyReport.subjects.map(subject => `
- ${subject.subjectName}:
  Questions: ${subject.questionsAnswered}
  Score: ${subject.totalScore}
  Accuracy: ${subject.percentage.toFixed(1)}%
  Medal: ${subject.medal || 'None'}
`).join('')}

RECOMMENDATIONS
${monthlyReport.subjects.length > 0 ? 
  `- Strongest Subject: ${monthlyReport.subjects[0].subjectName} (${monthlyReport.subjects[0].percentage.toFixed(1)}% accuracy)
- Focus Area: ${monthlyReport.subjects[monthlyReport.subjects.length - 1].subjectName} (${monthlyReport.subjects[monthlyReport.subjects.length - 1].percentage.toFixed(1)}% accuracy)` 
  : '- No data available for this month'}
`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MindLeap_Report_${monthlyReport.month}_${monthlyReport.year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <FileText className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-lg font-semibold text-gray-700">Generating your report...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-lg"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Monthly Reports</h1>
                  <p className="text-sm text-gray-600">Track your progress</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Select
                value={selectedMonth.toISOString()}
                onValueChange={(value) => setSelectedMonth(new Date(value))}
              >
                <SelectTrigger className="w-48">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateMonthOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {monthlyReport && (
                <Button onClick={downloadReport} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Report
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {monthlyReport && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Report Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{monthlyReport.month} {monthlyReport.year} Report</span>
                  {monthlyReport.overallMedal && (
                    <div className="flex items-center gap-2">
                      <img 
                        src={getMedalIcon(monthlyReport.overallMedal)} 
                        alt={`${monthlyReport.overallMedal} Medal`}
                        className="w-8 h-8"
                      />
                      <Badge className={`bg-gradient-to-r ${getMedalColor(monthlyReport.overallMedal)} text-white`}>
                        {monthlyReport.overallMedal}
                      </Badge>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{monthlyReport.totalQuestions}</div>
                    <div className="text-sm text-gray-600">Questions Answered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{monthlyReport.totalScore}</div>
                    <div className="text-sm text-gray-600">Total Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{monthlyReport.streakMaintained}</div>
                    <div className="text-sm text-gray-600">Streak Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {monthlyReport.totalQuestions > 0 
                        ? ((monthlyReport.streakMaintained / monthlyReport.totalQuestions) * 100).toFixed(1)
                        : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject-wise Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Subject-wise Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyReport.subjects.length > 0 ? (
                  <div className="space-y-4">
                    {monthlyReport.subjects.map((subject, index) => (
                      <motion.div
                        key={subject.subjectName}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-800">{subject.subjectName}</h3>
                            {subject.medal && (
                              <img 
                                src={getMedalIcon(subject.medal)} 
                                alt={`${subject.medal} Medal`}
                                className="w-6 h-6"
                              />
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{subject.percentage.toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">{subject.questionsAnswered} questions</div>
                          </div>
                        </div>
                        
                        <Progress value={subject.percentage} className="h-2 mb-2" />
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Score: </span>
                            <span className="font-semibold">{subject.totalScore}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Correct: </span>
                            <span className="font-semibold">{subject.streak}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Medal: </span>
                            <span className="font-semibold">{subject.medal || 'None'}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No data available for {monthlyReport.month} {monthlyReport.year}</p>
                    <p className="text-sm text-gray-400">Try selecting a different month or start answering daily questions!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            {monthlyReport.subjects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Performance Analysis & Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Strongest Subject
                      </h4>
                      <p className="text-green-700">
                        <strong>{monthlyReport.subjects[0].subjectName}</strong> - 
                        {monthlyReport.subjects[0].percentage.toFixed(1)}% accuracy
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        Great job! Keep up the excellent work in this subject.
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Focus Area
                      </h4>
                      <p className="text-orange-700">
                        <strong>{monthlyReport.subjects[monthlyReport.subjects.length - 1].subjectName}</strong> - 
                        {monthlyReport.subjects[monthlyReport.subjects.length - 1].percentage.toFixed(1)}% accuracy
                      </p>
                      <p className="text-sm text-orange-600 mt-1">
                        Consider spending more time practicing this subject.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Reports;