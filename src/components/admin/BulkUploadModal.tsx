import React, { useState, useEffect } from 'react';
import { Upload, Download, FileText, Check, AlertCircle, X, ChevronRight, Users, School, MapPin, CheckSquare, Square } from 'lucide-react';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { db } from '../../lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { useToast } from '@/hooks/use-toast';
import { generatePassword } from '../../utils/studentIdGenerator';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface District {
  districtName: string;
  districtCode: string;
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

interface BulkStudent {
  name: string;
  stateCode: string;
  schoolCode: string;
  districtCode: string;
  class?: string;
  gender?: string;
  age?: string;
  parentDetails?: string;
  whatsappNumber?: string;
  email?: string;
  address?: string;
  rowNumber: number;
}

interface ProcessedStudent {
  name: string;
  studentId: string;
  stateCode: string;
  districtCode: string;
  schoolCode: string;
  password: string;
  email: string;
  status: 'success' | 'failed';
  error?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  studentName?: string;
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (students: ProcessedStudent[]) => void;
}

// Secondary Firebase app for bulk student creation
const secondaryApp = initializeApp({
  apiKey: "AIzaSyC7a43eeu9vH4fGeQfUuBpphpW7zuE8dBA",
  authDomain: "test-mindleap.firebaseapp.com",
  projectId: "test-mindleap",
  storageBucket: "test-mindleap.firebasestorage.app",
  messagingSenderId: "402749246470",
  appId: "1:402749246470:web:c3411e9ccde8a419fbc787"
}, "bulkUpload");

const secondaryAuth = getAuth(secondaryApp);

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState<'selection' | 'upload' | 'validation' | 'processing' | 'results'>('selection');
  const [isLoading, setIsLoading] = useState(false);
  
  // Multiple Selection States
  const [states, setStates] = useState<State[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  
  // File Upload and Validation
  const [uploadedStudents, setUploadedStudents] = useState<BulkStudent[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [validStudents, setValidStudents] = useState<BulkStudent[]>([]);
  
  // Processing and Results
  const [processedStudents, setProcessedStudents] = useState<ProcessedStudent[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  
  const { toast } = useToast();

  // Get available districts and schools based on selections
  const availableDistricts = states
    .filter(state => selectedStates.includes(state.stateName))
    .flatMap(state => state.districts)
    .filter((district, index, self) => 
      index === self.findIndex(d => d.districtCode === district.districtCode)
    );

  const availableSchools = schools.filter(school => 
    selectedStates.includes(school.state) &&
    selectedDistricts.includes(school.districtCode) &&
    school.status === 'active'
  );

  useEffect(() => {
    if (isOpen) {
      fetchStates();
      fetchSchools();
    }
  }, [isOpen]);

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
    } catch (error) {
      console.error('Error fetching states:', error);
      toast({
        title: "Error",
        description: "Failed to fetch states",
        variant: "destructive"
      });
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
    } catch (error) {
      console.error('Error fetching schools:', error);
      toast({
        title: "Error",
        description: "Failed to fetch schools",
        variant: "destructive"
      });
    }
  };

  const toggleStateSelection = (stateName: string) => {
    setSelectedStates(prev => {
      const newSelection = prev.includes(stateName) 
        ? prev.filter(s => s !== stateName)
        : [...prev, stateName];
      
      // Clear dependent selections when state changes
      if (!prev.includes(stateName)) {
        // State was added, keep existing selections
        return newSelection;
      } else {
        // State was removed, clear dependent selections
        const removedState = states.find(s => s.stateName === stateName);
        if (removedState) {
          const districtCodesToRemove = removedState.districts.map(d => d.districtCode);
          setSelectedDistricts(prev => prev.filter(d => !districtCodesToRemove.includes(d)));
          setSelectedSchools(prev => prev.filter(s => {
            const school = schools.find(school => school.schoolCode === s);
            return school ? !districtCodesToRemove.includes(school.districtCode) : false;
          }));
        }
        return newSelection;
      }
    });
  };

  const toggleDistrictSelection = (districtCode: string) => {
    setSelectedDistricts(prev => {
      const newSelection = prev.includes(districtCode) 
        ? prev.filter(d => d !== districtCode)
        : [...prev, districtCode];
      
      // Clear dependent school selections when district changes
      if (prev.includes(districtCode)) {
        // District was removed, clear related schools
        setSelectedSchools(prev => prev.filter(s => {
          const school = schools.find(school => school.schoolCode === s);
          return school ? school.districtCode !== districtCode : false;
        }));
      }
      
      return newSelection;
    });
  };

  const toggleSchoolSelection = (schoolCode: string) => {
    setSelectedSchools(prev => 
      prev.includes(schoolCode) 
        ? prev.filter(s => s !== schoolCode)
        : [...prev, schoolCode]
    );
  };

  const downloadTemplate = () => {
    if (selectedStates.length === 0 || selectedDistricts.length === 0 || selectedSchools.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one state, district, and school before downloading template",
        variant: "destructive"
      });
      return;
    }

        const templateData = [
      ['State Code', 'District Code', 'School Code', 'Student Name', 'Class', 'Gender', 'Age', 'Parent Details', 'WhatsApp Number', 'Email', 'Address']
    ];

    // Add sample data for each selected combination
    selectedStates.forEach(stateName => {
      const state = states.find(s => s.stateName === stateName);
      if (!state) return;

      selectedDistricts.forEach(districtCode => {
        const district = state.districts.find(d => d.districtCode === districtCode);
        if (!district) return;

        selectedSchools.forEach(schoolCode => {
          const school = schools.find(s => s.schoolCode === schoolCode && s.districtCode === districtCode);
          if (!school) return;

          // Format school code with proper padding (01, 02, etc.)
          const formattedSchoolCode = schoolCode.padStart(2, '0');
          
          // Add sample students for this combination
          templateData.push([state.stateCode, districtCode, formattedSchoolCode, 'John Doe', '10', 'M', '16', 'Mr. John Sr.', '9876543210', 'john@example.com', '123 Main St']);
          templateData.push([state.stateCode, districtCode, formattedSchoolCode, 'Jane Smith', '9', 'F', '15', 'Mrs. Jane Sr.', '9876543211', 'jane@example.com', '456 Oak Ave']);
        });
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, `bulk_upload_template_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Template Downloaded",
      description: `Excel template has been downloaded with ${templateData.length - 1} sample entries`,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      // Handle CSV files
      Papa.parse(file, {
        complete: (results) => {
          processUploadedData(results.data as string[][]);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          toast({
            title: "Error",
            description: "Failed to parse CSV file. Please check the format.",
            variant: "destructive"
          });
        }
      });
    } else {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          processUploadedData(jsonData as string[][]);
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          toast({
            title: "Error",
            description: "Failed to parse Excel file. Please check the format.",
            variant: "destructive"
          });
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processUploadedData = (jsonData: string[][]) => {
    try {

      if (jsonData.length < 2) {
        toast({
          title: "Error",
          description: "File must contain at least one student record",
          variant: "destructive"
        });
        return;
      }

      const students: BulkStudent[] = [];
      const headers = jsonData[0] as string[];
      
      // Validate headers
      const expectedHeaders = ['State Code', 'District Code', 'School Code', 'Student Name'];
      const hasValidHeaders = expectedHeaders.every(header => 
        headers.some(h => h?.toLowerCase().includes(header.toLowerCase()))
      );

      if (!hasValidHeaders) {
        toast({
          title: "Invalid File Format",
          description: "File must contain columns: State Code, District Code, School Code, Student Name",
          variant: "destructive"
        });
        return;
      }

      // Get column indices for additional fields
      const getColumnIndex = (columnName: string) => {
        return headers.findIndex(h => h?.toLowerCase().includes(columnName.toLowerCase()));
      };

      const classIndex = getColumnIndex('class');
      const genderIndex = getColumnIndex('gender');
      const ageIndex = getColumnIndex('age');
      const parentIndex = getColumnIndex('parent');
      const whatsappIndex = getColumnIndex('whatsapp');
      const emailIndex = getColumnIndex('email');
      const addressIndex = getColumnIndex('address');

      // Process data rows
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as string[];
        if (row.length >= 4 && row.some(cell => cell?.toString().trim())) {
          students.push({
            stateCode: row[0]?.toString().trim() || '',
            districtCode: row[1]?.toString().trim() || '',
            schoolCode: row[2]?.toString().trim().padStart(2, '0') || '', // Pad school code
            name: row[3]?.toString().trim() || '',
            class: classIndex >= 0 ? row[classIndex]?.toString().trim() : '',
            gender: genderIndex >= 0 ? row[genderIndex]?.toString().trim() : '',
            age: ageIndex >= 0 ? row[ageIndex]?.toString().trim() : '',
            parentDetails: parentIndex >= 0 ? row[parentIndex]?.toString().trim() : '',
            whatsappNumber: whatsappIndex >= 0 ? row[whatsappIndex]?.toString().trim() : '',
            email: emailIndex >= 0 ? row[emailIndex]?.toString().trim() : '',
            address: addressIndex >= 0 ? row[addressIndex]?.toString().trim() : '',
            rowNumber: i + 1
          });
        }
      }

      if (students.length === 0) {
        toast({
          title: "Error",
          description: "No valid student records found in file",
          variant: "destructive"
        });
        return;
      }

      setUploadedStudents(students);
      validateUploadedData(students);
      setCurrentStep('validation');
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Error",
        description: "Failed to process file. Please check the format.",
        variant: "destructive"
      });
    }
  };

  const validateUploadedData = (students: BulkStudent[]) => {
    const errors: ValidationError[] = [];
    const valid: BulkStudent[] = [];

    students.forEach((student) => {
      let hasError = false;

      // Validate state code
      const state = states.find(s => s.stateCode === student.stateCode);
      if (!state) {
        errors.push({
          row: student.rowNumber,
          field: 'State Code',
          message: `Invalid state code "${student.stateCode}"`
        });
        hasError = true;
      } else if (!selectedStates.includes(state.stateName)) {
        errors.push({
          row: student.rowNumber,
          field: 'State Code',
          message: `State "${state.stateName}" not selected for upload`
        });
        hasError = true;
      }

      // Validate district code
      const district = state?.districts.find(d => d.districtCode === student.districtCode);
      if (!district) {
        errors.push({
          row: student.rowNumber,
          field: 'District Code',
          message: `Invalid district code "${student.districtCode}" for state "${student.stateCode}"`
        });
        hasError = true;
      } else if (!selectedDistricts.includes(student.districtCode)) {
        errors.push({
          row: student.rowNumber,
          field: 'District Code',
          message: `District "${district.districtName}" not selected for upload`
        });
        hasError = true;
      }

      // Validate school code
      const school = schools.find(s => 
        s.schoolCode === student.schoolCode && 
        s.districtCode === student.districtCode &&
        s.state === state?.stateName
      );
      if (!school) {
        errors.push({
          row: student.rowNumber,
          field: 'School Code',
          message: `Invalid school code "${student.schoolCode}" for district "${student.districtCode}"`
        });
        hasError = true;
      } else if (!selectedSchools.includes(student.schoolCode)) {
        errors.push({
          row: student.rowNumber,
          field: 'School Code',
          message: `School "${school.name}" not selected for upload`
        });
        hasError = true;
      }

      // Validate student name
      if (!student.name || student.name.length < 2) {
        errors.push({
          row: student.rowNumber,
          field: 'Student Name',
          message: 'Student name is required and must be at least 2 characters',
          studentName: student.name
        });
        hasError = true;
      }

      // Validate class if provided
      if (student.class && !['8', '9', '10'].includes(student.class)) {
        errors.push({
          row: student.rowNumber,
          field: 'Class',
          message: `Invalid class "${student.class}". Must be 8, 9, or 10`,
          studentName: student.name
        });
        hasError = true;
      }

      // Validate gender if provided
      if (student.gender && !['M', 'F', 'Male', 'Female'].includes(student.gender)) {
        errors.push({
          row: student.rowNumber,
          field: 'Gender',
          message: `Invalid gender "${student.gender}". Must be M, F, Male, or Female`,
          studentName: student.name
        });
        hasError = true;
      }

      // Validate age if provided
      if (student.age && (isNaN(Number(student.age)) || Number(student.age) < 10 || Number(student.age) > 20)) {
        errors.push({
          row: student.rowNumber,
          field: 'Age',
          message: `Invalid age "${student.age}". Must be between 10 and 20`,
          studentName: student.name
        });
        hasError = true;
      }

      // Validate WhatsApp number if provided
      if (student.whatsappNumber && !/^\d{10}$/.test(student.whatsappNumber)) {
        errors.push({
          row: student.rowNumber,
          field: 'WhatsApp Number',
          message: `Invalid WhatsApp number "${student.whatsappNumber}". Must be 10 digits`,
          studentName: student.name
        });
        hasError = true;
      }

      // Validate email if provided
      if (student.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
        errors.push({
          row: student.rowNumber,
          field: 'Email',
          message: `Invalid email format "${student.email}"`,
          studentName: student.name
        });
        hasError = true;
      }

      if (!hasError) {
        valid.push(student);
      }
    });

    setValidationErrors(errors);
    setValidStudents(valid);
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

  const processStudents = async () => {
    setIsLoading(true);
    setCurrentStep('processing');
    setProcessingProgress(0);
    setProcessingStatus('Initializing...');

    const processed: ProcessedStudent[] = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < validStudents.length; i++) {
        const student = validStudents[i];
        setProcessingStatus(`Processing ${student.name}... (${i + 1}/${validStudents.length})`);
        
        try {
          const serial = await generateStudentSerial(student.schoolCode);
          const studentId = `${student.stateCode}25${student.districtCode}${student.schoolCode}${serial}`;
          const password = generatePassword();
          const email = `${studentId}@mindleap.edu`;

          // Create Firebase Auth account
          const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
          const firebaseUser = userCredential.user;

          // Store in Firestore with all fields
          await addDoc(collection(db, 'students'), {
            uid: firebaseUser.uid,
            name: student.name,
            studentId: studentId,
            stateCode: student.stateCode,
            districtCode: student.districtCode,
            schoolCode: student.schoolCode,
            password: password,
            email: email,
            class: student.class || '',
            gender: student.gender || '',
            age: student.age || '',
            parentDetails: student.parentDetails || '',
            whatsappNumber: student.whatsappNumber || '',
            studentEmail: student.email || '',
            address: student.address || '',
            createdAt: new Date().toISOString()
          });

          processed.push({
            name: student.name,
            studentId,
            stateCode: student.stateCode,
            districtCode: student.districtCode,
            schoolCode: student.schoolCode,
            password,
            email,
            status: 'success'
          });

          successCount++;
        } catch (error) {
          console.error(`Error processing student ${student.name}:`, error);
          processed.push({
            name: student.name,
            studentId: '',
            stateCode: student.stateCode,
            districtCode: student.districtCode,
            schoolCode: student.schoolCode,
            password: '',
            email: '',
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          failedCount++;
        }

        setProcessingProgress(((i + 1) / validStudents.length) * 100);
      }

      // Sign out from secondary auth
      await secondaryAuth.signOut();

      setProcessedStudents(processed);
      setSuccessCount(successCount);
      setFailedCount(failedCount);
      setCurrentStep('results');

      // Success toast
      if (successCount > 0) {
        toast({
          title: "Students Created Successfully!",
          description: `${successCount} students created successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        });
      }

      if (failedCount > 0) {
        toast({
          title: "Some Students Failed",
          description: `${failedCount} students failed to create. Please check the results.`,
          variant: "destructive"
        });
      }

      onSuccess(processed.filter(s => s.status === 'success'));
    } catch (error) {
      console.error('Error in bulk processing:', error);
      toast({
        title: "Processing Failed",
        description: "An error occurred during bulk processing. Please try again.",
        variant: "destructive"
      });
      setCurrentStep('validation');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadResults = () => {
    const headers = ['Student Name', 'Student ID', 'State Code', 'District Code', 'School Code', 'Password', 'Email', 'Status', 'Error'];
    const data = processedStudents.map(student => [
      student.name,
      student.studentId,
      student.stateCode,
      student.districtCode,
      student.schoolCode,
      student.password,
      student.email,
      student.status,
      student.error || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, `bulk_upload_results_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Results Downloaded",
      description: "Bulk upload results have been downloaded",
    });
  };

  const resetModal = () => {
    setCurrentStep('selection');
    setSelectedStates([]);
    setSelectedDistricts([]);
    setSelectedSchools([]);
    setUploadedStudents([]);
    setValidationErrors([]);
    setValidStudents([]);
    setProcessedStudents([]);
    setProcessingProgress(0);
    setProcessingStatus('');
    setSuccessCount(0);
    setFailedCount(0);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const canProceedToUpload = selectedStates.length > 0 && selectedDistricts.length > 0 && selectedSchools.length > 0;
  const canProcessStudents = validStudents.length > 0 && validationErrors.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800 font-poppins flex items-center gap-2">
            <Users className="w-6 h-6" />
            Enhanced Bulk Upload Students
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-between text-sm">
            {['Selection', 'Upload', 'Validation', 'Processing', 'Results'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  ['selection', 'upload', 'validation', 'processing', 'results'][index] === currentStep ||
                  ['selection', 'upload', 'validation', 'processing', 'results'].indexOf(currentStep) > index
                    ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <span className={`ml-2 ${
                  ['selection', 'upload', 'validation', 'processing', 'results'][index] === currentStep
                    ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {step}
                </span>
                {index < 4 && <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />}
              </div>
            ))}
          </div>

          {/* Step 1: Multiple State, District, School Selection */}
          {currentStep === 'selection' && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Multiple Selection Mode</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Select multiple states, districts, and schools for bulk upload. Use checkboxes to select multiple options.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* States Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    States * ({selectedStates.length} selected)
                  </label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {states.map((state) => (
                      <div key={state.id} className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => toggleStateSelection(state.stateName)}
                          className="flex items-center space-x-2 text-sm hover:bg-gray-50 p-1 rounded w-full text-left"
                        >
                          {selectedStates.includes(state.stateName) ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="flex-1">{state.stateName} ({state.stateCode})</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Districts Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <School className="w-4 h-4" />
                    Districts * ({selectedDistricts.length} selected)
                  </label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {availableDistricts.length === 0 ? (
                      <p className="text-gray-500 text-sm">Select states first</p>
                    ) : (
                      availableDistricts.map((district) => (
                        <div key={district.districtCode} className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => toggleDistrictSelection(district.districtCode)}
                            className="flex items-center space-x-2 text-sm hover:bg-gray-50 p-1 rounded w-full text-left"
                          >
                            {selectedDistricts.includes(district.districtCode) ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="flex-1">{district.districtName} ({district.districtCode})</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Schools Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Schools * ({selectedSchools.length} selected)
                  </label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {availableSchools.length === 0 ? (
                      <p className="text-gray-500 text-sm">Select states and districts first</p>
                    ) : (
                      availableSchools.map((school) => (
                        <div key={school.id} className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => toggleSchoolSelection(school.schoolCode)}
                            className="flex items-center space-x-2 text-sm hover:bg-gray-50 p-1 rounded w-full text-left"
                          >
                            {selectedSchools.includes(school.schoolCode) ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="flex-1">{school.name} ({school.schoolCode})</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Selection Summary */}
              {canProceedToUpload && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">Selection Summary</h3>
                  </div>
                  <div className="text-green-700 text-sm space-y-1">
                    <p><strong>States:</strong> {selectedStates.join(', ')}</p>
                    <p><strong>Districts:</strong> {selectedDistricts.length} selected</p>
                    <p><strong>Schools:</strong> {selectedSchools.length} selected</p>
                  </div>
                  <Button
                    onClick={() => setCurrentStep('upload')}
                    className="mt-3 bg-green-500 hover:bg-green-600"
                  >
                    Proceed to Upload
                  </Button>
                </div>
              )}

              {!canProceedToUpload && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-800">Selection Required</h3>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    Please select at least one state, district, and school to proceed with bulk upload.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: File Upload */}
          {currentStep === 'upload' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Upload Excel File</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Upload Excel (.xlsx) or CSV (.csv) file with required columns plus optional fields like Class, Gender, Age, etc.
                </p>
              </div>

              <div className="text-center">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload Excel or CSV File</h3>
                   <p className="text-gray-500 mb-4">
                     Select an Excel (.xlsx) or CSV (.csv) file with student data matching your selections
                   </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Choose Excel/CSV File
                  </label>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Button
                  onClick={() => setCurrentStep('selection')}
                  variant="outline"
                >
                  Back
                </Button>
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Validation Results */}
          {currentStep === 'validation' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Validation Results</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Found {uploadedStudents.length} students, {validStudents.length} valid, {validationErrors.length} errors
                </p>
              </div>

              {validationErrors.length > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800 mb-2">Validation Errors:</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {validationErrors.slice(0, 15).map((error, index) => (
                      <div key={index} className="bg-white p-2 rounded border-l-4 border-red-400">
                        <p className="text-sm text-red-800 font-medium">
                          Row {error.row}{error.studentName ? ` (${error.studentName})` : ''}: {error.field}
                        </p>
                        <p className="text-xs text-red-600 mt-1">{error.message}</p>
                      </div>
                    ))}
                    {validationErrors.length > 15 && (
                      <p className="text-sm text-red-600 text-center">
                        ...and {validationErrors.length - 15} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              {validStudents.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Valid Students ({validStudents.length}):</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validStudents.slice(0, 5).map((student, index) => (
                      <p key={index} className="text-sm text-green-700">
                        {student.name} - {student.stateCode}{student.districtCode}{student.schoolCode}
                      </p>
                    ))}
                    {validStudents.length > 5 && (
                      <p className="text-sm text-green-600">
                        ...and {validStudents.length - 5} more students
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setCurrentStep('upload')}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={processStudents}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
                  disabled={!canProcessStudents}
                >
                  Create Student IDs ({validStudents.length})
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Processing */}
          {currentStep === 'processing' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Processing Students</h3>
                </div>
                <p className="text-blue-700 text-sm">
                  Creating student accounts and generating IDs...
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(processingProgress)}%</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
                <p className="text-center text-sm text-gray-600">{processingStatus}</p>
              </div>
            </div>
          )}

          {/* Step 5: Results */}
          {currentStep === 'results' && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Processing Complete</h3>
                </div>
                <div className="text-green-700 text-sm space-y-1">
                  <p><strong>Total Students:</strong> {processedStudents.length}</p>
                  <p><strong>Successful:</strong> {successCount}</p>
                  <p><strong>Failed:</strong> {failedCount}</p>
                </div>
              </div>

              {processedStudents.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Sample Results:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {processedStudents.slice(0, 5).map((student, index) => (
                      <p key={index} className={`text-sm ${student.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                        {student.name} - {student.studentId || 'Failed'} ({student.status})
                      </p>
                    ))}
                    {processedStudents.length > 5 && (
                      <p className="text-sm text-gray-600">
                        ...and {processedStudents.length - 5} more results
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={resetModal}
                  variant="outline"
                  className="flex-1"
                >
                  Start New Upload
                </Button>
                <Button
                  onClick={downloadResults}
                  className="flex-1 bg-gradient-to-r from-green-500 to-blue-500"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Results
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadModal;

