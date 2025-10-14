import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Eye, BookOpen, BarChart3, Users, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface DailyQuestion {
  id: string;
  date: string;
  questionId: string;
  subject: string;
  subjectId: string;
  scheduledDay: string;
  totalAttempts: number;
  correctAttempts: number;
  createdAt: any;
}

interface QuestionDetail {
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
}

interface StudentResponse {
  uid: string;
  name: string;
  studentId?: string;
  isCorrect: boolean;
  selectedOption: string;
  points: number;
  timestamp: any;
  subject?: string;
  questionId?: string;
}

const QuestionSchedulerTab = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Monday start
  const [dailyQuestions, setDailyQuestions] = useState<DailyQuestion[]>([]);
  const [selectedDayQuestion, setSelectedDayQuestion] = useState<DailyQuestion | null>(null);
  const [questionDetail, setQuestionDetail] = useState<QuestionDetail | null>(null);
  const [studentResponses, setStudentResponses] = useState<StudentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'details'>('week');

  useEffect(() => {
    fetchWeeklyQuestions();
  }, [weekStart]);

  const fetchWeeklyQuestions = async () => {
    setLoading(true);
    try {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
      
      const questions: DailyQuestion[] = [];
      
      for (const day of weekDays) {
        const dateString = format(day, 'yyyy-MM-dd');
        const dailyQuestionDoc = await getDoc(doc(db, 'dailyQuestions', dateString));
        
        if (dailyQuestionDoc.exists()) {
          const data = dailyQuestionDoc.data();
          questions.push({
            id: dailyQuestionDoc.id,
            date: dateString,
            questionId: data.questionId || '',
            subject: data.subject || '',
            subjectId: data.subjectId || '',
            scheduledDay: data.scheduledDay || '',
            totalAttempts: data.totalAttempts || 0,
            correctAttempts: data.correctAttempts || 0,
            createdAt: data.createdAt
          });
        }
      }
      
      setDailyQuestions(questions);
    } catch (error) {
      console.error('Error fetching weekly questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionDetail = async (subjectId: string, questionId: string) => {
    try {
      const questionDoc = await getDoc(doc(db, 'subjects', subjectId, 'questions', questionId));
      if (questionDoc.exists()) {
        const data = questionDoc.data();
        setQuestionDetail({
          id: questionDoc.id,
          question: data.question || '',
          options: data.options || { a: '', b: '', c: '', d: '' },
          correctOption: data.correctOption || 'a',
          explanation: data.explanation || ''
        });
      }
    } catch (error) {
      console.error('Error fetching question detail:', error);
    }
  };

  const fetchStudentResponses = async (dateString: string) => {
    console.log('📋 Fetching student responses for date:', dateString);
    try {
      const responsesPath = `dailyQuestions/${dateString}/responses`;
      console.log('📂 Fetching from path:', responsesPath);
      
      const responsesSnap = await getDocs(collection(db, 'dailyQuestions', dateString, 'responses'));
      console.log('📊 Found', responsesSnap.size, 'response documents');
      
      const responses: StudentResponse[] = [];
      responsesSnap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        console.log('👤 Response from:', data.name || 'Unknown', '- Correct:', data.isCorrect, '- DocID:', docSnap.id);
        responses.push({
          uid: data.uid || docSnap.id,
          name: data.name || 'Student',
          studentId: data.studentId || '',
          isCorrect: !!data.isCorrect,
          selectedOption: data.selectedOption || '',
          points: typeof data.points === 'number' ? data.points : 0,
          timestamp: data.timestamp,
          subject: data.subject,
          questionId: data.questionId,
        });
      });
      
      // Sort by timestamp desc if available
      responses.sort((a, b) => {
        const ta = a.timestamp?.toDate?.() || new Date(a.timestamp);
        const tb = b.timestamp?.toDate?.() || new Date(b.timestamp);
        return (tb?.getTime?.() || 0) - (ta?.getTime?.() || 0);
      });
      
      console.log('✅ Total responses loaded:', responses.length);
      setStudentResponses(responses);
    } catch (err) {
      console.error('❌ Error fetching student responses:', err);
      setStudentResponses([]);
    }
  };

  const handleDayClick = async (dayQuestion: DailyQuestion) => {
    setSelectedDayQuestion(dayQuestion);
    setViewMode('details');
    await Promise.all([
      fetchQuestionDetail(dayQuestion.subjectId, dayQuestion.questionId),
      fetchStudentResponses(dayQuestion.date)
    ]);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setWeekStart(subDays(weekStart, 7));
    } else {
      setWeekStart(addDays(weekStart, 7));
    }
  };

  const getDayInfo = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayQuestion = dailyQuestions.find(q => q.date === dateString);
    const dayName = format(date, 'EEEE');
    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    const isSunday = date.getDay() === 0;
    const isSaturday = date.getDay() === 6;
    const isWeekend = isSunday || isSaturday;
    
    return { dayQuestion, dayName, isToday, isWeekend, isSaturday, isSunday, dateString };
  };

  const getSuccessRate = (correct: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  };

  const getSuccessColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-100';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (viewMode === 'details' && selectedDayQuestion) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => setViewMode('week')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Schedule
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Question Details - {format(new Date(selectedDayQuestion.date), 'EEEE, MMMM d, yyyy')}
            </h2>
            <p className="text-gray-600">Subject: {selectedDayQuestion.subject}</p>
          </div>
        </div>

        {questionDetail && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Question Display */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Question
              </h3>
              
              <div className="mb-6">
                <div 
                  className="text-gray-800 mb-4 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: questionDetail.question }}
                />
                
                <div className="space-y-3">
                  {Object.entries(questionDetail.options).map(([key, value]) => (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border-2 ${
                        key === questionDetail.correctOption.toLowerCase()
                          ? 'border-green-400 bg-green-50 text-green-800'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {key === questionDetail.correctOption.toLowerCase() && (
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        )}
                        <span className="font-medium flex-shrink-0">{key.toUpperCase()}:</span>
                        <div 
                          className="flex-1"
                          dangerouslySetInnerHTML={{ __html: value }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {questionDetail.explanation && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-800 mb-2">Explanation:</h4>
                  <div 
                    className="text-gray-600 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: questionDetail.explanation }}
                  />
                </div>
              )}
            </div>

            {/* Analytics */}
            <div className="bg-white rounded-lg border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Performance Analytics
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedDayQuestion.totalAttempts}</div>
                  <div className="text-sm text-blue-600">Total Attempts</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedDayQuestion.correctAttempts}</div>
                  <div className="text-sm text-green-600">Correct Answers</div>
                </div>
              </div>

              <div className="text-center p-4 bg-gray-50 rounded-lg mb-4">
                <div className={`text-2xl font-bold ${getSuccessColor(getSuccessRate(selectedDayQuestion.correctAttempts, selectedDayQuestion.totalAttempts)).split(' ')[0]}`}>
                  {getSuccessRate(selectedDayQuestion.correctAttempts, selectedDayQuestion.totalAttempts)}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div>Question ID: <span className="font-mono">{selectedDayQuestion.questionId}</span></div>
                <div>Scheduled Day: <span className="font-medium">{selectedDayQuestion.scheduledDay}</span></div>
                <div>Date: <span className="font-medium">{format(new Date(selectedDayQuestion.date), 'MMMM d, yyyy')}</span></div>
              </div>
            </div>

            {/* Student Responses */}
            <div className="bg-white rounded-lg border shadow-sm p-6 md:col-span-2 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Student Responses</h3>
                <div className="text-sm text-gray-500">{studentResponses.length} responses</div>
              </div>

              {studentResponses.length === 0 ? (
                <div className="text-sm text-gray-500">No responses recorded yet for this day.</div>
              ) : (
                <div className="space-y-2">
                  {studentResponses.map((resp) => (
                    <div key={resp.uid} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${resp.isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <div className="font-medium text-gray-800">{resp.name} {resp.studentId ? `(${resp.studentId})` : ''}</div>
                          <div className="text-xs text-gray-500">{resp.subject || selectedDayQuestion.subject} • {resp.questionId || selectedDayQuestion.questionId}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${resp.isCorrect ? 'text-green-600' : 'text-red-600'}`}>{resp.isCorrect ? 'Correct' : 'Wrong'}</div>
                        <div className="text-xs text-gray-500">Option: {resp.selectedOption?.toUpperCase?.() || '-'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-orange-600" />
            Daily Question Scheduler
          </h2>
          <p className="text-gray-600 mt-1">View which questions are shown to students each day</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigateWeek('prev')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous Week
          </Button>
          <div className="text-center">
            <div className="font-semibold text-gray-800">
              {format(weekStart, 'MMM d')} - {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigateWeek('next')}
            className="flex items-center gap-2"
          >
            Next Week
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">Loading questions...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {eachDayOfInterval({ 
            start: weekStart, 
            end: endOfWeek(weekStart, { weekStartsOn: 1 }) 
          }).map((date) => {
            const { dayQuestion, dayName, isToday, isWeekend, isSaturday, isSunday, dateString } = getDayInfo(date);
            
            return (
              <motion.div
                key={dateString}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-lg border-2 p-4 transition-all duration-200 ${
                  isToday 
                    ? 'border-orange-400 bg-orange-50' 
                    : (isWeekend && !dayQuestion)
                    ? 'border-gray-200 bg-gray-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${dayQuestion ? 'hover:shadow-md cursor-pointer' : ''}`}
                onClick={() => dayQuestion && handleDayClick(dayQuestion)}
              >
                <div className="text-center mb-3">
                  <div className={`font-semibold ${isToday ? 'text-orange-600' : 'text-gray-800'}`}>
                    {dayName}
                  </div>
                  <div className={`text-sm ${isToday ? 'text-orange-600' : 'text-gray-600'}`}>
                    {format(date, 'MMM d')}
                  </div>
                </div>

                {dayQuestion ? (
                  <div className="space-y-2">
                    <Badge variant="secondary" className="w-full text-center justify-center">
                      {dayQuestion.subject}
                      {isSaturday && <span className="ml-1 text-xs">(Sat)</span>}
                    </Badge>
                    
                    <div className="flex items-center justify-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-600">{dayQuestion.totalAttempts}</span>
                    </div>
                    
                    {dayQuestion.totalAttempts > 0 && (
                      <div className={`text-center text-xs px-2 py-1 rounded ${
                        getSuccessColor(getSuccessRate(dayQuestion.correctAttempts, dayQuestion.totalAttempts))
                      }`}>
                        {getSuccessRate(dayQuestion.correctAttempts, dayQuestion.totalAttempts)}% success
                      </div>
                    )}
                    
                    <div className="flex items-center justify-center mt-2">
                      <Button size="sm" variant="outline" className="text-xs" onClick={(e) => { e.stopPropagation(); handleDayClick(dayQuestion); }}>
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-400 text-sm">{isSunday ? 'Sunday' : isSaturday ? 'Saturday' : 'No question'}</div>
                    <div className="text-xs text-gray-400">{isWeekend ? 'No question scheduled' : 'scheduled'}</div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuestionSchedulerTab; 