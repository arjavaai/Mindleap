import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { motion } from 'framer-motion';
import { User, Trophy, Flame, Mail, Phone, School, MapPin, Calendar, Users } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface ProfileModalProps {
  studentId?: string;
  studentData?: any;
  loading?: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ studentId, studentData: propStudentData, loading: propLoading = false }) => {
  const [studentData, setStudentData] = useState<any>(propStudentData || null);
  const [loading, setLoading] = useState(propLoading);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If studentData is provided via props, use it
    if (propStudentData) {
      setStudentData(propStudentData);
      setLoading(false);
      return;
    }

    // If studentId is provided but no studentData, fetch it
    if (studentId && !propStudentData) {
      fetchStudentData();
    }
  }, [studentId, propStudentData]);

  const fetchStudentData = async () => {
    if (!studentId) return;

    setLoading(true);
    setError(null);

    try {
      // First try to get student data by user ID
      const studentDoc = await getDoc(doc(db, 'students', studentId));
      
      if (studentDoc.exists()) {
        setStudentData(studentDoc.data());
      } else {
        // If no student data found, create a basic profile
        setStudentData({
          id: studentId,
          studentId: studentId,
          name: 'Student',
          email: 'Not Available',
          totalPoints: 0,
          currentStreak: 0
        });
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
      setError('Failed to load student data');
      // Set minimal data even on error
      setStudentData({
        id: studentId,
        studentId: studentId,
        name: 'Student',
        email: 'Not Available',
        totalPoints: 0,
        currentStreak: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't render if no studentId and no studentData
  if (!studentId && !studentData) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.button
          className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white cursor-pointer border-2 border-transparent hover:border-purple-300 transition-all duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <User className="w-5 h-5" />
        </motion.button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            Student Profile
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <span className="ml-4 text-gray-600 text-lg">Loading profile...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Student ID - Highlighted */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <span className="text-purple-700 font-semibold flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Student ID
                </span>
                <span className="font-bold text-purple-800 text-lg">
                  {studentData?.studentId || studentData?.id || 'Not Available'}
                </span>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid gap-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{studentData?.name || 'Not Available'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Grade/Class</p>
                    <p className="font-medium">{studentData?.grade || studentData?.class || 'Not Available'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-sm">{studentData?.email || 'Not Available'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{studentData?.phone || studentData?.whatsappNumber || 'Not Available'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="grid gap-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Academic Information</h3>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <School className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500">School</p>
                  <p className="font-medium">{studentData?.schoolName || 'Not Available'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-500">District</p>
                    <p className="font-medium">{studentData?.districtName || 'Not Available'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-indigo-500" />
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="font-medium">{studentData?.state || 'Not Available'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievement Stats */}
            <div className="grid gap-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Achievement Stats</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                    <div>
                      <p className="text-sm text-yellow-700">Total Points</p>
                      <p className="font-bold text-xl text-yellow-800">{studentData?.totalPoints || 0}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3">
                    <Flame className="w-6 h-6 text-orange-600" />
                    <div>
                      <p className="text-sm text-orange-700">Current Streak</p>
                      <p className="font-bold text-xl text-orange-800">{studentData?.currentStreak || 0} days</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            {studentData?.parentInfo && (
              <div className="grid gap-4">
                <h3 className="font-semibold text-gray-800 border-b pb-2">Parent Information</h3>
                
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-500">Father's Name</p>
                    <p className="font-medium">{studentData.parentInfo.fatherName || 'Not Available'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Info - Development Only */}
            {process.env.NODE_ENV === 'development' && studentData && (
              <div className="mt-6 pt-4 border-t bg-gray-50 p-3 rounded text-xs">
                <div className="text-gray-600 font-semibold mb-2">Debug Information:</div>
                <div className="text-gray-500 space-y-1">
                  <div>User ID: {studentData.id || 'N/A'}</div>
                  <div>Available Data Keys: {Object.keys(studentData).join(', ')}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
