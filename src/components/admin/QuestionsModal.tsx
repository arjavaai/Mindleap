import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, Edit, Trash2, BookOpen, X } from 'lucide-react';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import AddQuestionForm from './AddQuestionForm';
import ViewQuestionModal from './ViewQuestionModal';

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

interface QuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
}

const QuestionsModal: React.FC<QuestionsModalProps> = ({ isOpen, onClose, subject }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const { toast } = useToast();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuestions([]);
      setIsAddFormOpen(false);
      setEditingQuestion(null);
      setViewingQuestion(null);
    }
  }, [isOpen]);

  // Fetch questions when modal opens
  useEffect(() => {
    if (isOpen && subject?.id) {
      console.log('🚀 QuestionsModal opened for subject:', subject.name, subject.id);
      fetchQuestions();
    }
  }, [isOpen, subject?.id]);

  const fetchQuestions = async () => {
    if (!subject?.id) {
      console.error('❌ No subject ID provided');
      return;
    }

    setIsFetching(true);
    console.log('🔍 Starting to fetch questions for subject:', subject.id);

    try {
      const questionsCollection = collection(db, 'subjects', subject.id, 'questions');
      console.log('📂 Collection path: subjects/' + subject.id + '/questions');
      
      const snapshot = await getDocs(questionsCollection);
      console.log('📊 Raw snapshot size:', snapshot.size);
      
      if (snapshot.empty) {
        console.log('📭 No documents found in collection');
        setQuestions([]);
        return;
      }

      const fetchedQuestions: Question[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📄 Processing document:', doc.id);
        console.log('📋 Document data:', JSON.stringify(data, null, 2));
        
        // Create question object with proper structure
        const question: Question = {
          id: doc.id,
          question: data.question || 'No question text',
          options: data.options || { a: '', b: '', c: '', d: '' },
          correctOption: data.correctOption || 'a',
          explanation: data.explanation || 'No explanation provided',
          createdAt: data.createdAt || new Date().toISOString()
        };
        
        fetchedQuestions.push(question);
        console.log('✅ Added question:', question.id, question.question.substring(0, 50) + '...');
      });

      console.log('🎉 Total questions processed:', fetchedQuestions.length);
      setQuestions(fetchedQuestions);

    } catch (error) {
      console.error('💥 Error fetching questions:', error);
      toast({
        title: "Error",
        description: `Failed to fetch questions: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddQuestion = async (questionData: Omit<Question, 'id' | 'createdAt'>) => {
    if (!subject?.id) return;

    setIsLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'subjects', subject.id, 'questions'), {
        ...questionData,
        createdAt: new Date().toISOString()
      });

      const newQuestion: Question = {
        id: docRef.id,
        ...questionData,
        createdAt: new Date().toISOString()
      };

      setQuestions(prev => [newQuestion, ...prev]);
      setIsAddFormOpen(false);

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

  const handleUpdateQuestion = async (questionId: string, questionData: Omit<Question, 'id' | 'createdAt'>) => {
    if (!subject?.id) return;

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'subjects', subject.id, 'questions', questionId), questionData);
      
      setQuestions(prev => prev.map(q => 
        q.id === questionId ? { ...q, ...questionData } : q
      ));
      setEditingQuestion(null);

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

  const handleDeleteQuestion = async (questionId: string) => {
    if (!subject?.id) return;

    try {
      await deleteDoc(doc(db, 'subjects', subject.id, 'questions', questionId));
      setQuestions(prev => prev.filter(q => q.id !== questionId));
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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-blue-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">
                    {subject?.name} - Questions Management
                  </h2>
                  <p className="text-orange-100">
                    {isFetching ? 'Loading questions...' : `${questions.length} questions found`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Add Question Button */}
            <div className="flex justify-end mb-6">
              <Button
                onClick={() => setIsAddFormOpen(true)}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Question
              </Button>
            </div>

            {/* Loading State */}
            {isFetching && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading questions...</p>
              </div>
            )}

            {/* Questions List */}
            {!isFetching && (
              <div className="space-y-4">
                {questions.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Questions Added Yet</h3>
                    <p className="text-gray-500">Click "Add Question" to get started</p>
                  </div>
                ) : (
                  questions.map((question, index) => (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-gray-800 font-medium mb-2">
                            {truncateText(question.question, 100)}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <span>A: {truncateText(question.options?.a || '', 30)}</span>
                            <span>B: {truncateText(question.options?.b || '', 30)}</span>
                            <span>C: {truncateText(question.options?.c || '', 30)}</span>
                            <span>D: {truncateText(question.options?.d || '', 30)}</span>
                          </div>
                          <p className="text-xs text-green-600 mt-2">
                            Correct Answer: {(question.correctOption || 'a').toUpperCase()}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => setViewingQuestion(question)}
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => setEditingQuestion(question)}
                            variant="outline"
                            size="sm"
                            className="text-orange-600 hover:bg-orange-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteQuestion(question.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
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
        </motion.div>
      </div>

      {/* Add Question Form Modal */}
      {isAddFormOpen && (
        <AddQuestionForm
          isOpen={isAddFormOpen}
          onClose={() => setIsAddFormOpen(false)}
          onSubmit={handleAddQuestion}
          isLoading={isLoading}
          editingQuestion={null}
        />
      )}

      {/* Edit Question Form Modal */}
      {editingQuestion && (
        <AddQuestionForm
          isOpen={!!editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSubmit={(questionData) => handleUpdateQuestion(editingQuestion.id, questionData)}
          isLoading={isLoading}
          editingQuestion={editingQuestion}
        />
      )}

      {/* View Question Modal */}
      {viewingQuestion && (
        <ViewQuestionModal
          isOpen={!!viewingQuestion}
          onClose={() => setViewingQuestion(null)}
          question={viewingQuestion}
        />
      )}
    </AnimatePresence>
  );
};

export default QuestionsModal;
