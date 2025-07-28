import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Eye, BookOpen, BarChart3, Clock, Users, CheckCircle, XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit, getDoc, doc } from 'firebase/firestore';
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

const QuestionSchedulerTab = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })); // Monday start
  const [dailyQuestions, setDailyQuestions] = useState<DailyQuestion[]>([]);
  const [selectedDayQuestion, setSelectedDayQuestion] = useState<DailyQuestion | null>(null);
  const [questionDetail, setQuestionDetail] = useState<QuestionDetail | null>(null);
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

  const handleDayClick = async (dayQuestion: DailyQuestion) => {
    setSelectedDayQuestion(dayQuestion);
    setViewMode('details');
    await fetchQuestionDetail(dayQuestion.subjectId, dayQuestion.questionId);
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
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    return { dayQuestion, dayName, isToday, isWeekend, dateString };
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
            const { dayQuestion, dayName, isToday, isWeekend, dateString } = getDayInfo(date);
            
            return (
              <motion.div
                key={dateString}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-lg border-2 p-4 transition-all duration-200 ${
                  isToday 
                    ? 'border-orange-400 bg-orange-50' 
                    : isWeekend 
                    ? 'border-gray-200 bg-gray-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${dayQuestion && !isWeekend ? 'hover:shadow-md cursor-pointer' : ''}`}
                onClick={() => dayQuestion && !isWeekend && handleDayClick(dayQuestion)}
              >
                <div className="text-center mb-3">
                  <div className={`font-semibold ${isToday ? 'text-orange-600' : 'text-gray-800'}`}>
                    {dayName}
                  </div>
                  <div className={`text-sm ${isToday ? 'text-orange-600' : 'text-gray-600'}`}>
                    {format(date, 'MMM d')}
                  </div>
                </div>

                {isWeekend ? (
                  <div className="text-center py-4">
                    <div className="text-gray-400 text-sm">Weekend</div>
                    <div className="text-xs text-gray-400">No questions</div>
                  </div>
                ) : dayQuestion ? (
                  <div className="space-y-2">
                    <Badge variant="secondary" className="w-full text-center justify-center">
                      {dayQuestion.subject}
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
                      <Button size="sm" variant="outline" className="text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-gray-400 text-sm">No question</div>
                    <div className="text-xs text-gray-400">scheduled</div>
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