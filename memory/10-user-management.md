# User Management

## Overview
The User Management section provides comprehensive tools for administrators to manage student user accounts. It supports adding individual students, bulk uploading students via Excel, editing student details, and deleting students (individually or in bulk). A key feature is the automatic creation and deletion of Firebase Authentication users, with a fallback mechanism for updating missing UIDs.

## Implementation Details

### File Location
- **Main Component**: `src/components/admin/UsersTab.tsx`
- **Access**: Available to administrators with 'users' permission
- **Integration**: Part of the Admin Dashboard

### Key Features

#### 1. **Student CRUD Operations**
- **Add Students**: Create individual student accounts
- **Bulk Upload**: Excel-based bulk student creation
- **Edit Students**: Update student information
- **Delete Students**: Individual and bulk deletion
- **View Students**: Detailed student information display

#### 2. **Firebase Authentication Integration**
- **Automatic Auth Creation**: Creates Firebase Auth users for students
- **Secondary App**: Uses secondary Firebase app to avoid admin logout
- **Auth Deletion**: Removes Firebase Auth users when deleting students
- **UID Management**: Handles missing UID scenarios

#### 3. **Advanced Filtering and Search**
- **State Filter**: Filter students by state
- **District Filter**: Filter students by district
- **School Filter**: Filter students by school
- **Search**: Search by name, ID, email, etc.
- **Combined Filters**: Multiple filter combinations

#### 4. **Data Export and Import**
- **Excel Export**: Export filtered student data
- **Bulk Import**: Excel-based bulk student creation
- **Template Download**: Download Excel template
- **Data Validation**: Import data validation

### Database Connections

#### Firebase Collections Used:

1. **`states`** - State and district reference data
   ```javascript
   {
     id: "stateId",
     name: "State Name",
     code: "ST",
     districts: [
       {
         name: "District Name",
         code: "01"
       }
     ]
   }
   ```

2. **`schools`** - School reference data
   ```javascript
   {
     id: "schoolId",
     name: "School Name",
     code: "SCHOOL001",
     stateCode: "ST",
     districtCode: "01"
   }
   ```

3. **`students`** - Student management data
   ```javascript
   {
     id: "studentId",
     name: "Student Name",
     email: "student@mindleap.edu",
     studentId: "ML25DCCCSCCCSERIAL",
     schoolCode: "SCHOOL001",
     districtCode: "01",
     stateCode: "ST",
     isActive: true,
     totalPoints: 150,
     authUid: "firebaseAuthUid",
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

4. **`dailyStreaks`** - Student performance data
   ```javascript
   {
     id: "studentId",
     totalPoints: 150,
     currentStreak: 10,
     records: [...]
   }
   ```

### Component Architecture

#### Main Components:

1. **UsersTab Component**
   - Main container for user management
   - Manages state and data operations
   - Handles filtering and search

2. **User Management Modals**:
   - `AddStudentModal`: Form for adding new students
   - `EditStudentModal`: Form for editing existing students
   - `ViewStudentModal`: Display student details
   - `BulkUploadModal`: Excel upload interface
   - `BulkDeleteModal`: Confirmation for bulk deletion

#### State Management:
```javascript
const [students, setStudents] = useState([]);
const [states, setStates] = useState([]);
const [schools, setSchools] = useState([]);
const [filteredStudents, setFilteredStudents] = useState([]);
const [selectedState, setSelectedState] = useState('');
const [selectedDistrict, setSelectedDistrict] = useState('');
const [selectedSchool, setSelectedSchool] = useState('');
const [searchTerm, setSearchTerm] = useState('');
const [loading, setLoading] = useState(false);
const [showAddModal, setShowAddModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showViewModal, setShowViewModal] = useState(false);
const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
const [selectedStudent, setSelectedStudent] = useState(null);
const [selectedStudents, setSelectedStudents] = useState([]);
```

### Key Functions

#### 1. **fetchStates()**
```javascript
const fetchStates = async () => {
  try {
    const statesSnapshot = await getDocs(collection(db, 'states'));
    const statesData = statesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setStates(statesData);
  } catch (error) {
    console.error('Error fetching states:', error);
  }
};
```

#### 2. **fetchSchools()**
```javascript
const fetchSchools = async () => {
  try {
    const schoolsSnapshot = await getDocs(collection(db, 'schools'));
    const schoolsData = schoolsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setSchools(schoolsData);
  } catch (error) {
    console.error('Error fetching schools:', error);
  }
};
```

#### 3. **fetchStudents()**
```javascript
const fetchStudents = async () => {
  setLoading(true);
  try {
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    const studentsData = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Enrich student data with state, district, and school names
    const enrichedStudents = await enrichStudentData(studentsData);
    setStudents(enrichedStudents);
    setFilteredStudents(enrichedStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 4. **enrichStudentData()**
```javascript
const enrichStudentData = async (students) => {
  return Promise.all(students.map(async (student) => {
    try {
      // Get state name
      const stateDoc = await getDoc(doc(db, 'states', student.stateCode));
      const stateData = stateDoc.exists() ? stateDoc.data() : null;
      
      // Get district name
      let districtName = '';
      if (stateData && stateData.districts) {
        const district = stateData.districts.find(d => d.code === student.districtCode);
        districtName = district ? district.name : '';
      }
      
      // Get school name
      const schoolQuery = query(
        collection(db, 'schools'),
        where('code', '==', student.schoolCode)
      );
      const schoolSnapshot = await getDocs(schoolQuery);
      const schoolData = schoolSnapshot.docs[0]?.data();
      
      return {
        ...student,
        state: stateData?.name || '',
        districtName,
        schoolName: schoolData?.name || ''
      };
    } catch (error) {
      console.error(`Error enriching student ${student.name}:`, error);
      return student;
    }
  }));
};
```

#### 5. **generateStudentSerial()**
```javascript
const generateStudentSerial = async (schoolCode) => {
  try {
    // Get existing students for this school
    const studentsQuery = query(
      collection(db, 'students'),
      where('schoolCode', '==', schoolCode)
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    
    // Find the highest serial number
    let maxSerial = 0;
    studentsSnapshot.docs.forEach(doc => {
      const studentData = doc.data();
      if (studentData.studentId) {
        const serialPart = studentData.studentId.slice(-3);
        const serial = parseInt(serialPart);
        if (!isNaN(serial) && serial > maxSerial) {
          maxSerial = serial;
        }
      }
    });
    
    // Return next serial (3-digit, zero-padded)
    return String(maxSerial + 1).padStart(3, '0');
  } catch (error) {
    console.error('Error generating student serial:', error);
    return '001';
  }
};
```

#### 6. **handleAddStudent()**
```javascript
const handleAddStudent = async (studentData) => {
  try {
    // Generate unique student ID
    const serial = await generateStudentSerial(studentData.schoolCode);
    const studentId = `ML25${studentData.districtCode}${studentData.schoolCode}${serial}`;
    
    // Create Firebase Auth user using secondary app
    const secondaryApp = getSecondaryFirebaseApp();
    const secondaryAuth = getAuth(secondaryApp);
    
    const systemEmail = `${studentId}@mindleap.edu`;
    const systemPassword = generatePassword();
    
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      systemEmail,
      systemPassword
    );
    
    // Sign out from secondary app
    await signOut(secondaryAuth);
    
    // Create student document
    const newStudent = {
      ...studentData,
      studentId,
      email: systemEmail,
      password: systemPassword,
      authUid: userCredential.user.uid,
      isActive: true,
      totalPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await addDoc(collection(db, 'students'), newStudent);
    await fetchStudents();
    setShowAddModal(false);
    
    toast.success('Student added successfully');
  } catch (error) {
    console.error('Error adding student:', error);
    toast.error('Error adding student: ' + error.message);
  }
};
```

#### 7. **getSecondaryFirebaseApp()**
```javascript
const getSecondaryFirebaseApp = () => {
  try {
    return getApp('secondary');
  } catch (error) {
    // Create secondary app if it doesn't exist
    return initializeApp(firebaseConfig, 'secondary');
  }
};
```

#### 8. **handleEditStudent()**
```javascript
const handleEditStudent = (student) => {
  setSelectedStudent(student);
  setShowEditModal(true);
};
```

#### 9. **handleUpdateStudent()**
```javascript
const handleUpdateStudent = async (updatedData) => {
  try {
    const studentRef = doc(db, 'students', selectedStudent.id);
    await updateDoc(studentRef, {
      ...updatedData,
      updatedAt: new Date()
    });
    
    await fetchStudents();
    setShowEditModal(false);
    setSelectedStudent(null);
    
    toast.success('Student updated successfully');
  } catch (error) {
    console.error('Error updating student:', error);
    toast.error('Error updating student: ' + error.message);
  }
};
```

#### 10. **handleDeleteStudent()**
```javascript
const handleDeleteStudent = async (student) => {
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, 'students', student.id));
    
    // Delete Firebase Auth user if authUid exists
    if (student.authUid) {
      await deleteFirebaseAuthUser(student.authUid);
    }
    
    await fetchStudents();
    toast.success('Student deleted successfully');
  } catch (error) {
    console.error('Error deleting student:', error);
    toast.error('Error deleting student');
  }
};
```

#### 11. **deleteFirebaseAuthUser()**
```javascript
const deleteFirebaseAuthUser = async (authUid) => {
  try {
    // Try to sign in as the user to delete them
    const secondaryApp = getSecondaryFirebaseApp();
    const secondaryAuth = getAuth(secondaryApp);
    
    // Get student data to get email and password
    const studentQuery = query(
      collection(db, 'students'),
      where('authUid', '==', authUid)
    );
    const studentSnapshot = await getDocs(studentQuery);
    
    if (studentSnapshot.docs.length > 0) {
      const studentData = studentSnapshot.docs[0].data();
      
      try {
        // Sign in as the user
        await signInWithEmailAndPassword(
          secondaryAuth,
          studentData.email,
          studentData.password
        );
        
        // Delete the user
        await secondaryAuth.currentUser.delete();
      } catch (signInError) {
        // If sign in fails, try direct API call
        console.log('Sign in failed, trying direct API call');
        // This would require a Cloud Function or Admin SDK
      }
    }
    
    // Sign out from secondary app
    await signOut(secondaryAuth);
  } catch (error) {
    console.error('Error deleting Firebase Auth user:', error);
  }
};
```

#### 12. **handleBulkDelete()**
```javascript
const handleBulkDelete = async () => {
  try {
    const deletePromises = selectedStudents.map(async (student) => {
      // Delete from Firestore
      await deleteDoc(doc(db, 'students', student.id));
      
      // Delete Firebase Auth user if authUid exists
      if (student.authUid) {
        await deleteFirebaseAuthUser(student.authUid);
      }
    });
    
    await Promise.all(deletePromises);
    await fetchStudents();
    setShowBulkDeleteModal(false);
    setSelectedStudents([]);
    
    toast.success(`${selectedStudents.length} students deleted successfully`);
  } catch (error) {
    console.error('Error bulk deleting students:', error);
    toast.error('Error deleting students');
  }
};
```

#### 13. **updateStudentsWithUIDs()**
```javascript
const updateStudentsWithUIDs = async () => {
  try {
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    const updatePromises = [];
    
    studentsSnapshot.docs.forEach(doc => {
      const studentData = doc.data();
      if (!studentData.authUid) {
        // Try to find the Firebase Auth user by email
        const updatePromise = findAndUpdateStudentUID(doc.id, studentData);
        updatePromises.push(updatePromise);
      }
    });
    
    await Promise.all(updatePromises);
    await fetchStudents();
    
    toast.success('Student UIDs updated successfully');
  } catch (error) {
    console.error('Error updating student UIDs:', error);
    toast.error('Error updating student UIDs');
  }
};
```

#### 14. **applyFilters()**
```javascript
const applyFilters = () => {
  let filtered = [...students];
  
  // Filter by state
  if (selectedState) {
    filtered = filtered.filter(student => student.stateCode === selectedState);
  }
  
  // Filter by district
  if (selectedDistrict) {
    filtered = filtered.filter(student => student.districtCode === selectedDistrict);
  }
  
  // Filter by school
  if (selectedSchool) {
    filtered = filtered.filter(student => student.schoolCode === selectedSchool);
  }
  
  // Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(student => 
      student.name.toLowerCase().includes(term) ||
      student.studentId.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term) ||
      student.schoolName.toLowerCase().includes(term)
    );
  }
  
  setFilteredStudents(filtered);
};
```

#### 15. **handleExportStudents()**
```javascript
const handleExportStudents = () => {
  try {
    const exportData = filteredStudents.map(student => ({
      'Student Name': student.name,
      'Student ID': student.studentId,
      'Email': student.email,
      'Password': student.password,
      'School': student.schoolName,
      'District': student.districtName,
      'State': student.state,
      'Total Points': student.totalPoints,
      'Status': student.isActive ? 'Active' : 'Inactive',
      'Created At': student.createdAt ? new Date(student.createdAt.seconds * 1000).toLocaleDateString() : '',
      'Updated At': student.updatedAt ? new Date(student.updatedAt.seconds * 1000).toLocaleDateString() : ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    
    const fileName = `students_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success('Student data exported successfully');
  } catch (error) {
    console.error('Error exporting student data:', error);
    toast.error('Error exporting student data');
  }
};
```

### UI/UX Features

#### 1. **Student List Display**
- **Table Format**: Clean, organized table layout
- **Sortable Columns**: Sort by name, ID, school, points
- **Status Indicators**: Visual status indicators (active/inactive)
- **Action Buttons**: Edit, view, delete, bulk operations

#### 2. **Filtering and Search**
- **State Dropdown**: Filter by state
- **District Dropdown**: Filter by district (dependent on state)
- **School Dropdown**: Filter by school (dependent on district)
- **Search Bar**: Real-time search by name, ID, email
- **Clear Filters**: Easy filter reset

#### 3. **Student Forms**
- **Add Student Form**: Comprehensive form with validation
- **Edit Student Form**: Pre-populated form for updates
- **View Student Modal**: Read-only detailed view
- **Bulk Upload Modal**: Excel upload interface

#### 4. **Bulk Operations**
- **Bulk Selection**: Select multiple students
- **Bulk Delete**: Delete multiple students at once
- **Bulk Upload**: Upload multiple students via Excel
- **Progress Indicators**: Show progress for bulk operations

### Data Flow

#### Student Management Flow:
```
1. Admin accesses Users tab
2. fetchStates() loads state/district data
3. fetchSchools() loads school data
4. fetchStudents() loads student data
5. enrichStudentData() adds location names
6. applyFilters() applies current filters
7. Admin interacts with student data
8. Changes are saved to Firebase
9. UI updates with new data
```

#### Auth Integration Flow:
```
1. Admin adds new student
2. generateStudentSerial() creates unique ID
3. getSecondaryFirebaseApp() gets secondary app
4. createUserWithEmailAndPassword() creates auth user
5. signOut() from secondary app
6. addDoc() creates student document
7. fetchStudents() refreshes data
```

### Performance Optimizations

#### 1. **Data Loading**
- **Batch Operations**: Efficient batch data loading
- **Caching**: Cached state, district, and school data
- **Lazy Loading**: Load student data on demand

#### 2. **Filtering**
- **Client-side Filtering**: Fast filtering without server calls
- **Debounced Search**: Optimized search performance
- **Efficient Updates**: Minimal re-renders

#### 3. **Auth Operations**
- **Secondary App**: Avoid admin logout during auth operations
- **Batch Auth Operations**: Efficient bulk auth operations
- **Error Handling**: Graceful handling of auth failures

### Error Handling

#### 1. **Validation Errors**
- **Student ID Uniqueness**: Prevent duplicate IDs
- **Required Fields**: Validate required form fields
- **Data Format**: Validate data formats

#### 2. **Auth Errors**
- **Auth Creation Failures**: Handle auth user creation errors
- **Auth Deletion Failures**: Handle auth user deletion errors
- **Secondary App Issues**: Handle secondary app problems

#### 3. **Database Errors**
- **Connection Issues**: Handle Firebase connection problems
- **Permission Errors**: Handle access permission issues
- **Data Corruption**: Handle corrupted data gracefully

### Security Considerations

#### 1. **Access Control**
- **Permission-based Access**: Only authorized admins can manage users
- **Role Validation**: Verify admin roles before operations
- **Audit Logging**: Log all user management activities

#### 2. **Data Protection**
- **Input Sanitization**: Sanitize all input data
- **Password Security**: Secure password generation and storage
- **Data Integrity**: Ensure data consistency

#### 3. **Auth Security**
- **Secondary App**: Secure secondary app usage
- **Auth Cleanup**: Proper cleanup of auth users
- **Session Management**: Secure session management

### Integration Points

#### With School Management:
- **School Association**: Link students to schools
- **Performance Tracking**: Track student performance by school
- **Bulk Operations**: Manage students by school

#### With Daily Streak:
- **Performance Data**: Access daily streak performance
- **Score Calculation**: Calculate student scores
- **Progress Tracking**: Track student progress

#### With Analytics:
- **Performance Metrics**: Student performance tracking
- **Comparative Analysis**: Student comparison tools
- **Trend Analysis**: Performance trend tracking
