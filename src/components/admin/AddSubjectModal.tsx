
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (subjectName: string, scheduledDay: string) => void;
  isLoading: boolean;
}

const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isLoading
}) => {
  const [subjectName, setSubjectName] = useState('');
  const [scheduledDay, setScheduledDay] = useState('');

  const dayOptions = [
    'Monday',
    'Tuesday', 
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];

  const handleSubmit = () => {
    if (!subjectName.trim() || !scheduledDay) return;
    onAdd(subjectName, scheduledDay);
    setSubjectName('');
    setScheduledDay('');
  };

  const handleClose = () => {
    setSubjectName('');
    setScheduledDay('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 font-poppins">Add New Subject</DialogTitle>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 mt-4"
        >
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Subject Name</label>
            <Input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Enter subject name (e.g., Mathematics, Science, English)"
              className="h-12"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Scheduled Day</label>
            <Select value={scheduledDay} onValueChange={setScheduledDay}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select the day for this subject" />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              disabled={isLoading || !subjectName.trim() || !scheduledDay}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Adding...
                </div>
              ) : (
                'Add Subject'
              )}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubjectModal;
