import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { 
  collection, getDocs, doc, getDoc, query, where, addDoc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { 
  Video, Calendar, Clock, Users, Play, CheckCircle, ArrowLeft, User, Globe, MapPin, School, 
  ExternalLink, Sparkles, GraduationCap, Users2, Timer, BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/badge';

interface Workshop {
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

const Workshops = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  } as const;

  const tabVariants = {
    inactive: { scale: 1, backgroundColor: "rgb(243 244 246)" },
    active: { 
      scale: 1.05,
      backgroundColor: "rgb(147 51 234)",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  } as const;

  useEffect(() => {
    if (user) {
      fetchStudentData();
    } else {
      setLoading(false);
      setError('Please log in to view personalized workshops');
      fetchWorkshops();
    }
  }, [user]);

  useEffect(() => {
    if (studentData) {
      fetchWorkshops();
    } else if (!loading && !user) {
      fetchWorkshops();
    }
  }, [studentData]);

  const fetchStudentData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const studentRef = doc(db, 'students', user.uid);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const data = studentSnap.data();
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
      setError('Error loading student data');
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

  const fetchWorkshops = async () => {
    try {
      const workshopsSnapshot = await getDocs(collection(db, 'workshops'));
      const allWorkshops: Workshop[] = [];
      workshopsSnapshot.forEach(doc => {
        const workshopData = { id: doc.id, ...doc.data() } as Workshop;
        const isActiveCheck = workshopData.isActive;
        const isStudentAudience = workshopData.audienceType === 'students';
        const isParentAudience = workshopData.audienceType === 'parents';
        const isRelevantAudience = isStudentAudience || isParentAudience;
        
        if (isActiveCheck && isRelevantAudience) {
          let shouldInclude = false;
          if (workshopData.targetType === 'all') {
            shouldInclude = true;
          } else if (!studentData) {
            shouldInclude = false;
          } else {
            const hasLocationData = studentData.state || studentData.districtCode || studentData.schoolCode;
            if (!hasLocationData) {
              shouldInclude = true;
            } else if (workshopData.targetType === 'state' && workshopData.targetStateId === studentData.state) {
              shouldInclude = true;
            } else if (workshopData.targetType === 'district' && workshopData.targetDistrictId === studentData.districtCode) {
              shouldInclude = true;
            } else if (workshopData.targetType === 'school' && workshopData.targetSchoolId === studentData.schoolCode) {
              shouldInclude = true;
            }
          }
          if (shouldInclude) {
            allWorkshops.push(workshopData);
          }
        }
      });
      allWorkshops.sort((a, b) => {
        const dateA = a.scheduledDate?.toDate ? a.scheduledDate.toDate() : new Date(a.scheduledDate);
        const dateB = b.scheduledDate?.toDate ? b.scheduledDate.toDate() : new Date(b.scheduledDate);
        return dateB.getTime() - dateA.getTime();
      });
      setWorkshops(allWorkshops);
    } catch (error) {
      setError('Error loading workshops');
    } finally {
      setLoading(false);
    }
  };

  const isWorkshopCompleted = (workshop: Workshop) => {
    if (!workshop.scheduledDate) return false;
    const scheduledDate = workshop.scheduledDate.toDate ? workshop.scheduledDate.toDate() : new Date(workshop.scheduledDate);
    return new Date() > scheduledDate;
  };

  const handleViewWorkshop = async (workshop: Workshop) => {
    try {
      if (user) {
        const viewRef = collection(db, 'workshopViews');
        await addDoc(viewRef, {
          workshopId: workshop.id,
          studentId: user.uid,
          studentName: studentData?.name || user.email,
          viewedAt: serverTimestamp(),
          completionPercentage: 0,
          totalWatchTime: 0
        });
        const workshopRef = doc(db, 'workshops', workshop.id);
        await updateDoc(workshopRef, {
          viewCount: (workshop.viewCount || 0) + 1
        });
      }
      setSelectedWorkshop(workshop);
      setShowVideoModal(true);
    } catch (error) {
      console.error('Error recording workshop view:', error);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'all':
        return <Globe className="w-4 h-4" />;
      case 'state':
        return <MapPin className="w-4 h-4" />;
      case 'district':
        return <MapPin className="w-4 h-4" />;
      case 'school':
        return <School className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getAudienceBadge = (audienceType: 'parents' | 'students') => {
    if (audienceType === 'students') {
      return (
        <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
          <GraduationCap className="w-3 h-3 mr-1" />
          For Students
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
        <Users2 className="w-3 h-3 mr-1" />
        For Parents
      </Badge>
    );
  };

  const filteredWorkshops = workshops.filter(workshop => {
    const isCompleted = isWorkshopCompleted(workshop);
    return activeTab === 'completed' ? isCompleted : !isCompleted;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <motion.div 
        className="container mx-auto px-4 py-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header Section */}
        <motion.div 
          className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4"
          variants={itemVariants}
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center"
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <BookOpen className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Mind<span className="text-purple-600">Leap</span> Workshops
              </h1>
              <p className="text-gray-600">Interactive learning sessions</p>
            </div>
          </div>

          <div className="flex gap-2 bg-white/30 backdrop-blur-sm p-1 rounded-xl">
            <motion.button
              variants={tabVariants}
              animate={activeTab === 'upcoming' ? 'active' : 'inactive'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('upcoming')}
              className="px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              style={{ color: activeTab === 'upcoming' ? 'white' : 'rgb(75 85 99)' }}
            >
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Upcoming
              </div>
            </motion.button>
            <motion.button
              variants={tabVariants}
              animate={activeTab === 'completed' ? 'active' : 'inactive'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('completed')}
              className="px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              style={{ color: activeTab === 'completed' ? 'white' : 'rgb(75 85 99)' }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Completed
              </div>
            </motion.button>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <motion.div
              className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity }
              }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <motion.p 
              className="text-lg font-semibold text-gray-700 mt-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Loading workshops...
            </motion.p>
          </div>
        ) : error ? (
          <motion.div 
            className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg"
            variants={itemVariants}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExternalLink className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
          >
            {filteredWorkshops.map((workshop) => (
              <motion.div
                key={workshop.id}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.02,
                  y: -5,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/50 shadow-lg"
              >
                <div className="relative">
                  <div className="absolute top-4 right-4 z-10">
                    {getAudienceBadge(workshop.audienceType)}
                  </div>
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-white mb-2 flex-1">
                        {workshop.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-purple-100">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">{formatDate(workshop.scheduledDate)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-600 mb-4 line-clamp-2">{workshop.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{workshop.duration} mins</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{workshop.viewCount || 0} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getTargetIcon(workshop.targetType)}
                      <span className="capitalize">{workshop.targetType}</span>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleViewWorkshop(workshop)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <Play className="w-4 h-4" />
                    {isWorkshopCompleted(workshop) ? 'Watch Recording' : 'Join Workshop'}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideoModal && selectedWorkshop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-xl"
            >
              <div className="p-6 flex justify-between items-center border-b">
                <h3 className="text-xl font-bold">{selectedWorkshop.title}</h3>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              </div>
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedWorkshop.youtubeUrl}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workshops; 