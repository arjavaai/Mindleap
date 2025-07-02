import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Eye, Clock, Users, School, MapPin, Globe, Video, Calendar, CheckCircle, XCircle, ArrowRight, ArrowLeft, ExternalLink, BarChart3, Download, Play, Pause, User
} from 'lucide-react';
import { 
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Workshop {
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

interface WorkshopView {
  id: string;
  workshopId: string;
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

const WorkshopManagementTab = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [workshopViews, setWorkshopViews] = useState<WorkshopView[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);

  // Form states
  const [workshopData, setWorkshopData] = useState({
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
    fetchWorkshops();
    fetchStates();
  }, []);

  const fetchWorkshops = async () => {
    try {
      const workshopsSnapshot = await getDocs(collection(db, 'workshops'));
      const workshopsData: Workshop[] = [];
      workshopsSnapshot.forEach(doc => {
        workshopsData.push({ id: doc.id, ...doc.data() } as Workshop);
      });
      // Sort by scheduled date (newest first)
      workshopsData.sort((a, b) => {
        const dateA = a.scheduledDate?.toDate() || new Date(0);
        const dateB = b.scheduledDate?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setWorkshops(workshopsData);
    } catch (error) {
      console.error('Error fetching workshops:', error);
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
    setWorkshopData({
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
    setEditingWorkshop(null);
  };

  const handleEditWorkshop = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    const scheduledDate = workshop.scheduledDate?.toDate();
    setWorkshopData({
      title: workshop.title,
      description: workshop.description,
      youtubeUrl: workshop.youtubeUrl,
      duration: workshop.duration,
      scheduledDate: scheduledDate ? scheduledDate.toISOString().split('T')[0] : '',
      scheduledTime: scheduledDate ? scheduledDate.toTimeString().slice(0, 5) : '',
      audienceType: workshop.audienceType,
      targetType: workshop.targetType,
      targetStateId: workshop.targetStateId || '',
      targetDistrictId: workshop.targetDistrictId || '',
      targetSchoolId: workshop.targetSchoolId || '',
      isActive: workshop.isActive
    });
    setShowCreateModal(true);
  };

  const handleCreateWorkshop = async () => {
    if (!workshopData.title || !workshopData.youtubeUrl || !workshopData.scheduledDate) {
      alert('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const scheduledDateTime = new Date(`${workshopData.scheduledDate}T${workshopData.scheduledTime || '00:00'}`);
      const workshopPayload = {
        title: workshopData.title,
        description: workshopData.description,
        youtubeUrl: workshopData.youtubeUrl,
        duration: workshopData.duration,
        scheduledDate: scheduledDateTime,
        audienceType: workshopData.audienceType,
        targetType: workshopData.targetType,
        ...(workshopData.targetStateId && { targetStateId: workshopData.targetStateId }),
        ...(workshopData.targetDistrictId && { targetDistrictId: workshopData.targetDistrictId }),
        ...(workshopData.targetSchoolId && { targetSchoolId: workshopData.targetSchoolId }),
        isActive: workshopData.isActive,
        viewCount: 0,
        completedCount: 0,
        ...(editingWorkshop ? { updatedAt: new Date() } : { createdAt: new Date() }),
        createdBy: 'admin'
      };
      if (editingWorkshop) {
        await updateDoc(doc(db, 'workshops', editingWorkshop.id), workshopPayload);
      } else {
        await addDoc(collection(db, 'workshops'), workshopPayload);
      }
      resetForm();
      setShowCreateModal(false);
      fetchWorkshops();
    } catch (error) {
      console.error('Error saving workshop:', error);
      alert('Error saving workshop. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorkshop = async (workshopId: string) => {
    if (!confirm('Are you sure you want to delete this workshop?')) return;
    setSubmitting(true);
    try {
      await deleteDoc(doc(db, 'workshops', workshopId));
      fetchWorkshops();
    } catch (error) {
      console.error('Error deleting workshop:', error);
      alert('Error deleting workshop');
    } finally {
      setSubmitting(false);
    }
  };

  const fetchWorkshopStats = async (workshop: Workshop) => {
    setLoadingStats(true);
    setSelectedWorkshop(workshop);
    try {
      const viewsSnapshot = await getDocs(query(collection(db, 'workshopViews'), where('workshopId', '==', workshop.id)));
      const viewsData: WorkshopView[] = [];
      viewsSnapshot.forEach(doc => {
        viewsData.push({ id: doc.id, ...doc.data() } as WorkshopView);
      });
      setWorkshopViews(viewsData);
    } catch (error) {
      console.error('Error fetching workshop stats:', error);
    } finally {
      setLoadingStats(false);
      setShowStatsModal(true);
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

  const isWorkshopCompleted = (workshop: Workshop) => {
    if (!workshop.scheduledDate) return false;
    const scheduledDate = workshop.scheduledDate.toDate ? workshop.scheduledDate.toDate() : new Date(workshop.scheduledDate);
    return new Date() > scheduledDate;
  };

  const getSelectedDistricts = () => {
    const selectedState = states.find(s => s.id === workshopData.targetStateId);
    return selectedState?.districts || [];
  };

  const getSelectedSchools = () => {
    const selectedDistrict = getSelectedDistricts().find(d => d.districtCode === workshopData.targetDistrictId);
    return (selectedDistrict as any)?.schools || [];
  };

  const exportStatsToCSV = () => {
    if (!selectedWorkshop || !workshopViews.length) return;
    
    const headers = ['Student Name', 'View Date', 'Watch Time (minutes)', 'Completion %'];
    const rows = workshopViews.map(view => [
      view.studentName,
      formatDate(view.viewedAt),
      Math.round(view.totalWatchTime / 60),
      view.completionPercentage
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `workshop_stats_${selectedWorkshop.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Workshop Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors"
          disabled={submitting}
        >
          <Plus className="w-5 h-5" />
          Create Workshop
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : workshops.length === 0 ? (
        <div className="text-center py-12">
          <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No workshops yet</h3>
          <p className="text-gray-500">Create your first workshop to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {workshops.map(workshop => (
            <div
              key={workshop.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{workshop.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                      {workshop.description}
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(workshop.scheduledDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {workshop.duration} minutes
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="w-4 h-4 mr-1" />
                        {workshop.audienceType === 'students' ? 'For Students' : 'For Parents'}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        {getTargetIcon(workshop.targetType)}
                        <span className="ml-1">
                          {workshop.targetType === 'all'
                            ? 'Available to All'
                            : `${workshop.targetType.charAt(0).toUpperCase() + workshop.targetType.slice(1)} Specific`}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        {workshop.isActive ? (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600">
                            <XCircle className="w-4 h-4 mr-1" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditWorkshop(workshop)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => fetchWorkshopStats(workshop)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="View Stats"
                    >
                      <BarChart3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteWorkshop(workshop.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                      disabled={submitting}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">
                    {editingWorkshop ? 'Edit Workshop' : 'Create Workshop'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={workshopData.title}
                      onChange={(e) =>
                        setWorkshopData({ ...workshopData, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter workshop title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={workshopData.description}
                      onChange={(e) =>
                        setWorkshopData({ ...workshopData, description: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter workshop description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      YouTube URL
                    </label>
                    <input
                      type="text"
                      value={workshopData.youtubeUrl}
                      onChange={(e) =>
                        setWorkshopData({ ...workshopData, youtubeUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter YouTube video URL"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={workshopData.scheduledDate}
                        onChange={(e) =>
                          setWorkshopData({ ...workshopData, scheduledDate: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={workshopData.scheduledTime}
                        onChange={(e) =>
                          setWorkshopData({ ...workshopData, scheduledTime: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={workshopData.duration}
                      onChange={(e) =>
                        setWorkshopData({
                          ...workshopData,
                          duration: parseInt(e.target.value) || 60,
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Audience Type
                    </label>
                    <select
                      value={workshopData.audienceType}
                      onChange={(e) =>
                        setWorkshopData({
                          ...workshopData,
                          audienceType: e.target.value as 'students' | 'parents',
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="students">Students</option>
                      <option value="parents">Parents</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Type
                    </label>
                    <select
                      value={workshopData.targetType}
                      onChange={(e) =>
                        setWorkshopData({
                          ...workshopData,
                          targetType: e.target.value as 'all' | 'state' | 'district' | 'school',
                          targetStateId: '',
                          targetDistrictId: '',
                          targetSchoolId: '',
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">All</option>
                      <option value="state">State</option>
                      <option value="district">District</option>
                      <option value="school">School</option>
                    </select>
                  </div>
                  {workshopData.targetType === 'state' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select State
                      </label>
                      <select
                        value={workshopData.targetStateId}
                        onChange={(e) =>
                          setWorkshopData({
                            ...workshopData,
                            targetStateId: e.target.value,
                            targetDistrictId: '',
                            targetSchoolId: '',
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a state</option>
                        {states.map((state) => (
                          <option key={state.id} value={state.stateName}>
                            {state.stateName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {workshopData.targetType === 'district' && workshopData.targetStateId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select District
                      </label>
                      <select
                        value={workshopData.targetDistrictId}
                        onChange={(e) =>
                          setWorkshopData({
                            ...workshopData,
                            targetDistrictId: e.target.value,
                            targetSchoolId: '',
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a district</option>
                        {states
                          .find((s) => s.stateName === workshopData.targetStateId)
                          ?.districts.map((district) => (
                            <option
                              key={district.districtCode}
                              value={district.districtCode}
                            >
                              {district.districtName}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  {workshopData.targetType === 'school' &&
                    workshopData.targetStateId &&
                    workshopData.targetDistrictId && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select School
                        </label>
                        <select
                          value={workshopData.targetSchoolId}
                          onChange={(e) =>
                            setWorkshopData({
                              ...workshopData,
                              targetSchoolId: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select a school</option>
                          {getSelectedSchools().map((school: School) => (
                            <option key={school.id} value={school.schoolCode}>
                              {school.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={workshopData.isActive}
                      onChange={(e) =>
                        setWorkshopData({ ...workshopData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label className="text-sm text-gray-700">Active</label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateWorkshop}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        {editingWorkshop ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Update Workshop
                          </>
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            Create Workshop
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Modal */}
      <AnimatePresence>
        {showStatsModal && selectedWorkshop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl w-full max-w-4xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Workshop Statistics</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportStatsToCSV}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Export to CSV"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowStatsModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">{selectedWorkshop.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Total Views</div>
                      <div className="text-2xl font-semibold">{selectedWorkshop.viewCount || 0}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Completed Views</div>
                      <div className="text-2xl font-semibold">{selectedWorkshop.completedCount || 0}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Completion Rate</div>
                      <div className="text-2xl font-semibold">
                        {selectedWorkshop.viewCount
                          ? Math.round(
                              ((selectedWorkshop.completedCount || 0) /
                                selectedWorkshop.viewCount) *
                                100
                            )
                          : 0}
                        %
                      </div>
                    </div>
                  </div>
                </div>
                {loadingStats ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : workshopViews.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">No views yet</h3>
                    <p className="text-gray-500">This workshop hasn't been viewed by any students</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Student</th>
                          <th className="text-left py-3 px-4">View Date</th>
                          <th className="text-left py-3 px-4">Watch Time</th>
                          <th className="text-left py-3 px-4">Completion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workshopViews.map((view) => (
                          <tr key={view.id} className="border-b">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-gray-400" />
                                {view.studentName}
                              </div>
                            </td>
                            <td className="py-3 px-4">{formatDate(view.viewedAt)}</td>
                            <td className="py-3 px-4">
                              {Math.round(view.totalWatchTime / 60)} minutes
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-primary rounded-full h-2"
                                    style={{
                                      width: `${view.completionPercentage}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-600">
                                  {view.completionPercentage}%
                                </span>
                              </div>
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

export default WorkshopManagementTab; 