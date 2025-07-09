import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  User, 
  FileDown, 
  Upload,
  Table,
  Check,
  Eye,
  EyeOff,
  Copy,
  CheckSquare,
  Square,
  Trash
} from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { db } from '../../lib/firebase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { generatePassword } from '../../utils/studentIdGenerator';
import * as XLSX from 'xlsx';
import BulkUploadModal from './BulkUploadModal';

interface District {
  districtName: string;
  districtCode: string;
}

interface ExtendedDistrict extends District {
  stateName: string;
  uniqueKey: string;
}

interface State {
  id: string;
  stateName: string;
  stateCode: string;
  districts: District[];
}

interface School {
  id: string;
  name: string;
  schoolCode: string;
  districtCode: string;
  districtName: string;
  state: string;
  status: 'active' | 'inactive';
}

interface Student {
  id: string;
  name: string;
  studentId: string;
  districtCode: string;
  schoolCode: string;
  password: string;
  email: string;
  state?: string;
  districtName?: string;
  schoolName?: string;
  class?: string;
  gender?: string;
  age?: number;
  parentDetails?: string;
  whatsappNumber?: string;
  address?: string;
}

// Secondary Firebase app for student creation
const secondaryApp = initializeApp({
  apiKey: "AIzaSyC7a43eeu9vH4fGeQfUuBpphpW7zuE8dBA",
  authDomain: "test-mindleap.firebaseapp.com",
  projectId: "test-mindleap",
  storageBucket: "test-mindleap.firebasestorage.app",
  messagingSenderId: "402749246470",
  appId: "1:402749246470:web:c3411e9ccde8a419fbc787"
}, "secondary");

const secondaryAuth = getAuth(secondaryApp);

const UsersTab = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isDataEnriched, setIsDataEnriched] = useState(false);
  
  // Selection state
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Password visibility state
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Form and edit states
  const [newStudent, setNewStudent] = useState({ 
    name: '', 
    state: '', 
    districtCode: '', 
    schoolCode: '',
    class: '',
    gender: '',
    age: '',
    parentDetails: '',
    whatsappNumber: '',
    email: '',
    address: ''
  });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [addedStudent, setAddedStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 25;

  const { toast } = useToast();

  // Get available districts and schools based on current state selection
  const selectedStateData = states.find(state => state.stateName === newStudent.state);
  const availableDistricts = selectedStateData?.districts || [];
  
  // Get all districts for filtering with unique identifiers
  const allDistricts: ExtendedDistrict[] = states.flatMap(state => 
    state.districts.map(district => ({
      ...district,
      stateName: state.stateName,
      uniqueKey: `${state.stateName}-${district.districtCode}`
    }))
  );
  const filterDistricts: ExtendedDistrict[] = filterState === 'all' ? allDistricts : 
    states.find(state => state.stateName === filterState)?.districts.map(district => ({
      ...district,
      stateName: filterState,
      uniqueKey: `${filterState}-${district.districtCode}`
    })) || [];

  useEffect(() => {
    const initializeData = async () => {
      await fetchStates();
      await fetchSchools();
      await fetchStudents(); // Fetch all students on initial load
    };
    initializeData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, filterState, filterDistrict, filterSchool]);

  useEffect(() => {
    // Update select all state based on current selection
    if (filteredStudents.length > 0) {
      setSelectAll(selectedStudents.length === filteredStudents.length);
    } else {
      setSelectAll(false);
    }
  }, [selectedStudents, filteredStudents]);

  // Re-enrich students when states or schools data changes
  useEffect(() => {
    if (states.length > 0 && schools.length > 0 && students.length > 0 && !isDataEnriched && !isEnriching) {
      enrichStudentData();
    }
  }, [states, schools, students, isDataEnriched, isEnriching]);

  const enrichStudentData = async () => {
    if (isEnriching || isDataEnriched) return;
    
    setIsEnriching(true);
    
    // Use setTimeout to prevent blocking the UI
    setTimeout(() => {
      setStudents(prevStudents => {
        const enrichedStudents = prevStudents.map(student => {
          // Check if already enriched (has state data)
          if (student.state && student.districtName && student.schoolName) {
            return student;
          }
          return enrichSingleStudent(student);
        });
        
        setIsDataEnriched(true);
        setIsEnriching(false);
        return enrichedStudents;
      });
    }, 0);
  };

  const enrichSingleStudent = (studentData: any): Student => {
    // Find related school information
    const school = schools.find(s => s.schoolCode === studentData.schoolCode);
    
    // Find related state and district information
    let state: State | undefined;
    let district: District | undefined;
    
    if (school) {
      // First try to find state by school's state
      state = states.find(s => s.stateName === school.state);
      if (state) {
        district = state.districts.find(d => d.districtCode === studentData.districtCode);
      }
    }
    
    // Fallback: find state by district code
    if (!state || !district) {
      for (const s of states) {
        const d = s.districts.find(d => d.districtCode === studentData.districtCode);
        if (d) {
          state = s;
          district = d;
          break;
        }
      }
    }

    return {
      id: studentData.id,
      name: studentData.name || '',
      studentId: studentData.studentId || '',
      districtCode: studentData.districtCode || '',
      schoolCode: studentData.schoolCode || '',
      password: studentData.password || '',
      email: studentData.email || '',
      state: state?.stateName || '',
      districtName: district?.districtName || '',
      schoolName: school?.name || '',
      class: studentData.class || '',
      gender: studentData.gender || '',
      age: studentData.age || undefined,
      parentDetails: studentData.parentDetails || '',
      whatsappNumber: studentData.whatsappNumber || '',
      address: studentData.address || ''
    };
  };

  const fetchStates = async () => {
    try {
      const q = query(collection(db, 'states'), orderBy('stateName'));
      const querySnapshot = await getDocs(q);
      const statesList: State[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        statesList.push({
          id: doc.id,
          stateName: data.stateName || '',
          stateCode: data.stateCode || '',
          districts: data.districts || []
        });
      });
      setStates(statesList);
      return statesList;
    } catch (error) {
      console.error('Error fetching states:', error);
      toast({
        title: "Error",
        description: "Failed to fetch states",
        variant: "destructive"
      });
      return [];
    }
  };

  const fetchSchools = async () => {
    try {
      const q = query(collection(db, 'schools'), orderBy('name'));
      const querySnapshot = await getDocs(q);
      const schoolsList: School[] = [];
      querySnapshot.forEach((doc) => {
        schoolsList.push({ id: doc.id, ...doc.data() } as School);
      });
      setSchools(schoolsList);
      return schoolsList;
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast({
        title: "Error",
        description: "Failed to fetch schools",
        variant: "destructive"
      });
      return [];
    }
  };

  const fetchStudents = async (stateFilter?: string, districtFilter?: string, schoolFilter?: string) => {
    setIsFetching(true);
    setIsDataEnriched(false);
    try {
      let q = query(collection(db, 'students'), orderBy('name'));
      
      // Apply filters if provided
      if (schoolFilter && schoolFilter !== 'all') {
        q = query(collection(db, 'students'), where('schoolCode', '==', schoolFilter), orderBy('name'));
      } else if (districtFilter && districtFilter !== 'all') {
        q = query(collection(db, 'students'), where('districtCode', '==', districtFilter), orderBy('name'));
      }
      
      const querySnapshot = await getDocs(q);
      const studentsList: Student[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const student = {
          id: doc.id,
          name: data.name || '',
          studentId: data.studentId || '',
          districtCode: data.districtCode || '',
          schoolCode: data.schoolCode || '',
          password: data.password || '',
          email: data.email || '',
          state: '',
          districtName: '',
          schoolName: '',
          class: data.class || '',
          gender: data.gender || '',
          age: data.age || undefined,
          parentDetails: data.parentDetails || '',
          whatsappNumber: data.whatsappNumber || '',
          address: data.address || ''
        };
        
        // Apply state filter if needed (since we can't filter by state directly in Firestore)
        if (stateFilter && stateFilter !== 'all') {
          const school = schools.find(s => s.schoolCode === student.schoolCode);
          if (school && school.state !== stateFilter) {
            return; // Skip this student
          }
        }
        
        studentsList.push(student);
      });
      
      // Enrich with related data if states and schools are already loaded
      if (states.length > 0 && schools.length > 0) {
        const enrichedStudents = studentsList.map(student => enrichSingleStudent(student));
        setStudents(enrichedStudents);
        setIsDataEnriched(true);
      } else {
      setStudents(studentsList);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parentDetails?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.whatsappNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply state filter
    if (filterState !== 'all') {
      filtered = filtered.filter(student => student.state === filterState);
    }

    // Apply district filter
    if (filterDistrict !== 'all') {
      filtered = filtered.filter(student => student.districtCode === filterDistrict);
    }

    // Apply school filter
    if (filterSchool !== 'all') {
      filtered = filtered.filter(student => student.schoolCode === filterSchool);
    }

    setFilteredStudents(filtered);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  const handleViewStudent = (student: Student) => {
    setViewingStudent(student);
    setIsViewModalOpen(true);
  };

  const generateStudentSerial = async (schoolCode: string): Promise<string> => {
    const q = query(
      collection(db, 'students'), 
      where('schoolCode', '==', schoolCode)
    );
    const querySnapshot = await getDocs(q);
    
    const existingSerials = new Set<string>();
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.studentId) {
        const serial = data.studentId.slice(-3);
        existingSerials.add(serial);
      }
    });

    for (let i = 1; i <= 999; i++) {
      const serial = i.toString().padStart(3, '0');
      if (!existingSerials.has(serial)) {
        return serial;
      }
    }

    throw new Error('No more student serial numbers available for this school');
  };

  const handleAddStudent = async () => {
    if (!newStudent.name.trim() || !newStudent.state || !newStudent.districtCode || !newStudent.schoolCode) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate email if provided
    if (newStudent.email && !/\S+@\S+\.\S+/.test(newStudent.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const password = generatePassword();
      const serial = await generateStudentSerial(newStudent.schoolCode);
      const selectedState = states.find(s => s.stateName === newStudent.state);
      const stateCode = selectedState?.stateCode || 'ML';
      const studentId = `${stateCode}25${newStudent.districtCode}${newStudent.schoolCode}${serial}`;
      const systemEmail = `${studentId}@mindleap.edu`;
      const userEmail = newStudent.email.trim() || systemEmail;

      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userEmail, password);
      const firebaseUser = userCredential.user;

      // Store in Firestore
      const docRef = await addDoc(collection(db, 'students'), {
        uid: firebaseUser.uid,
        name: newStudent.name.trim(),
        studentId: studentId,
        districtCode: newStudent.districtCode,
        schoolCode: newStudent.schoolCode,
        password: password,
        email: userEmail,
        systemEmail: systemEmail,
        class: newStudent.class || '',
        gender: newStudent.gender || '',
        age: newStudent.age ? parseInt(newStudent.age) : null,
        parentDetails: newStudent.parentDetails?.trim() || '',
        whatsappNumber: newStudent.whatsappNumber?.trim() || '',
        address: newStudent.address?.trim() || '',
        createdAt: new Date().toISOString()
      });

      // Sign out from secondary auth
      await secondaryAuth.signOut();

      const newStudentData: Student = {
        id: docRef.id,
        name: newStudent.name.trim(),
        studentId: studentId,
        districtCode: newStudent.districtCode,
        schoolCode: newStudent.schoolCode,
        password: password,
        email: userEmail,
        state: newStudent.state,
        districtName: availableDistricts.find(d => d.districtCode === newStudent.districtCode)?.districtName || '',
        schoolName: schools.find(s => s.schoolCode === newStudent.schoolCode)?.name || '',
        class: newStudent.class || '',
        gender: newStudent.gender || '',
        age: newStudent.age ? parseInt(newStudent.age) : undefined,
        parentDetails: newStudent.parentDetails?.trim() || '',
        whatsappNumber: newStudent.whatsappNumber?.trim() || '',
        address: newStudent.address?.trim() || ''
      };

      // Refresh the students list to ensure the new student appears
      await fetchStudents();
      
      setAddedStudent(newStudentData);
      setIsAddModalOpen(false);
      setIsSuccessModalOpen(true);
      setNewStudent({ 
        name: '', 
        state: '', 
        districtCode: '', 
        schoolCode: '',
        class: '',
        gender: '',
        age: '',
        parentDetails: '',
        whatsappNumber: '',
        email: '',
        address: ''
      });

      toast({
        title: "Success! 🎉",
        description: `Student ${newStudentData.name} added successfully with ID: ${studentId}`,
      });
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setNewStudent({
      name: student.name,
      state: student.state || '',
      districtCode: student.districtCode,
      schoolCode: student.schoolCode,
      class: student.class || '',
      gender: student.gender || '',
      age: student.age?.toString() || '',
      parentDetails: student.parentDetails || '',
      whatsappNumber: student.whatsappNumber || '',
      email: student.email || '',
      address: student.address || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent || !newStudent.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid student name",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'students', editingStudent.id), {
        name: newStudent.name.trim(),
        updatedAt: new Date().toISOString()
      });

      setStudents(prev => prev.map(student => 
        student.id === editingStudent.id 
          ? { ...student, name: newStudent.name.trim() }
          : student
      ));

      setIsEditModalOpen(false);
      setEditingStudent(null);
      setNewStudent({ 
        name: '', 
        state: '', 
        districtCode: '', 
        schoolCode: '',
        class: '',
        gender: '',
        age: '',
        parentDetails: '',
        whatsappNumber: '',
        email: '',
        address: ''
      });

      toast({
        title: "Success! ✅",
        description: "Student information updated successfully",
      });
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: "Failed to update student. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await deleteDoc(doc(db, 'students', student.id));
      setStudents(prev => prev.filter(s => s.id !== student.id));
      
      toast({
        title: "Student Deleted",
        description: `${student.name} has been deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: "Failed to delete student. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select students to delete",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Delete all selected students
      const deletePromises = selectedStudents.map(studentId => 
        deleteDoc(doc(db, 'students', studentId))
      );
      
      await Promise.all(deletePromises);
      
      // Update local state
      setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
      setSelectedStudents([]);
      setIsBulkDeleteModalOpen(false);
      
      toast({
        title: "Bulk Delete Successful",
        description: `${selectedStudents.length} students deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting students:', error);
      toast({
        title: "Error",
        description: "Failed to delete some students. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id));
    }
  };

  const togglePasswordVisibility = (studentId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleExportStudents = () => {
    // Ensure all students have enriched data before export
    const enrichedExportData = filteredStudents.map(student => {
      const enrichedStudent = enrichSingleStudent(student);
      return {
        'Student Name': enrichedStudent.name,
        'Student ID': enrichedStudent.studentId,
        'Age': enrichedStudent.age || '',
        'Class': enrichedStudent.class || '',
        'Gender': enrichedStudent.gender === 'M' ? 'Male' : enrichedStudent.gender === 'F' ? 'Female' : '',
        'Parent Details': enrichedStudent.parentDetails || '',
        'WhatsApp Number': enrichedStudent.whatsappNumber || '',
        'Email': enrichedStudent.email || '',
        'Address': enrichedStudent.address || '',
        'State': enrichedStudent.state || 'Unknown',
        'District': enrichedStudent.districtName || 'Unknown',
        'District Code': enrichedStudent.districtCode,
        'School': enrichedStudent.schoolName || 'Unknown',
        'School Code': enrichedStudent.schoolCode,
        'Export Date': new Date().toLocaleDateString(),
        'Export Time': new Date().toLocaleTimeString()
      };
    });

    const ws = XLSX.utils.json_to_sheet(enrichedExportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    
    // Add some metadata
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `students_export_${timestamp}.xlsx`;
    
    XLSX.writeFile(wb, filename);

    toast({
      title: "Export Successful",
      description: `${filteredStudents.length} students exported to ${filename}`,
    });
  };

  const handleBulkUploadSuccess = (newStudents: any[]) => {
    setIsBulkUploadOpen(false);
    // Refresh the students list to get the latest data
    fetchStudents();
    toast({
      title: "Bulk Upload Successful",
      description: `${newStudents.length} students uploaded successfully`,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterState('all');
    setFilterDistrict('all');
    setFilterSchool('all');
    setNewStudent({ 
      name: '', 
      state: '', 
      districtCode: '', 
      schoolCode: '',
      class: '',
      gender: '',
      age: '',
      parentDetails: '',
      whatsappNumber: '',
      email: '',
      address: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-600" />
          <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600">Manage student accounts and data</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setIsBulkUploadOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Filters & Search</h3>
          </div>
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="text-sm"
          >
            Clear All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

          {/* State Filter */}
          <Select value={filterState} onValueChange={setFilterState}>
            <SelectTrigger>
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map((state) => (
                <SelectItem key={state.id} value={state.stateName}>
                  {state.stateName} ({state.stateCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* District Filter */}
          <Select value={filterDistrict} onValueChange={setFilterDistrict}>
            <SelectTrigger>
              <SelectValue placeholder="Select District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {(filterState === 'all' ? allDistricts : filterDistricts).map((district) => (
                <SelectItem key={district.uniqueKey} value={district.districtCode}>
                  {district.districtName} ({district.districtCode})
                  {filterState === 'all' && ` - ${district.stateName}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* School Filter */}
          <Select value={filterSchool} onValueChange={setFilterSchool}>
            <SelectTrigger>
              <SelectValue placeholder="Select School" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schools</SelectItem>
              {schools
                .filter(school => 
                  (!filterState || filterState === 'all' || school.state === filterState) &&
                  (!filterDistrict || filterDistrict === 'all' || school.districtCode === filterDistrict)
                )
                .map((school) => (
                  <SelectItem key={school.id} value={school.schoolCode}>
                    {school.name} ({school.schoolCode})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button 
            onClick={handleExportStudents}
            className="bg-orange-600 hover:bg-orange-700 text-white"
            disabled={filteredStudents.length === 0}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export ({filteredStudents.length})
          </Button>
      </div>
      </motion.div>

      {/* Students Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-sm border"
      >
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Table className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Students Data</h3>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                {filteredStudents.length} students
              </span>
              {isEnriching && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm font-medium animate-pulse">
                  Enriching data...
                </span>
              )}
            </div>
            
            {/* Bulk Actions */}
            {selectedStudents.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {selectedStudents.length} selected
                </span>
                <Button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
        </div>
      )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center"
                    >
                      {selectAll ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <span>Select</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  District
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStudentSelection(student.id)}
                      className="flex items-center"
                    >
                      {selectedStudents.includes(student.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                       <div className="ml-4">
                         <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{student.name}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-gray-900">{student.studentId}</span>
                      <button
                        onClick={() => copyToClipboard(student.studentId, 'Student ID')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                   <td className="px-6 py-4">
                     <div className="text-sm text-gray-900 max-w-32 break-words">
                       {student.state || (
                         isEnriching ? (
                           <span className="text-gray-400 italic">Loading...</span>
                         ) : (
                           <span className="text-gray-400 italic">-</span>
                         )
                       )}
                     </div>
                   </td>
                   <td className="px-6 py-4">
                     <div className="text-sm text-gray-900 max-w-32 break-words">
                       {student.districtName || (
                         isEnriching ? (
                           <span className="text-gray-400 italic">Loading...</span>
                         ) : (
                           <span className="text-gray-400 italic">-</span>
                         )
                       )}
                       <div className="text-xs text-gray-500">Code: {student.districtCode}</div>
                     </div>
                   </td>
                   <td className="px-6 py-4">
                     <div className="text-sm text-gray-900 max-w-48 break-words">
                       {student.schoolName || (
                         isEnriching ? (
                           <span className="text-gray-400 italic">Loading...</span>
                         ) : (
                           <span className="text-gray-400 italic">-</span>
                         )
                       )}
                       <div className="text-xs text-gray-500">Code: {student.schoolCode}</div>
                     </div>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2">
                    <Button
                      onClick={() => handleViewStudent(student)}
                      variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                      <Button
                        onClick={() => handleEditStudent(student)}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteStudent(student)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-500">
                {isFetching ? 'Loading students...' : 'Try adjusting your search or filters'}
              </p>
        </div>
      )}
        </div>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Add Student Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>Add New Student</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name *
              </label>
              <Input
                placeholder="Enter student name"
                value={newStudent.name}
                onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                </label>
                <div className="flex space-x-4">
                  {['8', '9', '10'].map((classNum) => (
                    <label key={classNum} className="flex items-center">
                      <input
                        type="radio"
                        value={classNum}
                        checked={newStudent.class === classNum}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, class: e.target.value }))}
                        className="mr-2"
                      />
                      {classNum}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <div className="flex space-x-4">
                  {[{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }].map((gender) => (
                    <label key={gender.value} className="flex items-center">
                      <input
                        type="radio"
                        value={gender.value}
                        checked={newStudent.gender === gender.value}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, gender: e.target.value }))}
                        className="mr-2"
                      />
                      {gender.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <Input
                  type="number"
                  placeholder="Enter age"
                  value={newStudent.age}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, age: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Number
                </label>
                <Input
                  type="number"
                  placeholder="Enter WhatsApp number"
                  value={newStudent.whatsappNumber}
                  onChange={(e) => setNewStudent(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Details
              </label>
              <Input
                placeholder="Enter parent name(s)"
                value={newStudent.parentDetails}
                onChange={(e) => setNewStudent(prev => ({ ...prev, parentDetails: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={newStudent.email}
                onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                rows={3}
                placeholder="Enter full address"
                value={newStudent.address}
                onChange={(e) => setNewStudent(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State *
              </label>
              <Select
                value={newStudent.state}
                onValueChange={(value) => {
                  setNewStudent(prev => ({ 
                    ...prev, 
                    state: value, 
                    districtCode: '', 
                    schoolCode: '' 
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.stateName}>
                      {state.stateName} ({state.stateCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District *
              </label>
              <Select
                value={newStudent.districtCode}
                onValueChange={(value) => {
                  setNewStudent(prev => ({ ...prev, districtCode: value, schoolCode: '' }));
                }}
                disabled={!newStudent.state}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {availableDistricts.map((district) => (
                    <SelectItem key={district.districtCode} value={district.districtCode}>
                      {district.districtName} ({district.districtCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School *
              </label>
              <Select
                value={newStudent.schoolCode}
                onValueChange={(value) => setNewStudent(prev => ({ ...prev, schoolCode: value }))}
                disabled={!newStudent.districtCode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {schools
                    .filter(school => school.districtCode === newStudent.districtCode)
                    .map((school) => (
                      <SelectItem key={school.id} value={school.schoolCode}>
                        {school.name} ({school.schoolCode})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewStudent({ 
                    name: '', 
                    state: '', 
                    districtCode: '', 
                    schoolCode: '',
                    class: '',
                    gender: '',
                    age: '',
                    parentDetails: '',
                    whatsappNumber: '',
                    email: '',
                    address: ''
                  });
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddStudent}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
              >
                {isLoading ? 'Adding...' : 'Add Student'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Student Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5 text-blue-600" />
              <span>Edit Student</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name *
              </label>
              <Input
                placeholder="Enter student name"
                value={newStudent.name}
                onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <strong>Student ID:</strong> {editingStudent?.studentId}
                </p>
                <button
                  onClick={() => copyToClipboard(editingStudent?.studentId || '', 'Student ID')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
        </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <strong>Password:</strong> 
                  <span className="font-mono ml-2">
                    {visiblePasswords[editingStudent?.id || ''] ? editingStudent?.password : '••••••••'}
                  </span>
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => togglePasswordVisibility(editingStudent?.id || '')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {visiblePasswords[editingStudent?.id || ''] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => copyToClipboard(editingStudent?.password || '', 'Password')}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingStudent(null);
                  setNewStudent({ 
                    name: '', 
                    state: '', 
                    districtCode: '', 
                    schoolCode: '',
                    class: '',
                    gender: '',
                    age: '',
                    parentDetails: '',
                    whatsappNumber: '',
                    email: '',
                    address: ''
                  });
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStudent}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
              >
                {isLoading ? 'Updating...' : 'Update Student'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-green-600">
              <Check className="w-5 h-5" />
              <span>Student Added Successfully!</span>
            </DialogTitle>
          </DialogHeader>
          {addedStudent && (
            <div className="space-y-3">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="space-y-3">
                  <p><strong>Name:</strong> {addedStudent.name}</p>
                  <div className="flex items-center justify-between">
                    <p><strong>Student ID:</strong> <span className="font-mono">{addedStudent.studentId}</span></p>
                    <button
                      onClick={() => copyToClipboard(addedStudent.studentId, 'Student ID')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <p><strong>Password:</strong> 
                      <span className="font-mono ml-2">
                        {visiblePasswords[addedStudent.id] ? addedStudent.password : '••••••••'}
                      </span>
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => togglePasswordVisibility(addedStudent.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {visiblePasswords[addedStudent.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(addedStudent.password, 'Password')}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Please save these credentials. Use the copy buttons to securely store the Student ID and password.
              </p>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button onClick={() => setIsSuccessModalOpen(false)} className="bg-green-600 hover:bg-green-700 text-white">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Modal */}
      <Dialog open={isBulkDeleteModalOpen} onOpenChange={setIsBulkDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <Trash className="w-5 h-5" />
              <span>Confirm Bulk Delete</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete <strong>{selectedStudents.length}</strong> selected students? 
              This action cannot be undone.
            </p>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This will permanently delete all selected student accounts and their data.
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkDelete}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]"
              >
                {isLoading ? 'Deleting...' : 'Delete All'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Student Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-green-600" />
              <span>Student Details</span>
            </DialogTitle>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
              <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{viewingStudent.name}</p>
              </div>
              <div>
                    <p className="text-sm text-gray-600">Student ID</p>
                    <div className="flex items-center">
                      <p className="font-mono text-sm flex-1">{viewingStudent.studentId}</p>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(viewingStudent.studentId, 'Student ID')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
              </div>
              <div>
                    <p className="text-sm text-gray-600">Class</p>
                    <p className="font-medium">{viewingStudent.class || '-'}</p>
              </div>
              <div>
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium">{viewingStudent.gender === 'M' ? 'Male' : viewingStudent.gender === 'F' ? 'Female' : '-'}</p>
              </div>
              <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-medium">{viewingStudent.age || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-sm break-all">{viewingStudent.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Password</p>
                    <div className="flex items-center">
                      <p className="font-mono text-sm flex-1">
                        {visiblePasswords[viewingStudent.id] ? viewingStudent.password : '••••••••'}
                      </p>
                      <Button variant="ghost" size="sm" onClick={() => togglePasswordVisibility(viewingStudent.id)}>
                        {visiblePasswords[viewingStudent.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(viewingStudent.password, 'Password')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Parent Details</p>
                    <p className="font-medium">{viewingStudent.parentDetails || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">WhatsApp Number</p>
                    <p className="font-medium">{viewingStudent.whatsappNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{viewingStudent.address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* School Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">School Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">State</p>
                    <p className="font-medium">{viewingStudent.state || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">District</p>
                    <p className="font-medium">{viewingStudent.districtName || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">School</p>
                    <p className="font-medium">{viewingStudent.schoolName || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end pt-4">
            <Button onClick={() => setIsViewModalOpen(false)} className="bg-green-600 hover:bg-green-700 text-white">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={handleBulkUploadSuccess}
      />
    </div>
  );
};

export default UsersTab;