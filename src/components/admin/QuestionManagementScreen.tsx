import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Eye, Edit, Trash2, BookOpen, Info, AlertTriangle } from 'lucide-react';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface Subject {
  id: string;
  name: string;
}

interface Question {
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
  createdAt: string;
}

interface QuestionManagementScreenProps {
  subject: Subject;
  onBack: () => void;
}

const QuestionManagementScreen: React.FC<QuestionManagementScreenProps> = ({ subject, onBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<Question | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'a',
    explanation: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setIsFetching(true);
    console.log('🔍 Fetching questions for subject:', subject.id);

    try {
      const questionsCollection = collection(db, 'subjects', subject.id, 'questions');
      const snapshot = await getDocs(questionsCollection);
      
      const fetchedQuestions: Question[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 Raw document data:', data);
        
        // Handle different possible data structures for options
        let options = { a: '', b: '', c: '', d: '' };
        
        // Check all possible data structures based on the Firebase screenshot
        if (data.options) {
          console.log('📊 Options found in data.options:', data.options);
          
          // If options is an object with a, b, c, d keys (lowercase)
          if (typeof data.options === 'object' && data.options.a !== undefined) {
            options = {
              a: String(data.options.a || ''),
              b: String(data.options.b || ''),
              c: String(data.options.c || ''),
              d: String(data.options.d || '')
            };
          }
          // If options is an object with A, B, C, D keys (uppercase)
          else if (typeof data.options === 'object' && data.options.A !== undefined) {
            options = {
              a: String(data.options.A || ''),
              b: String(data.options.B || ''),
              c: String(data.options.C || ''),
              d: String(data.options.D || '')
            };
          }
          // If options is an array (sometimes Firebase stores as array)
          else if (Array.isArray(data.options) && data.options.length >= 4) {
            options = {
              a: String(data.options[0] || ''),
              b: String(data.options[1] || ''),
              c: String(data.options[2] || ''),
              d: String(data.options[3] || '')
            };
          }
        }
        
        // Also check for individual option fields at the root level
        if (data.A || data.B || data.C || data.D) {
          console.log('📊 Options found at root level:', { A: data.A, B: data.B, C: data.C, D: data.D });
          options = {
            a: String(data.A || ''),
            b: String(data.B || ''),
            c: String(data.C || ''),
            d: String(data.D || '')
          };
        }
        
        // Check for lowercase at root level
        if (data.a || data.b || data.c || data.d) {
          console.log('📊 Options found at root level (lowercase):', { a: data.a, b: data.b, c: data.c, d: data.d });
          options = {
            a: String(data.a || ''),
            b: String(data.b || ''),
            c: String(data.c || ''),
            d: String(data.d || '')
          };
        }
        
        // Check for numeric keys (0, 1, 2, 3) which might be how Firebase stores arrays
        if (data['0'] || data['1'] || data['2'] || data['3']) {
          console.log('📊 Options found with numeric keys:', { 0: data['0'], 1: data['1'], 2: data['2'], 3: data['3'] });
          options = {
            a: String(data['0'] || ''),
            b: String(data['1'] || ''),
            c: String(data['2'] || ''),
            d: String(data['3'] || '')
          };
        }
        
        // Final fallback - check all fields and try to extract options
        console.log('🔍 All data keys:', Object.keys(data));
        console.log('🔍 All data values:', Object.values(data));
        
        console.log('🔧 Processed options:', options);
        
        const question: Question = {
          id: doc.id,
          question: data.question || '',
          options: options,
          correctOption: (data.correctOption || data.correctAnswer || 'a').toLowerCase(),
          explanation: data.explanation || '',
          createdAt: data.createdAt || new Date().toISOString()
        };
        
        console.log('✨ Final question object:', question);
        fetchedQuestions.push(question);
      });

      setQuestions(fetchedQuestions);
      console.log('✅ Questions loaded:', fetchedQuestions.length, fetchedQuestions);
    } catch (error) {
      console.error('❌ Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'a',
      explanation: ''
    });
  };

  const handleAddQuestion = async () => {
    // Comprehensive validation
    const errors = [];
    if (!formData.question.trim()) errors.push("Question");
    if (!formData.optionA.trim()) errors.push("Option A");
    if (!formData.optionB.trim()) errors.push("Option B");
    if (!formData.optionC.trim()) errors.push("Option C");
    if (!formData.optionD.trim()) errors.push("Option D");

    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in: ${errors.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate options
    const options = [formData.optionA.trim(), formData.optionB.trim(), formData.optionC.trim(), formData.optionD.trim()];
    const uniqueOptions = new Set(options);
    if (uniqueOptions.size !== options.length) {
      toast({
        title: "Validation Error",
        description: "All options must be different",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const questionData = {
        question: formData.question.trim(),
        options: {
          a: formData.optionA.trim(),
          b: formData.optionB.trim(),
          c: formData.optionC.trim(),
          d: formData.optionD.trim()
        },
        correctOption: formData.correctOption,
        explanation: formData.explanation.trim(),
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'subjects', subject.id, 'questions'), questionData);
      
      const newQuestion: Question = {
        id: docRef.id,
        ...questionData
      };

      setQuestions(prev => [newQuestion, ...prev]);
      setShowAddForm(false);
      resetForm();

      toast({
        title: "Success! 🎉",
        description: "Question added successfully",
      });
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: "Error",
        description: "Failed to add question",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditQuestion = (question: Question) => {
    setFormData({
      question: question.question,
      optionA: question.options.a,
      optionB: question.options.b,
      optionC: question.options.c,
      optionD: question.options.d,
      correctOption: question.correctOption,
      explanation: question.explanation
    });
    setEditingQuestion(question);
    setShowAddForm(true);
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;

    // Comprehensive validation
    const errors = [];
    if (!formData.question.trim()) errors.push("Question");
    if (!formData.optionA.trim()) errors.push("Option A");
    if (!formData.optionB.trim()) errors.push("Option B");
    if (!formData.optionC.trim()) errors.push("Option C");
    if (!formData.optionD.trim()) errors.push("Option D");

    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in: ${errors.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate options
    const options = [formData.optionA.trim(), formData.optionB.trim(), formData.optionC.trim(), formData.optionD.trim()];
    const uniqueOptions = new Set(options);
    if (uniqueOptions.size !== options.length) {
      toast({
        title: "Validation Error",
        description: "All options must be different",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const questionData = {
        question: formData.question.trim(),
        options: {
          a: formData.optionA.trim(),
          b: formData.optionB.trim(),
          c: formData.optionC.trim(),
          d: formData.optionD.trim()
        },
        correctOption: formData.correctOption,
        explanation: formData.explanation.trim()
      };

      await updateDoc(doc(db, 'subjects', subject.id, 'questions', editingQuestion.id), questionData);
      
      setQuestions(prev => prev.map(q => 
        q.id === editingQuestion.id ? { ...q, ...questionData } : q
      ));
      
      setShowAddForm(false);
      setEditingQuestion(null);
      resetForm();

      toast({
        title: "Success! ✅",
        description: "Question updated successfully",
      });
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuestion = async (question: Question) => {
    try {
      await deleteDoc(doc(db, 'subjects', subject.id, 'questions', question.id));
      setQuestions(prev => prev.filter(q => q.id !== question.id));
      setDeleteConfirmation(null);

      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const handleTooltip = (questionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setTooltipVisible(tooltipVisible === questionId ? null : questionId);
  };

  if (showAddForm) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setEditingQuestion(null);
                  resetForm();
                }}
                variant="outline"
                className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Questions
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </h1>
                <p className="text-gray-600">Subject: {subject.name}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="space-y-6">
              {/* Question */}
              <div>
                <Label htmlFor="question" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Question <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Enter your question here..."
                  className={`mt-1 min-h-[100px] ${!formData.question.trim() ? 'border-red-200 focus:border-red-400' : ''}`}
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="optionA" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Option A <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="optionA"
                    value={formData.optionA}
                    onChange={(e) => setFormData(prev => ({ ...prev, optionA: e.target.value }))}
                    placeholder="Enter option A"
                    className={`mt-1 ${!formData.optionA.trim() ? 'border-red-200 focus:border-red-400' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="optionB" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Option B <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="optionB"
                    value={formData.optionB}
                    onChange={(e) => setFormData(prev => ({ ...prev, optionB: e.target.value }))}
                    placeholder="Enter option B"
                    className={`mt-1 ${!formData.optionB.trim() ? 'border-red-200 focus:border-red-400' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="optionC" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Option C <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="optionC"
                    value={formData.optionC}
                    onChange={(e) => setFormData(prev => ({ ...prev, optionC: e.target.value }))}
                    placeholder="Enter option C"
                    className={`mt-1 ${!formData.optionC.trim() ? 'border-red-200 focus:border-red-400' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="optionD" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    Option D <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="optionD"
                    value={formData.optionD}
                    onChange={(e) => setFormData(prev => ({ ...prev, optionD: e.target.value }))}
                    placeholder="Enter option D"
                    className={`mt-1 ${!formData.optionD.trim() ? 'border-red-200 focus:border-red-400' : ''}`}
                  />
                </div>
              </div>

              {/* Correct Option */}
              <div>
                <Label htmlFor="correctOption" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Correct Answer <span className="text-red-500">*</span>
                </Label>
                <select
                  id="correctOption"
                  value={formData.correctOption}
                  onChange={(e) => setFormData(prev => ({ ...prev, correctOption: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
              </div>

              {/* Explanation */}
              <div>
                <Label htmlFor="explanation" className="text-sm font-medium text-gray-700">
                  Explanation
                </Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                  placeholder="Explain why this is the correct answer..."
                  className="mt-1"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  {isLoading ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
                </Button>
                <Button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingQuestion(null);
                    resetForm();
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Button
                onClick={onBack}
                variant="outline"
                className="flex items-center gap-2 whitespace-nowrap flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Streak Scheduler
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-3 truncate">
                  <BookOpen className="w-6 h-6 lg:w-8 lg:h-8 text-orange-500 flex-shrink-0" />
                  <span className="truncate">{subject.name} - Questions Management</span>
                </h1>
                <p className="text-gray-600 mt-1 text-sm lg:text-base">
                  {isFetching ? 'Loading questions...' : `${questions.length} questions found`}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 whitespace-nowrap"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Question
              </Button>
              <Button
                onClick={() => {
                  console.log('🔍 Debug - Subject:', subject);
                  console.log('🔍 Debug - Questions:', questions);
                  fetchQuestions();
                }}
                variant="outline"
                className="text-orange-600 hover:bg-orange-50 whitespace-nowrap"
              >
                Debug Fetch
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isFetching ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading questions...</p>
          </div>
        ) : (
          /* Questions List */
          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Questions Added Yet</h3>
                <p className="text-gray-500 mb-6">Click "Add Question" to get started</p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Question
                </Button>
              </div>
            ) : (
              questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium mb-3 text-lg">
                        {question.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <span className="flex items-center">
                          <span className="font-semibold text-blue-600 mr-2">A:</span>
                          {question.options?.a || 'N/A'}
                        </span>
                        <span className="flex items-center">
                          <span className="font-semibold text-blue-600 mr-2">B:</span>
                          {question.options?.b || 'N/A'}
                        </span>
                        <span className="flex items-center">
                          <span className="font-semibold text-blue-600 mr-2">C:</span>
                          {question.options?.c || 'N/A'}
                        </span>
                        <span className="flex items-center">
                          <span className="font-semibold text-blue-600 mr-2">D:</span>
                          {question.options?.d || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-green-600 font-semibold">
                          Correct Answer: {(question.correctOption || 'a').toUpperCase()}
                        </p>
                        {question.explanation && (
                          <div className="relative">
                            <button
                              onClick={(e) => handleTooltip(question.id, e)}
                              className="p-1 text-blue-500 hover:bg-blue-100 rounded-full transition-colors"
                              title="Click to see explanation"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                            {tooltipVisible === question.id && (
                              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                                <div className="bg-white rounded-lg shadow-xl p-4 max-w-md w-full max-h-80 overflow-y-auto">
                                  <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-semibold text-gray-800">Explanation:</h3>
                                    <button
                                      onClick={() => setTooltipVisible(null)}
                                      className="text-gray-400 hover:text-gray-600 ml-2 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors flex-shrink-0"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <div className="text-gray-700 text-sm leading-relaxed">
                                    {question.explanation}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 lg:ml-4 justify-end lg:justify-start flex-shrink-0">
                      <Button
                        onClick={() => setViewingQuestion(question)}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50 w-8 h-8 p-0 flex items-center justify-center flex-shrink-0"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleEditQuestion(question)}
                        variant="outline"
                        size="sm"
                        className="text-orange-600 hover:bg-orange-50 w-8 h-8 p-0 flex items-center justify-center flex-shrink-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => setDeleteConfirmation(question)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 w-8 h-8 p-0 flex items-center justify-center flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* View Question Modal */}
      {viewingQuestion && (
        <Dialog open={!!viewingQuestion} onOpenChange={() => setViewingQuestion(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800">
                Question Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Question:</h3>
                <p className="text-gray-800">{viewingQuestion.question}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Options:</h3>
                <div className="space-y-2">
                  <p><span className="font-semibold text-blue-600">A:</span> {viewingQuestion.options?.a}</p>
                  <p><span className="font-semibold text-blue-600">B:</span> {viewingQuestion.options?.b}</p>
                  <p><span className="font-semibold text-blue-600">C:</span> {viewingQuestion.options?.c}</p>
                  <p><span className="font-semibold text-blue-600">D:</span> {viewingQuestion.options?.d}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Correct Answer:</h3>
                <p className="text-green-600 font-semibold">{viewingQuestion.correctOption?.toUpperCase()}</p>
              </div>
              {viewingQuestion.explanation && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Explanation:</h3>
                  <p className="text-gray-800">{viewingQuestion.explanation}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <Dialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Confirm Deletion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete this question? This action cannot be undone.
              </p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">
                  {truncateText(deleteConfirmation.question, 100)}
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setDeleteConfirmation(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleDeleteQuestion(deleteConfirmation)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Delete Question
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
};

export default QuestionManagementScreen; 