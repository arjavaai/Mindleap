
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';

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

interface ViewQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
}

const ViewQuestionModal: React.FC<ViewQuestionModalProps> = ({ isOpen, onClose, question }) => {
  const optionLabels = ['A', 'B', 'C', 'D'];
  const optionKeys = ['a', 'b', 'c', 'd'] as const;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 font-poppins">Question Details</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 mt-4"
        >
          {/* Question */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Question:</h3>
            <p className="text-gray-700">{question.question}</p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">Options:</h3>
            {optionKeys.map((key, index) => (
              <div
                key={key}
                className={`p-3 rounded-lg border-2 transition-all ${
                  question.correctOption === key
                    ? 'bg-green-50 border-green-300 text-green-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {optionLabels[index]}. {question.options[key]}
                  </span>
                  {question.correctOption === key && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Correct Answer Label */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Correct Answer:</h3>
            <p className="text-green-700 font-medium">
              Option {question.correctOption.toUpperCase()} - {question.options[question.correctOption as keyof typeof question.options]}
            </p>
          </div>

          {/* Explanation */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Explanation:</h3>
            <p className="text-yellow-700">{question.explanation}</p>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewQuestionModal;
