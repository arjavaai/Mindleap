import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  Users, 
  School, 
  MapPin,
  Globe,
  Video,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  BarChart3,
  Download,
  Play,
  Pause,
  User
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Webinar {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  duration: number; // in minutes
  scheduledDate: any;
  audienceType: 'parents' | 'students';
  targetType: 'all' | 'state' | 'district' | 'school';
  targetStateId?: string;
  targetDistrictId?: string;
  targetSchoolId?: string;
  isActive: boolean;
  createdAt: any;
  createdBy: string;
  viewCount?: number;
  completedCount?: number;
}

interface WebinarView {
  id: string;
  webinarId: string;
  studentId: string;
  studentName: string;
  viewedAt: any;
  completionPercentage: number;
  totalWatchTime: number; // in seconds
}

interface State {
  id: string;
  stateName: string;
  stateCode: string;
  districts: District[];
}

interface District {
  districtName: string;
  districtCode: string;
}

interface School {
  id: string;
  name: string;
  schoolCode: string;
  districtCode: string;
  districtName: string;
  state: string;
}

const WebinarManagementTab = () => {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);
  const [webinarViews, setWebinarViews] = useState<WebinarView[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState<Webinar | null>(null);

  // Form states
  const [webinarData, setWebinarData] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    duration: 60,
    scheduledDate: '',
    scheduledTime: '',
    audienceType: 'students' as 'parents' | 'students',
    targetType: 'all' as 'all' | 'state' | 'district' | 'school',
    targetStateId: '',
    targetDistrictId: '',
    targetSchoolId: '',
    isActive: true
  });

  useEffect(() => {
    fetchWebinars();
    fetchStates();
  }, []);

  const fetchWebinars = async () => {
    try {
      const webinarsSnapshot = await getDocs(collection(db, 'webinars'));
      const webinarsData: Webinar[] = [];
      webinarsSnapshot.forEach(doc => {
        webinarsData.push({ id: doc.id, ...doc.data() } as Webinar);
      });
      // Sort by scheduled date (newest first)
      webinarsData.sort((a, b) => {
        const dateA = a.scheduledDate?.toDate() || new Date(0);
        const dateB = b.scheduledDate?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setWebinars(webinarsData);
    } catch (error) {
      console.error('Error fetching webinars:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const statesSnapshot = await getDocs(collection(db, 'states'));
      const statesData: State[] = [];
      
      statesSnapshot.forEach(stateDoc => {
        const data = stateDoc.data();
        statesData.push({
          id: stateDoc.id,
          stateName: data.stateName || '',
          stateCode: data.stateCode || '',
          districts: data.districts || []
        });
      });
      
      // Fetch schools separately
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      const schoolsData: School[] = [];
      schoolsSnapshot.forEach(schoolDoc => {
        schoolsData.push({ id: schoolDoc.id, ...schoolDoc.data() } as School);
      });
      
      // Organize schools by district
      statesData.forEach(state => {
        state.districts.forEach(district => {
          (district as any).schools = schoolsData.filter(school => 
            school.districtCode === district.districtCode && 
            school.state === state.stateName
          );
        });
      });
      
      setStates(statesData);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const resetForm = () => {
    setWebinarData({
      title: '',
      description: '',
      youtubeUrl: '',
      duration: 60,
      scheduledDate: '',
      scheduledTime: '',
      audienceType: 'students',
      targetType: 'all',
      targetStateId: '',
      targetDistrictId: '',
      targetSchoolId: '',
      isActive: true
    });
    setEditingWebinar(null);
  };

  const handleEditWebinar = (webinar: Webinar) => {
    setEditingWebinar(webinar);
    const scheduledDate = webinar.scheduledDate?.toDate();
    setWebinarData({
      title: webinar.title,
      description: webinar.description,
      youtubeUrl: webinar.youtubeUrl,
      duration: webinar.duration,
      scheduledDate: scheduledDate ? scheduledDate.toISOString().split('T')[0] : '',
      scheduledTime: scheduledDate ? scheduledDate.toTimeString().slice(0, 5) : '',
      audienceType: webinar.audienceType,
      targetType: webinar.targetType,
      targetStateId: webinar.targetStateId || '',
      targetDistrictId: webinar.targetDistrictId || '',
      targetSchoolId: webinar.targetSchoolId || '',
      isActive: webinar.isActive
    });
    setShowCreateModal(true);
  };

  const handleCreateWebinar = async () => {
    if (!webinarData.title || !webinarData.youtubeUrl || !webinarData.scheduledDate) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const scheduledDateTime = new Date(`${webinarData.scheduledDate}T${webinarData.scheduledTime || '00:00'}`);
      
      const webinarPayload = {
        title: webinarData.title,
        description: webinarData.description,
        youtubeUrl: webinarData.youtubeUrl,
        duration: webinarData.duration,
        scheduledDate: scheduledDateTime,
        audienceType: webinarData.audienceType,
        targetType: webinarData.targetType,
        ...(webinarData.targetStateId && { targetStateId: webinarData.targetStateId }),
        ...(webinarData.targetDistrictId && { targetDistrictId: webinarData.targetDistrictId }),
        ...(webinarData.targetSchoolId && { targetSchoolId: webinarData.targetSchoolId }),
        isActive: webinarData.isActive,
        viewCount: 0,
        completedCount: 0,
        ...(editingWebinar ? { updatedAt: new Date() } : { createdAt: new Date() }),
        createdBy: 'admin'
      };

      if (editingWebinar) {
        await updateDoc(doc(db, 'webinars', editingWebinar.id), webinarPayload);
      } else {
        await addDoc(collection(db, 'webinars'), webinarPayload);
      }

      await fetchWebinars();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving webinar:', error);
      alert('Error saving webinar. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWebinar = async (webinarId: string) => {
    if (!confirm('Are you sure you want to delete this webinar?')) return;

    try {
      await deleteDoc(doc(db, 'webinars', webinarId));
      await fetchWebinars();
    } catch (error) {
      console.error('Error deleting webinar:', error);
      alert('Error deleting webinar');
    }
  };

  const fetchWebinarStats = async (webinar: Webinar) => {
    setLoadingStats(true);
    setSelectedWebinar(webinar);
    setShowStatsModal(true);

    try {
      const viewsSnapshot = await getDocs(
        query(collection(db, 'webinarViews'), where('webinarId', '==', webinar.id))
      );
      
      const viewsData: WebinarView[] = [];
      viewsSnapshot.forEach(doc => {
        viewsData.push({ id: doc.id, ...doc.data() } as WebinarView);
      });
      
      setWebinarViews(viewsData);
    } catch (error) {
      console.error('Error fetching webinar stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const exportStatsToCSV = () => {
    if (!webinarViews.length || !selectedWebinar) return;

    const headers = [
      'Student Name',
      'Student ID',
      'Viewed At',
      'Completion %',
      'Watch Time (mins)'
    ];

    const csvData = webinarViews.map(view => [
      view.studentName,
      view.studentId,
      view.viewedAt ? new Date(view.viewedAt.toDate()).toLocaleString() : 'Unknown',
      `${view.completionPercentage}%`,
      Math.round(view.totalWatchTime / 60)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedWebinar.title}_stats.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSelectedDistricts = () => {
    const selectedState = states.find(s => s.id === webinarData.targetStateId);
    return selectedState?.districts || [];
  };

  const getSelectedSchools = () => {
    const selectedDistrict = getSelectedDistricts().find(d => d.districtCode === webinarData.targetDistrictId);
    return (selectedDistrict as any)?.schools || [];
  };

  const formatDate = (date: any) => {
    if (!date) return 'Not scheduled';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
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

  const isWebinarCompleted = (webinar: Webinar) => {
    if (!webinar.scheduledDate) return false;
    const scheduledDate = webinar.scheduledDate.toDate ? webinar.scheduledDate.toDate() : new Date(webinar.scheduledDate);
    return new Date() > scheduledDate;
  };

  const upcomingWebinars = webinars.filter(w => !isWebinarCompleted(w));
  const completedWebinars = webinars.filter(w => isWebinarCompleted(w));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">Loading webinars...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Video className="w-8 h-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Live Webinars Management</h2>
            <p className="text-gray-600">Create and manage webinars for students and parents</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Webinar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600">Upcoming</p>
              <p className="text-2xl font-bold text-blue-800">{upcomingWebinars.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-800">{completedWebinars.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Webinars Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Webinars</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Webinar Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Audience
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {webinars.map((webinar) => (
                <tr key={webinar.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{webinar.title}</div>
                      <div className="text-sm text-gray-500">{webinar.duration} minutes</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      webinar.audienceType === 'students' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {webinar.audienceType === 'students' ? 'Students' : 'Parents'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getTargetIcon(webinar.targetType)}
                      <span className="text-sm text-gray-900 capitalize">{webinar.targetType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(webinar.scheduledDate)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      isWebinarCompleted(webinar)
                        ? 'bg-gray-100 text-gray-800'
                        : webinar.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {isWebinarCompleted(webinar) 
                        ? 'Completed' 
                        : webinar.isActive 
                          ? 'Active' 
                          : 'Inactive'
                      }
                    </span>
                  </td>
                   <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditWebinar(webinar)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit Webinar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => window.open(webinar.youtubeUrl, '_blank')}
                        className="text-purple-600 hover:text-purple-900 p-1"
                        title="View Webinar"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteWebinar(webinar.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Webinar Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editingWebinar ? 'Edit Webinar' : 'Create New Webinar'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webinar Title *
                    </label>
                    <input
                      type="text"
                      value={webinarData.title}
                      onChange={(e) => setWebinarData({ ...webinarData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter webinar title"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={webinarData.description}
                      onChange={(e) => setWebinarData({ ...webinarData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter webinar description"
                    />
                  </div>

                  {/* YouTube URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      YouTube URL *
                    </label>
                    <input
                      type="url"
                      value={webinarData.youtubeUrl}
                      onChange={(e) => setWebinarData({ ...webinarData, youtubeUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </div>

                  {/* Duration and Date/Time */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={webinarData.duration}
                        onChange={(e) => setWebinarData({ ...webinarData, duration: parseInt(e.target.value) || 60 })}
                        min="1"
                        max="300"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={webinarData.scheduledDate}
                        onChange={(e) => setWebinarData({ ...webinarData, scheduledDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        value={webinarData.scheduledTime}
                        onChange={(e) => setWebinarData({ ...webinarData, scheduledTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Audience Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Audience Type *
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'students', label: 'Students' },
                        { value: 'parents', label: 'Parents' }
                      ].map(({ value, label }) => (
                        <label key={value} className="flex items-center">
                          <input
                            type="radio"
                            name="audienceType"
                            value={value}
                            checked={webinarData.audienceType === value}
                            onChange={(e) => setWebinarData({ 
                              ...webinarData, 
                              audienceType: e.target.value as 'parents' | 'students'
                            })}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Target Audience */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Audience *
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'all', label: 'All Users', icon: Globe },
                        { value: 'state', label: 'Specific State', icon: MapPin },
                        { value: 'district', label: 'Specific District', icon: MapPin },
                        { value: 'school', label: 'Specific School', icon: School }
                      ].map(({ value, label, icon: Icon }) => (
                        <label key={value} className="flex items-center">
                          <input
                            type="radio"
                            name="targetType"
                            value={value}
                            checked={webinarData.targetType === value}
                            onChange={(e) => setWebinarData({ 
                              ...webinarData, 
                              targetType: e.target.value as any,
                              targetStateId: '',
                              targetDistrictId: '',
                              targetSchoolId: ''
                            })}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                          />
                          <Icon className="w-4 h-4 ml-2 mr-2 text-gray-500" />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* State Selection */}
                  {(webinarData.targetType === 'state' || webinarData.targetType === 'district' || webinarData.targetType === 'school') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select State
                      </label>
                      <select
                        value={webinarData.targetStateId}
                        onChange={(e) => setWebinarData({ 
                          ...webinarData, 
                          targetStateId: e.target.value,
                          targetDistrictId: '',
                          targetSchoolId: ''
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select State</option>
                        {states.map(state => (
                          <option key={state.id} value={state.id}>
                            {state.stateName} ({state.stateCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* District Selection */}
                  {(webinarData.targetType === 'district' || webinarData.targetType === 'school') && webinarData.targetStateId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select District
                      </label>
                      <select
                        value={webinarData.targetDistrictId}
                        onChange={(e) => setWebinarData({ 
                          ...webinarData, 
                          targetDistrictId: e.target.value,
                          targetSchoolId: ''
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select District</option>
                        {getSelectedDistricts().map(district => (
                          <option key={district.districtCode} value={district.districtCode}>
                            {district.districtName} ({district.districtCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* School Selection */}
                  {webinarData.targetType === 'school' && webinarData.targetDistrictId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select School
                      </label>
                      <select
                        value={webinarData.targetSchoolId}
                        onChange={(e) => setWebinarData({ 
                          ...webinarData, 
                          targetSchoolId: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select School</option>
                        {getSelectedSchools().map(school => (
                          <option key={school.id} value={school.id}>
                            {school.name} ({school.schoolCode})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Active Status */}
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={webinarData.isActive}
                        onChange={(e) => setWebinarData({ ...webinarData, isActive: e.target.checked })}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active (visible to students)</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateWebinar}
                    disabled={submitting}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {submitting 
                      ? (editingWebinar ? 'Updating...' : 'Creating...') 
                      : (editingWebinar ? 'Update Webinar' : 'Create Webinar')
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Modal */}
      <AnimatePresence>
        {showStatsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Webinar Statistics: {selectedWebinar?.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {webinarViews.length} total views
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={exportStatsToCSV}
                      disabled={!webinarViews.length}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        setShowStatsModal(false);
                        setSelectedWebinar(null);
                        setWebinarViews([]);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {loadingStats ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600">Loading statistics...</span>
                  </div>
                ) : webinarViews.length === 0 ? (
                  <div className="text-center py-12">
                    <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Views Yet</h3>
                    <p className="text-gray-600">No students have viewed this webinar yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Viewed At
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Completion
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Watch Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {webinarViews.map((view, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <User className="w-5 h-5 text-gray-400 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {view.studentName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {view.studentId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {view.viewedAt ? new Date(view.viewedAt.toDate()).toLocaleString() : 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full" 
                                    style={{ width: `${view.completionPercentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-900">{view.completionPercentage}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {Math.round(view.totalWatchTime / 60)} minutes
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WebinarManagementTab; 