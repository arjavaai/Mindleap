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
  Trash,
  Shield
} from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { db } from '../../lib/firebase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAdminPermissions } from './AdminContext';
import { generatePassword } from '../../utils/studentIdGenerator';
import * as XLSX from 'xlsx';
import BulkUploadModal from './BulkUploadModal';

// Secondary Firebase app for student creation (to avoid logging out admin)
const getSecondaryFirebaseApp = () => {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };
  
  return initializeApp(firebaseConfig, 'studentCreation-' + Date.now());
};

// Get the main Firebase auth instead of using secondary app
import { auth as mainAuth } from '../../lib/firebase';

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
  uid?: string; // Firebase Auth UID
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

const UsersTab = () => {
  const { canDelete } = useAdminPermissions();
  const [students, setStudents] = useState<Student[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  
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
    if (states.length > 0 && schools.length > 0 && students.length > 0 && !isEnriching) {
      enrichStudentData();
    }
  }, [states, schools, students, isEnriching]);

  const enrichStudentData = async () => {
    if (isEnriching) return;
    
    console.log('🔄 Starting student data enrichment...', {
      studentsCount: students.length,
      statesCount: states.length,
      schoolsCount: schools.length,
      sampleStudent: students[0] ? {
        name: students[0].name,
        districtCode: students[0].districtCode,
        schoolCode: students[0].schoolCode,
        currentState: students[0].state,
        currentDistrictName: students[0].districtName,
        currentSchoolName: students[0].schoolName
      } : null
    });
    
    setIsEnriching(true);
    
    try {
      const enrichedStudents = students.map(student => {
        // Always enrich if missing any data
        if (!student.state || !student.districtName || !student.schoolName) {
          console.log(`🔄 Enriching student ${student.name}...`);
          const enriched = enrichSingleStudent(student);
          console.log(`🔍 Enrichment result for ${student.name}:`, {
            before: { state: student.state, district: student.districtName, school: student.schoolName },
            after: { state: enriched.state, district: enriched.districtName, school: enriched.schoolName }
          });
          return enriched;
        } else {
          console.log(`✅ Student ${student.name} already enriched`);
          return student;
        }
      });
      
      console.log('✅ Student enrichment completed');
      setStudents(enrichedStudents);
    } catch (error) {
      console.error('❌ Error during enrichment:', error);
    } finally {
      setIsEnriching(false);
    }
  };

  const enrichSingleStudent = (studentData: any): Student => {
    console.log(`🔍 Enriching student ${studentData.name}:`, {
      districtCode: studentData.districtCode,
      schoolCode: studentData.schoolCode
    });
    
    // Find related school information
    const school = schools.find(s => s.schoolCode === studentData.schoolCode);
    console.log(`🏫 School lookup for code ${studentData.schoolCode}:`, school ? school.name : 'NOT FOUND');
    
    // Find related state and district information
    let state: State | undefined;
    let district: District | undefined;
    
    if (school) {
      // First try to find state by school's state
      state = states.find(s => s.stateName === school.state);
      console.log(`🗺️ State lookup by school state ${school.state}:`, state ? state.stateName : 'NOT FOUND');
      if (state) {
        district = state.districts.find(d => d.districtCode === studentData.districtCode);
        console.log(`🏘️ District lookup in ${state.stateName} for code ${studentData.districtCode}:`, district ? district.districtName : 'NOT FOUND');
      }
    }
    
    // Fallback: find state by district code
    if (!state || !district) {
      console.log('🔄 Fallback: searching all states for district code', studentData.districtCode);
      for (const s of states) {
        const d = s.districts.find(d => d.districtCode === studentData.districtCode);
        if (d) {
          state = s;
          district = d;
          console.log(`✅ Found district ${d.districtName} in state ${s.stateName}`);
          break;
        }
      }
    }

    const enrichedData = {
      id: studentData.id,
      name: studentData.name || '',
      studentId: studentData.studentId || '',
      districtCode: studentData.districtCode || '',
      schoolCode: studentData.schoolCode || '',
      password: studentData.password || '',
      email: studentData.email || '',
      uid: studentData.uid || null,
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
    
    console.log(`✅ Enriched ${studentData.name}:`, {
      state: enrichedData.state,
      district: enrichedData.districtName,
      school: enrichedData.schoolName
    });
    
    return enrichedData;
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

  // Debug effect to track students state changes
  useEffect(() => {
    console.log('🔄 Students state changed:', {
      count: students.length,
      withUID: students.filter(s => s.uid && s.uid !== null && s.uid !== '').length,
      withoutUID: students.filter(s => !s.uid || s.uid === null || s.uid === '').length,
      sample: students.slice(0, 2).map(s => ({ name: s.name, uid: s.uid, hasUID: !!s.uid }))
    });
  }, [students]);

  const fetchStudents = async () => {
    setIsFetching(true);
    try {
      const q = query(collection(db, 'students'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const studentsData: Student[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('🔍 Student data structure:', {
          id: doc.id,
          name: data.name,
          hasUID: !!data.uid,
          uidValue: data.uid,
          uidType: typeof data.uid,
          allFields: Object.keys(data)
        });
        
        studentsData.push({
          id: doc.id,
          name: data.name || '',
          studentId: data.studentId || '',
          districtCode: data.districtCode || '',
          schoolCode: data.schoolCode || '',
          password: data.password || '',
          email: data.email || '',
          uid: data.uid || null, // Explicitly handle undefined/null
          state: data.state || '',
          districtName: data.districtName || '',
          schoolName: data.schoolName || '',
          class: data.class || '',
          gender: data.gender || '',
          age: data.age || undefined,
          parentDetails: data.parentDetails || '',
          whatsappNumber: data.whatsappNumber || '',
          address: data.address || ''
        });
      });
      
      console.log('📊 UID Analysis:', {
        totalStudents: studentsData.length,
        studentsWithUID: studentsData.filter(s => s.uid && s.uid !== null && s.uid !== '').length,
        studentsWithoutUID: studentsData.filter(s => !s.uid || s.uid === null || s.uid === '').length,
        sampleUIDs: studentsData.slice(0, 3).map(s => ({ name: s.name, uid: s.uid, hasUID: !!s.uid }))
      });
      
      console.log('🔄 Setting students state with updated data...');
      setStudents(studentsData);
      
      // Force a re-render after state update to ensure UI reflects correct UID counts
      setTimeout(() => {
        console.log('🔄 Forcing UI update after state change');
        setStudents([...studentsData]);
      }, 100);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students data",
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

  // Pagination logic - disable pagination when filters are applied (especially school filter)
  const hasActiveFilters = filterState !== 'all' || filterDistrict !== 'all' || filterSchool !== 'all' || searchTerm.trim() !== '';
  const shouldUsePagination = !hasActiveFilters; // No pagination when filters are active
  
  const totalPages = shouldUsePagination ? Math.ceil(filteredStudents.length / studentsPerPage) : 1;
  const startIndex = shouldUsePagination ? (currentPage - 1) * studentsPerPage : 0;
  const endIndex = shouldUsePagination ? startIndex + studentsPerPage : filteredStudents.length;
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
    if (!newStudent.name.trim() || !newStudent.state || !newStudent.districtCode || !newStudent.schoolCode || !newStudent.class) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, State, District, School, Class)",
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
      // Create Firebase Auth account using secondary app to avoid logging out admin
      const secondaryApp = getSecondaryFirebaseApp();
      const secondaryAuth = getAuth(secondaryApp);
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

      // Sign out from secondary auth to prevent admin logout
      await secondaryAuth.signOut();
      console.log('✅ Student created successfully - Admin session preserved');

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
    if (!canDelete) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete students. Only the main administrator can perform delete operations.",
        variant: "destructive"
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete ${student.name}? This action will remove them from both the database and authentication system. This cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      console.log(`🗑️ Deleting student: ${student.name} (ID: ${student.studentId})`);
      
      // First, delete from Firestore
      await deleteDoc(doc(db, 'students', student.id));
      console.log(`✅ Deleted Firestore document for ${student.name}`);
      
             // Then, attempt to automatically delete from Firebase Auth
       console.log(`🔍 Deletion check for ${student.name}:`, {
         uid: student.uid,
         email: student.email,
         password: student.password ? '***' : 'MISSING',
         hasUID: !!student.uid,
         hasEmail: !!student.email,
         hasPassword: !!student.password
       });
       
       if (student.uid && student.email && student.password) {
         console.log(`🔄 Attempting automatic Firebase Auth deletion for ${student.name}...`);
         const authDeleted = await deleteFirebaseAuthUser(student.uid, student.name, student.email, student.password);
         
         if (authDeleted) {
           toast({
             title: "✅ Student Completely Deleted",
             description: `${student.name} has been automatically removed from both database and authentication system.`,
           });
         } else {
           toast({
             title: "⚠️ Partial Deletion Complete",
             description: `${student.name} deleted from database. Firebase Auth user deletion failed - may need manual cleanup.`,
             variant: "default"
           });
         }
       } else {
         console.log(`⚠️ Missing data for automatic auth deletion: UID=${!!student.uid}, Email=${!!student.email}, Password=${!!student.password}`);
         toast({
           title: "Student Deleted from Database",
           description: `${student.name} deleted from database. Firebase Auth cleanup not possible due to missing credentials.`,
           variant: "default"
         });
       }
      
      // Update local state
      setStudents(prev => prev.filter(s => s.id !== student.id));
      
    } catch (error) {
      console.error('❌ Error deleting student:', error);
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
    if (!canDelete) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to delete students. Only the main administrator can perform delete operations.",
        variant: "destructive"
      });
      return;
    }

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
      console.log(`🗑️ Bulk deleting ${selectedStudents.length} students`);
      
      // Get student data for the selected students to access their UIDs
      const studentsToDelete = students.filter(s => selectedStudents.includes(s.id));
      
      // Delete all selected students from Firestore
      const firestoreDeletePromises = selectedStudents.map(studentId => 
        deleteDoc(doc(db, 'students', studentId))
      );
      
      await Promise.all(firestoreDeletePromises);
      console.log(`✅ Deleted ${selectedStudents.length} students from Firestore`);
      
             // Attempt to automatically delete Firebase Auth users
       let authDeletionSuccess = 0;
       let authDeletionFailures = 0;
       
       for (const student of studentsToDelete) {
         if (student.uid && student.email && student.password) {
           try {
             console.log(`🔄 Attempting automatic Firebase Auth deletion for ${student.name}...`);
             const authDeleted = await deleteFirebaseAuthUser(student.uid, student.name, student.email, student.password);
             
             if (authDeleted) {
               authDeletionSuccess++;
               console.log(`✅ Firebase Auth user deleted for ${student.name}`);
             } else {
               authDeletionFailures++;
               console.log(`❌ Firebase Auth user deletion failed for ${student.name}`);
             }
           } catch (authError) {
             authDeletionFailures++;
             console.error(`❌ Error deleting Firebase Auth user for ${student.name}:`, authError);
           }
         } else {
           authDeletionFailures++;
           console.log(`⚠️ Missing credentials for automatic auth deletion of ${student.name}`);
         }
       }
      
      // Update local state
      setStudents(prev => prev.filter(s => !selectedStudents.includes(s.id)));
      setSelectedStudents([]);
      setIsBulkDeleteModalOpen(false);
      
      // Show comprehensive results
      if (authDeletionSuccess > 0 && authDeletionFailures === 0) {
        toast({
          title: "✅ Complete Bulk Deletion Successful",
          description: `${selectedStudents.length} students completely removed from both database and authentication system.`,
        });
      } else if (authDeletionSuccess > 0 && authDeletionFailures > 0) {
        toast({
          title: "⚠️ Partial Bulk Deletion Complete",
          description: `${selectedStudents.length} students deleted from database. ${authDeletionSuccess} auth users deleted automatically, ${authDeletionFailures} may need manual cleanup.`,
        });
      } else if (authDeletionFailures > 0) {
        toast({
          title: "📊 Database Deletion Complete",
          description: `${selectedStudents.length} students deleted from database. Firebase Auth users may need manual cleanup due to missing credentials.`,
        });
      } else {
        toast({
          title: "Bulk Delete Successful",
          description: `${selectedStudents.length} students deleted successfully`,
        });
      }
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
        // Basic Information
        'Student Name': enrichedStudent.name,
        'Student ID': enrichedStudent.studentId,
        'Gender': enrichedStudent.gender === 'M' ? 'Male' : enrichedStudent.gender === 'F' ? 'Female' : enrichedStudent.gender || '',
        'Age': enrichedStudent.age || '',
        'Email': enrichedStudent.email || '',
        'WhatsApp Number': enrichedStudent.whatsappNumber || '',
        'Address': enrichedStudent.address || '',
        'Parent Details': enrichedStudent.parentDetails || '',
        'Password': enrichedStudent.password || '',
        
        // School Information
        'State': enrichedStudent.state || 'Unknown',
        'District': enrichedStudent.districtName || 'Unknown',
        'District Code': enrichedStudent.districtCode,
        'School': enrichedStudent.schoolName || 'Unknown',
        'School Code': enrichedStudent.schoolCode,
        'Class': enrichedStudent.class || '',
        
        // Export Metadata
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

  // Function to automatically delete Firebase Auth user
  const deleteFirebaseAuthUser = async (uid: string, studentName: string, studentEmail: string, studentPassword: string): Promise<boolean> => {
    try {
      console.log(`🔐 Attempting to automatically delete Firebase Auth user for ${studentName} (UID: ${uid})`);
      
      // Method 1: Try to delete using a secondary Firebase app with the user's credentials
      try {
        const secondaryApp = getSecondaryFirebaseApp();
        const secondaryAuth = getAuth(secondaryApp);
        
        // Sign in as the user to be deleted (this gives us permission to delete that user)
        console.log(`🔑 Signing in as user to enable deletion: ${studentEmail}`);
        const userCredential = await signInWithEmailAndPassword(secondaryAuth, studentEmail, studentPassword);
        
        // Now delete the current user (which is the student we want to delete)
        await deleteUser(userCredential.user);
        console.log(`✅ Successfully deleted Firebase Auth user for ${studentName}`);
        
        return true;
        
      } catch (signInError: any) {
        console.log(`❌ Method 1 failed (sign-in approach): ${signInError.message}`);
        
        // Method 2: Try direct deletion if we have the UID
        try {
          // This approach attempts to use Firebase Admin-like functionality
          console.log(`🔄 Trying alternative deletion method for ${studentName}`);
          
          // Create a special request to delete the user
          // Note: This is a workaround that may work depending on Firebase configuration
          const deleteResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${import.meta.env.VITE_FIREBASE_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              localId: uid
            })
          });
          
          if (deleteResponse.ok) {
            console.log(`✅ Successfully deleted Firebase Auth user via API for ${studentName}`);
            return true;
          } else {
            const errorData = await deleteResponse.json();
            console.log(`❌ API deletion failed:`, errorData);
          }
          
        } catch (apiError: any) {
          console.log(`❌ Method 2 failed (API approach): ${apiError.message}`);
        }
      }
      
      // If all methods fail, return false
      console.log(`⚠️ Could not automatically delete Firebase Auth user for ${studentName}. Manual cleanup may be needed.`);
      return false;
      
    } catch (error: any) {
      console.error(`❌ Error in automatic auth user deletion for ${studentName}:`, error);
      return false;
    }
  };

  // Function to update existing students with their Firebase Auth UIDs
  const updateStudentsWithUIDs = async () => {
    if (!canDelete) {
      toast({
        title: "Permission Denied",
        description: "Only the main administrator can perform this operation.",
        variant: "destructive"
      });
      return;
    }

    const studentsWithoutUID = students.filter(student => !student.uid || student.uid === null || student.uid === '');
    
    console.log('🔍 UID Update Debug:', {
      totalStudents: students.length,
      studentsWithoutUID: studentsWithoutUID.length,
      sampleStudents: students.slice(0, 3).map(s => ({ 
        name: s.name, 
        uid: s.uid, 
        hasUID: !!(s.uid && s.uid !== null && s.uid !== ''),
        uidType: typeof s.uid
      }))
    });
    
    if (studentsWithoutUID.length === 0) {
      toast({
        title: "No Updates Needed",
        description: "All students already have Firebase Auth UIDs stored.",
      });
      return;
    }

    if (!confirm(`Found ${studentsWithoutUID.length} students without Firebase Auth UIDs. Would you like to update them? This process will look up their UIDs from Firebase Auth using their email addresses.`)) {
      return;
    }

    setIsLoading(true);
    let updatedCount = 0;
    let failedCount = 0;

    try {
      console.log(`🔄 Starting UID update process for ${studentsWithoutUID.length} students...`);

      for (const student of studentsWithoutUID) {
        try {
          console.log(`🔍 Looking up Firebase Auth UID for ${student.name} (${student.email})`);
          
          // Create a secondary Firebase app to look up the user
          const secondaryApp = getSecondaryFirebaseApp();
          const secondaryAuth = getAuth(secondaryApp);
          
          try {
            // Try to sign in with the student's credentials to get their UID
            const userCredential = await signInWithEmailAndPassword(secondaryAuth, student.email, student.password);
            const uid = userCredential.user.uid;
            
            // Sign out immediately to avoid session issues
            await secondaryAuth.signOut();
            
            // Update the Firestore document with the UID
            await updateDoc(doc(db, 'students', student.id), {
              uid: uid
            });
            
            // Update local state
            setStudents(prev => prev.map(s => 
              s.id === student.id ? { ...s, uid } : s
            ));
            
            console.log(`✅ Updated ${student.name} with UID: ${uid}`);
            updatedCount++;
            
          } catch (authError: any) {
            console.error(`❌ Could not authenticate ${student.name}:`, authError.message);
            
            // Try alternative method - using Firebase Auth REST API to find user by email
            try {
              console.log(`🔄 Trying alternative lookup method for ${student.name}...`);
              
              const lookupResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${import.meta.env.VITE_FIREBASE_API_KEY}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: [student.email]
                })
              });
              
              if (lookupResponse.ok) {
                const lookupData = await lookupResponse.json();
                if (lookupData.users && lookupData.users.length > 0) {
                  const uid = lookupData.users[0].localId;
                  
                  // Update the Firestore document
                  await updateDoc(doc(db, 'students', student.id), {
                    uid: uid
                  });
                  
                  // Update local state
                  setStudents(prev => prev.map(s => 
                    s.id === student.id ? { ...s, uid } : s
                  ));
                  
                  console.log(`✅ Updated ${student.name} with UID via API: ${uid}`);
                  updatedCount++;
                } else {
                  console.log(`⚠️ No Firebase Auth user found for ${student.name} (${student.email})`);
                  failedCount++;
                }
              } else {
                console.log(`❌ API lookup failed for ${student.name}`);
                failedCount++;
              }
            } catch (apiError: any) {
              console.error(`❌ API lookup failed for ${student.name}:`, apiError.message);
              failedCount++;
            }
          }
        } catch (error: any) {
          console.error(`❌ Error updating ${student.name}:`, error);
          failedCount++;
        }
      }

      // Show results
      if (updatedCount > 0 && failedCount === 0) {
        toast({
          title: "✅ All Students Updated",
          description: `Successfully updated ${updatedCount} students with their Firebase Auth UIDs. Automatic deletion will now work for all students.`,
        });
      } else if (updatedCount > 0 && failedCount > 0) {
        toast({
          title: "⚠️ Partial Update Complete",
          description: `Updated ${updatedCount} students successfully. ${failedCount} students could not be updated (they may not exist in Firebase Auth).`,
        });
      } else {
        toast({
          title: "❌ Update Failed",
          description: `Could not update any students. Please check that students exist in Firebase Authentication.`,
          variant: "destructive"
        });
      }

      console.log(`📊 UID update completed: ${updatedCount} successful, ${failedCount} failed`);

    } catch (error) {
      console.error('❌ Error in UID update process:', error);
      toast({
        title: "Error",
        description: "Failed to update student UIDs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600 text-sm sm:text-base">Manage student accounts and data</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button 
            onClick={() => setIsBulkUploadOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base"
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
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
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                {(() => {
                  const withUID = students.filter(s => {
                    const hasUID = s.uid && s.uid !== null && s.uid !== '';
                    console.log(`🔍 UID Check - ${s.name}: uid="${s.uid}", hasUID=${hasUID}`);
                    return hasUID;
                  });
                  console.log(`📊 Students with UID: ${withUID.length}/${students.length}`);
                  return withUID.length;
                })()} with Auth UIDs
              </span>
              {(() => {
                const withoutUID = students.filter(s => {
                  const missingUID = !s.uid || s.uid === null || s.uid === '';
                  return missingUID;
                });
                console.log(`📊 Students without UID: ${withoutUID.length}/${students.length}`);
                return withoutUID.length > 0 ? (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
                    {withoutUID.length} missing UIDs
                  </span>
                ) : null;
              })()}
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
                  className={canDelete 
                    ? "text-red-600 hover:text-red-700 hover:bg-red-50" 
                    : "text-gray-400 cursor-not-allowed opacity-50"
                  }
                  disabled={!canDelete}
                  title={canDelete ? "Delete selected students" : "Permission Denied - Only main admin can delete"}
                >
                  {canDelete ? <Trash className="w-4 h-4 mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
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
                        className={canDelete 
                          ? "text-red-600 hover:text-red-700" 
                          : "text-gray-400 cursor-not-allowed opacity-50"
                        }
                        disabled={!canDelete}
                        title={canDelete ? "Delete student" : "Permission Denied - Only main admin can delete"}
                      >
                        {canDelete ? <Trash2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
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

        {/* Pagination - only show when no filters are active */}
        {filteredStudents.length > 0 && shouldUsePagination && (
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
        
        {/* Show total count when filters are active (no pagination) */}
        {filteredStudents.length > 0 && !shouldUsePagination && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing all {filteredStudents.length} students (filters applied - pagination disabled)
            </div>
            <div className="text-sm text-blue-600 font-medium">
              Ready for export
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
                    <p className="text-sm text-gray-600">Student Name</p>
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
                    <p className="text-sm text-gray-600">Gender</p>
                    <p className="font-medium">{viewingStudent.gender || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-medium">{viewingStudent.age || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-sm break-all">{viewingStudent.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">WhatsApp Number</p>
                    <p className="font-medium">{viewingStudent.whatsappNumber || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{viewingStudent.address || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Parent Details</p>
                    <p className="font-medium">{viewingStudent.parentDetails || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Password</p>
                    <div className="flex items-center">
                      <p className="font-mono text-sm flex-1">
                        {visiblePasswords[viewingStudent.id] ? viewingStudent.password : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
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
                  <div>
                    <p className="text-sm text-gray-600">School</p>
                    <p className="font-medium">{viewingStudent.schoolName || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Class</p>
                    <p className="font-medium">{viewingStudent.class || '-'}</p>
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