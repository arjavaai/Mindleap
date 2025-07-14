import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  Play, 
  CheckCircle,
  ArrowLeft,
  User,
  Globe,
  MapPin,
  School,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StudentHeader from '../components/StudentHeader';

interface Webinar {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  duration: number;
  scheduledDate: any;
  audienceType: 'parents' | 'students';
  targetType: 'all' | 'state' | 'district' | 'school';
  targetStateId?: string;
  targetDistrictId?: string;
  targetSchoolId?: string;
  isActive: boolean;
  viewCount?: number;
}

interface StudentData {
  name: string;
  studentId: string;
  districtCode: string;
  schoolCode: string;
  state: string;
  districtName: string;
  schoolName: string;
}

const Webinars = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    console.log('Webinars component mounted, user:', user);
    if (user) {
      fetchStudentData();
    } else {
      // If no user, still try to fetch public webinars
      setLoading(false);
      setError('Please log in to view personalized webinars');
      // Still fetch webinars that are public (targetType: 'all')
      fetchWebinars();
    }
  }, [user]);

  useEffect(() => {
    console.log('Student data changed:', studentData);
    if (studentData) {
      fetchWebinars();
    } else if (!loading && !user) {
      // If we're not loading and no user, try to fetch public webinars anyway
      fetchWebinars();
    }
  }, [studentData]);

  const fetchStudentData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching student data for user:', user.uid);
      const studentRef = doc(db, 'students', user.uid);
      const studentSnap = await getDoc(studentRef);
      
      if (studentSnap.exists()) {
        const data = studentSnap.data();
        console.log('Student data found:', data);
        setStudentData({
          name: data.name || 'Student',
          studentId: data.studentId || user.uid,
          districtCode: data.districtCode || '',
          schoolCode: data.schoolCode || '',
          state: data.state || '',
          districtName: data.districtName || '',
          schoolName: data.schoolName || ''
        });
      } else {
        console.log('No student data found, creating default data');
        // Create default student data if none exists
        const defaultData = {
          name: user.email?.split('@')[0] || 'Student',
          studentId: user.uid,
          districtCode: '',
          schoolCode: '',
          state: '',
          districtName: '',
          schoolName: ''
        };
        setStudentData(defaultData);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      setError('Error loading student data');
      // Set default data even on error
      setStudentData({
        name: user.email?.split('@')[0] || 'Student',
        studentId: user.uid,
        districtCode: '',
        schoolCode: '',
        state: '',
        districtName: '',
        schoolName: ''
      });
    }
  };

  const fetchWebinars = async () => {
    try {
      console.log('Fetching webinars...');
      console.log('Current student data:', studentData);
      const webinarsSnapshot = await getDocs(collection(db, 'webinars'));
      const allWebinars: Webinar[] = [];
      
      console.log('Found webinars:', webinarsSnapshot.size);
      
      webinarsSnapshot.forEach(doc => {
        const webinarData = { id: doc.id, ...doc.data() } as Webinar;
        console.log('Processing webinar:', webinarData.title);
        console.log('Webinar details:', {
          title: webinarData.title,
          isActive: webinarData.isActive,
          audienceType: webinarData.audienceType,
          targetType: webinarData.targetType,
          targetStateId: webinarData.targetStateId,
          targetDistrictId: webinarData.targetDistrictId,
          targetSchoolId: webinarData.targetSchoolId
        });
        
        // Check each filter condition
        const isActiveCheck = webinarData.isActive;
        const isStudentAudience = webinarData.audienceType === 'students';
        const isParentAudience = webinarData.audienceType === 'parents';
        const isRelevantAudience = isStudentAudience || isParentAudience; // Students can see both types
        
        console.log('Filter checks:', {
          isActive: isActiveCheck,
          isStudentAudience: isStudentAudience,
          isParentAudience: isParentAudience,
          isRelevantAudience: isRelevantAudience,
          targetType: webinarData.targetType
        });
        
        if (isActiveCheck && isRelevantAudience) {
          let shouldInclude = false;
          let reason = '';
          
          if (webinarData.targetType === 'all') {
            shouldInclude = true;
            reason = 'Target type is "all"';
          } else if (!studentData) {
            // If no student data, only show 'all' webinars
            shouldInclude = false;
            reason = 'No student data available';
          } else {
            // Check location-based targeting
            const hasLocationData = studentData.state || studentData.districtCode || studentData.schoolCode;
            
            if (!hasLocationData) {
              // If student has no location data, show all webinars as fallback
              // This helps students who haven't completed their profile
              shouldInclude = true;
              reason = 'Student has no location data - showing all webinars as fallback';
            } else if (webinarData.targetType === 'state' && webinarData.targetStateId === studentData.state) {
              shouldInclude = true;
              reason = `State match: ${webinarData.targetStateId} === ${studentData.state}`;
            } else if (webinarData.targetType === 'district' && webinarData.targetDistrictId === studentData.districtCode) {
              shouldInclude = true;
              reason = `District match: ${webinarData.targetDistrictId} === ${studentData.districtCode}`;
            } else if (webinarData.targetType === 'school' && webinarData.targetSchoolId === studentData.schoolCode) {
              shouldInclude = true;
              reason = `School match: ${webinarData.targetSchoolId} === ${studentData.schoolCode}`;
            } else {
              shouldInclude = false;
              reason = `No location match - Target: ${webinarData.targetType}, Student: ${JSON.stringify({
                state: studentData?.state,
                districtCode: studentData?.districtCode,
                schoolCode: studentData?.schoolCode
              })}`;
            }
          }
          
          console.log(`Webinar "${webinarData.title}" - Include: ${shouldInclude}, Reason: ${reason}`);
          
          if (shouldInclude) {
            allWebinars.push(webinarData);
          }
        } else {
          console.log(`Webinar "${webinarData.title}" filtered out - Active: ${isActiveCheck}, Student audience: ${isStudentAudience}`);
        }
      });

      // Sort by scheduled date
      allWebinars.sort((a, b) => {
        const dateA = a.scheduledDate?.toDate() || new Date(0);
        const dateB = b.scheduledDate?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      console.log('Final filtered webinars for student:', allWebinars);
      setWebinars(allWebinars);
    } catch (error) {
      console.error('Error fetching webinars:', error);
      setError('Error loading webinars');
    } finally {
      setLoading(false);
    }
  };

  const isWebinarCompleted = (webinar: Webinar) => {
    if (!webinar.scheduledDate) return false;
    const scheduledDate = webinar.scheduledDate.toDate ? webinar.scheduledDate.toDate() : new Date(webinar.scheduledDate);
    return new Date() > scheduledDate;
  };

  const handleViewWebinar = async (webinar: Webinar) => {
    setSelectedWebinar(webinar);
    setShowVideoModal(true);

    // Record the view
    try {
      await addDoc(collection(db, 'webinarViews'), {
        webinarId: webinar.id,
        studentId: studentData?.studentId || user?.uid,
        studentName: studentData?.name || 'Unknown',
        viewedAt: serverTimestamp(),
        completionPercentage: 0,
        totalWatchTime: 0
      });

      // Update webinar view count
      await updateDoc(doc(db, 'webinars', webinar.id), {
        viewCount: (webinar.viewCount || 0) + 1
      });
    } catch (error) {
      console.error('Error recording webinar view:', error);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'Not scheduled';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'all': return <Globe className="w-4 h-4" />;
      case 'state': return <MapPin className="w-4 h-4" />;
      case 'district': return <MapPin className="w-4 h-4" />;
      case 'school': return <School className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const upcomingWebinars = webinars.filter(w => !isWebinarCompleted(w));
  const completedWebinars = webinars.filter(w => isWebinarCompleted(w));

  // Test function to show raw Firebase data
  const testFirebaseConnection = async () => {
    try {
      console.log('Testing Firebase connection...');
      const webinarsSnapshot = await getDocs(collection(db, 'webinars'));
      const rawWebinars: any[] = [];
      
      webinarsSnapshot.forEach(doc => {
        const data = doc.data();
        rawWebinars.push({ id: doc.id, ...data });
      });
      
      console.log('Raw webinars from Firebase:', rawWebinars);
      alert(`Found ${rawWebinars.length} webinars in Firebase. Check console for details.`);
      
      // Show a summary in alert
      const summary = rawWebinars.map(w => `${w.title} (Active: ${w.isActive}, Target: ${w.targetType}, Audience: ${w.audienceType})`).join('\n');
      console.log('Webinar Summary:\n', summary);
    } catch (error) {
      console.error('Firebase test error:', error);
      alert('Firebase connection failed. Check console for details.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading webinars...</p>
        </div>
      </div>
    );
  }

  // Show error message if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Webinars</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                if (user) {
                  fetchStudentData();
                } else {
                  navigate('/auth');
                }
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
      {/* Header */}
      <StudentHeader backTo="/dashboard" />

      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-1 shadow-lg">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'upcoming'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Upcoming ({upcomingWebinars.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'completed'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Completed ({completedWebinars.length})
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Webinars Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {(activeTab === 'upcoming' ? upcomingWebinars : completedWebinars).map((webinar, index) => {
              const isWebinarStarted = () => {
                if (!webinar.scheduledDate) return false;
                const scheduledDate = webinar.scheduledDate.toDate ? webinar.scheduledDate.toDate() : new Date(webinar.scheduledDate);
                return new Date() >= scheduledDate;
              };

              const canWatch = isWebinarCompleted(webinar) || isWebinarStarted();

              return (
                <motion.div
                  key={webinar.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.05,
                    y: -10,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                  }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 hover:border-purple-200 transition-all duration-300 cursor-pointer group"
                  onClick={() => canWatch && handleViewWebinar(webinar)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getTargetIcon(webinar.targetType)}
                      <span className="text-xs text-gray-500 capitalize">{webinar.targetType}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isWebinarCompleted(webinar)
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-green-100 text-green-600'
                      }`}>
                        {isWebinarCompleted(webinar) ? 'Completed' : 'Upcoming'}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        webinar.audienceType === 'students' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-purple-100 text-purple-600'
                      }`}>
                        For {webinar.audienceType === 'students' ? 'Students' : 'Parents'}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {webinar.title}
                  </h3>
                  
                  {webinar.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {webinar.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(webinar.scheduledDate)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {webinar.duration} minutes
                    </div>
                    {webinar.viewCount && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        {webinar.viewCount} views
                      </div>
                    )}
                  </div>

                  <button 
                    disabled={!canWatch}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all duration-300 ${
                      canWatch
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 group-hover:scale-105'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    {canWatch ? 'Watch Webinar' : 'Available Soon'}
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {(activeTab === 'upcoming' ? upcomingWebinars : completedWebinars).length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Video className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {activeTab} webinars
            </h3>
            <p className="text-gray-600">
              {activeTab === 'upcoming' 
                ? 'Check back later for new webinars!' 
                : 'Complete some webinars to see them here.'}
            </p>
          </motion.div>
        )}
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && selectedWebinar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedWebinar.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedWebinar.scheduledDate)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedWebinar.duration} minutes
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowVideoModal(false);
                      setSelectedWebinar(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {selectedWebinar.description && (
                  <p className="text-gray-700 mb-6">{selectedWebinar.description}</p>
                )}
                
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    src={selectedWebinar.youtubeUrl.replace('watch?v=', 'embed/')}
                    title={selectedWebinar.title}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <button
                    onClick={() => window.open(selectedWebinar.youtubeUrl, '_blank')}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in YouTube
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowVideoModal(false);
                      setSelectedWebinar(null);
                    }}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Webinars; 