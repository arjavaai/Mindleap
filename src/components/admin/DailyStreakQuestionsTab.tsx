import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, BookOpen, Eye, Edit, Trash2, Calendar, Shield } from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAdminPermissions } from './AdminContext';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { useToast } from '@/hooks/use-toast';
import AddSubjectModal from './AddSubjectModal';
import QuestionManagementScreen from './QuestionManagementScreen';
import FirebaseDebugger from './FirebaseDebugger';

interface Subject {
  id: string;
  name: string;
  scheduledDay: string;
  createdAt: string;
}

const DailyStreakQuestionsTab = () => {
  const { canDelete } = useAdminPermissions();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showQuestionManagement, setShowQuestionManagement] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addedSubject, setAddedSubject] = useState<Subject | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    console.log('🔍 Fetching subjects from Firebase...');
    try {
      const q = query(collection(db, 'subjects'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      console.log('📊 Subjects query result - docs found:', querySnapshot.size);
      
      const subjectsList: Subject[] = [];
      querySnapshot.forEach((doc) => {
        console.log('📚 Subject found:', doc.id, doc.data());
        subjectsList.push({ id: doc.id, ...doc.data() } as Subject);
      });
      
      console.log('✅ Total subjects loaded:', subjectsList.length);
      setSubjects(subjectsList);
    } catch (error) {
      console.error('❌ Error fetching subjects:', error);
      toast({
        title: "Error",
        description: `Failed to fetch subjects: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleAddSubject = async (subjectName: string, scheduledDay: string) => {
    setIsLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'subjects'), {
        name: subjectName.trim(),
        scheduledDay: scheduledDay,
        createdAt: new Date().toISOString()
      });

      const newSubject = {
        id: docRef.id,
        name: subjectName.trim(),
        scheduledDay: scheduledDay,
        createdAt: new Date().toISOString()
      };

      setSubjects(prev => [...prev, newSubject].sort((a, b) => a.name.localeCompare(b.name)));
      setIsAddSubjectModalOpen(false);
      setAddedSubject(newSubject);
      setShowSuccessModal(true);

      toast({
        title: "Success! ✅",
        description: "Subject added successfully",
      });
    } catch (error) {
      console.error('Error adding subject:', error);
      toast({
        title: "Error",
        description: "Failed to add subject",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!canDelete) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete subjects. Only the main administrator can perform delete operations.",
        variant: "destructive"
      });
      return;
    }

    try {
      await deleteDoc(doc(db, 'subjects', subjectId));
      setSubjects(prev => prev.filter(subject => subject.id !== subjectId));
      toast({
        title: "Success",
        description: "Subject deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Error",
        description: "Failed to delete subject",
        variant: "destructive"
      });
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setIsAddSubjectModalOpen(true);
  };

  const handleUpdateSubject = async (subjectName: string, scheduledDay: string) => {
    if (!editingSubject) return;
    
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'subjects', editingSubject.id), {
        name: subjectName.trim(),
        scheduledDay: scheduledDay,
      });

      setSubjects(prev => 
        prev.map(subject => 
          subject.id === editingSubject.id 
            ? { ...subject, name: subjectName.trim(), scheduledDay: scheduledDay }
            : subject
        ).sort((a, b) => a.name.localeCompare(b.name))
      );
      
      setIsAddSubjectModalOpen(false);
      setEditingSubject(null);

      toast({
        title: "Success! ✅",
        description: "Subject updated successfully",
      });
    } catch (error) {
      console.error('Error updating subject:', error);
      toast({
        title: "Error",
        description: "Failed to update subject",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenQuestions = (subject: Subject) => {
    console.log('🎯 Opening questions for subject:', subject.id, subject.name);
    setSelectedSubject(subject);
    setShowQuestionManagement(true);
    console.log('📂 Question management screen should be open now. Selected subject:', subject);
  };

  const getDayColor = (day: string) => {
    const colors = {
      'Monday': 'bg-red-100 text-red-800',
      'Tuesday': 'bg-blue-100 text-blue-800',
      'Wednesday': 'bg-green-100 text-green-800',
      'Thursday': 'bg-yellow-100 text-yellow-800',
      'Friday': 'bg-purple-100 text-purple-800',
      'Saturday': 'bg-pink-100 text-pink-800'
    };
    return colors[day as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // If question management is open, show the separate screen
  if (showQuestionManagement && selectedSubject) {
    return (
      <QuestionManagementScreen
        subject={selectedSubject}
        onBack={() => {
          setShowQuestionManagement(false);
          setSelectedSubject(null);
        }}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 font-poppins">Streak Scheduler</h2>
          <p className="text-gray-600 mt-1">Manage subjects and their scheduled days for daily streak challenges</p>
        </div>
        <Button
          onClick={() => setIsAddSubjectModalOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Subject
        </Button>
      </div>

      {/* Firebase Debugger */}
      <div className="mb-8">
        <FirebaseDebugger />
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Subjects Added Yet</h3>
            <p className="text-gray-500">Click "Add Subject" to get started</p>
          </div>
        ) : (
          subjects.map((subject, index) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-br from-orange-50 to-blue-50 p-6 rounded-xl border border-orange-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditSubject(subject)}
                    className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(subject.id)}
                    className={`p-2 ${canDelete 
                      ? 'text-red-500 hover:bg-red-100' 
                      : 'text-gray-400 cursor-not-allowed opacity-50'
                    } rounded-lg transition-colors`}
                    disabled={!canDelete}
                    title={canDelete ? "Delete subject" : "Permission Denied - Only main admin can delete"}
                  >
                    {canDelete ? <Trash2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-3">{subject.name}</h3>
              
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDayColor(subject.scheduledDay)}`}>
                  {subject.scheduledDay}
                </span>
              </div>
              
              <Button
                onClick={() => handleOpenQuestions(subject)}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Questions
              </Button>
            </motion.div>
          ))
        )}
      </div>

      {/* Add Subject Modal */}
      <AddSubjectModal
        isOpen={isAddSubjectModalOpen}
        onClose={() => {
          setIsAddSubjectModalOpen(false);
          setEditingSubject(null);
        }}
        onAdd={editingSubject ? handleUpdateSubject : handleAddSubject}
        isLoading={isLoading}
        editingSubject={editingSubject}
      />

      {/* Success Confirmation Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-green-800">
              ✅ Subject Added Successfully!
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">
              <strong>{addedSubject?.name}</strong> has been scheduled for <strong>{addedSubject?.scheduledDay}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Students will receive questions from this subject every {addedSubject?.scheduledDay}.
            </p>
          </div>
          
          <div className="flex justify-center">
            <Button onClick={() => setShowSuccessModal(false)}>
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default DailyStreakQuestionsTab;
