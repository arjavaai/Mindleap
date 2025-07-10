
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import Editor from 'react-simple-wysiwyg';

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

interface AddQuestionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questionData: Omit<Question, 'id' | 'createdAt'>) => void;
  isLoading: boolean;
  editingQuestion: Question | null;
}

const AddQuestionForm: React.FC<AddQuestionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editingQuestion
}) => {
  const [formData, setFormData] = useState({
    question: '',
    options: {
      a: '',
      b: '',
      c: '',
      d: ''
    },
    correctOption: '',
    explanation: ''
  });

  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        question: editingQuestion.question,
        options: editingQuestion.options,
        correctOption: editingQuestion.correctOption,
        explanation: editingQuestion.explanation
      });
    } else {
      setFormData({
        question: '',
        options: { a: '', b: '', c: '', d: '' },
        correctOption: '',
        explanation: ''
      });
    }
  }, [editingQuestion, isOpen]);

  // Helper function to strip HTML tags for validation
  const stripHtml = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const handleSubmit = () => {
    if (!stripHtml(formData.question).trim() || 
        !stripHtml(formData.options.a).trim() || 
        !stripHtml(formData.options.b).trim() || 
        !stripHtml(formData.options.c).trim() || 
        !stripHtml(formData.options.d).trim() || 
        !formData.correctOption || 
        !stripHtml(formData.explanation).trim()) {
      return;
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    if (!editingQuestion) {
      setFormData({
        question: '',
        options: { a: '', b: '', c: '', d: '' },
        correctOption: '',
        explanation: ''
      });
    }
    onClose();
  };

  const isFormValid = stripHtml(formData.question).trim() && 
    stripHtml(formData.options.a).trim() && 
    stripHtml(formData.options.b).trim() && 
    stripHtml(formData.options.c).trim() && 
    stripHtml(formData.options.d).trim() && 
    formData.correctOption && 
    stripHtml(formData.explanation).trim();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 font-poppins">
            {editingQuestion ? 'Edit Question' : 'Add New Question'}
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 mt-4"
        >
          {/* Question Text */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">🧠 Question Text</label>
            <div className="border border-gray-300 rounded-md">
              <Editor
                value={formData.question}
                onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                placeholder="Enter the question text with formatting..."
                containerProps={{
                  style: { minHeight: '80px', border: 'none' }
                }}
              />
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['a', 'b', 'c', 'd'].map((option) => (
              <div key={option}>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  🔢 Option {option.toUpperCase()}
                </label>
                <div className="border border-gray-300 rounded-md">
                  <Editor
                    value={formData.options[option as keyof typeof formData.options]}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      options: { ...prev.options, [option]: e.target.value }
                    }))}
                    placeholder={`Enter option ${option.toUpperCase()} with formatting...`}
                    containerProps={{
                      style: { minHeight: '60px', border: 'none' }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Correct Answer */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">✅ Correct Answer</label>
            <Select value={formData.correctOption} onValueChange={(value) => setFormData(prev => ({ ...prev, correctOption: value }))}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select the correct answer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a">Option A</SelectItem>
                <SelectItem value="b">Option B</SelectItem>
                <SelectItem value="c">Option C</SelectItem>
                <SelectItem value="d">Option D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Explanation */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">💡 Explanation</label>
            <div className="border border-gray-300 rounded-md">
              <Editor
                value={formData.explanation}
                onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Explain why this is the correct answer with formatting..."
                containerProps={{
                  style: { minHeight: '100px', border: 'none' }
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  {editingQuestion ? 'Updating...' : 'Adding...'}
                </div>
              ) : (
                editingQuestion ? 'Update Question' : 'Add Question'
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default AddQuestionForm;
