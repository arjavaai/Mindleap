# School Management

## Overview
The School Management section is a comprehensive tool for administrators to manage school data, including adding, editing, viewing, activating/deactivating, and deleting school records. It provides filtering, searching, and exporting capabilities, along with school performance scoring based on student daily streak points.

## Implementation Details

### File Location
- **Main Component**: `src/components/admin/SchoolsTab.tsx`
- **Access**: Available to administrators with 'schools' permission
- **Integration**: Part of the Admin Dashboard

### Key Features

#### 1. **School CRUD Operations**
- **Add Schools**: Create new school records with validation
- **Edit Schools**: Update existing school information
- **View Schools**: Detailed school information display
- **Delete Schools**: Remove school records (main admin only)
- **Activate/Deactivate**: Toggle school status

#### 2. **Advanced Filtering and Search**
- **State Filter**: Filter schools by state
- **District Filter**: Filter schools by district
- **Search**: Search by school name or code
- **Combined Filters**: Multiple filter combinations

#### 3. **School Performance Scoring**
- **Score Calculation**: Sum of all student daily streak points
- **Performance Metrics**: Total students, average performance
- **Ranking**: School performance comparison

#### 4. **Data Export**
- **Excel Export**: Export filtered school data
- **Custom Formatting**: Formatted export with all details
- **Filtered Export**: Export only filtered results

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

2. **`schools`** - School management data
   ```javascript
   {
     id: "schoolId",
     name: "School Name",
     code: "SCHOOL001",
     stateCode: "ST",
     districtCode: "01",
     address: "School Address",
     principalName: "Principal Name",
     principalEmail: "principal@school.edu",
     principalPhone: "+1234567890",
     isActive: true,
     totalStudents: 150,
     schoolScore: 2500,
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

3. **`students`** - Student data for score calculation
   ```javascript
   {
     id: "studentId",
     name: "Student Name",
     schoolCode: "SCHOOL001",
     districtCode: "01",
     stateCode: "ST",
     isActive: true
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

1. **SchoolsTab Component**
   - Main container for school management
   - Manages state and data operations
   - Handles filtering and search

2. **School Management Modals**:
   - `AddSchoolModal`: Form for adding new schools
   - `EditSchoolModal`: Form for editing existing schools
   - `ViewSchoolModal`: Display school details
   - `DeleteSchoolModal`: Confirmation for deletion

#### State Management:
```javascript
const [schools, setSchools] = useState([]);
const [states, setStates] = useState([]);
const [filteredSchools, setFilteredSchools] = useState([]);
const [selectedState, setSelectedState] = useState('');
const [selectedDistrict, setSelectedDistrict] = useState('');
const [searchTerm, setSearchTerm] = useState('');
const [loading, setLoading] = useState(false);
const [showAddModal, setShowAddModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showViewModal, setShowViewModal] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [selectedSchool, setSelectedSchool] = useState(null);
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
  setLoading(true);
  try {
    const schoolsSnapshot = await getDocs(collection(db, 'schools'));
    const schoolsData = schoolsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setSchools(schoolsData);
    setFilteredSchools(schoolsData);
  } catch (error) {
    console.error('Error fetching schools:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 3. **fetchSchoolScores()**
```javascript
const fetchSchoolScores = async () => {
  try {
    const schoolsSnapshot = await getDocs(collection(db, 'schools'));
    const schoolsData = schoolsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Calculate scores for each school
    const schoolsWithScores = await Promise.all(
      schoolsData.map(async (school) => {
        try {
          // Get students for this school
          const studentsQuery = query(
            collection(db, 'students'),
            where('schoolCode', '==', school.code),
            where('isActive', '==', true)
          );
          const studentsSnapshot = await getDocs(studentsQuery);
          
          let totalScore = 0;
          let totalStudents = 0;
          
          // Calculate total score from daily streaks
          for (const studentDoc of studentsSnapshot.docs) {
            const studentData = studentDoc.data();
            const streakDoc = await getDoc(doc(db, 'dailyStreaks', studentDoc.id));
            
            if (streakDoc.exists()) {
              const streakData = streakDoc.data();
              totalScore += streakData.totalPoints || 0;
              totalStudents++;
            }
          }
          
          return {
            ...school,
            schoolScore: totalScore,
            totalStudents
          };
        } catch (error) {
          console.error(`Error calculating score for school ${school.name}:`, error);
          return {
            ...school,
            schoolScore: 0,
            totalStudents: 0
          };
        }
      })
    );
    
    setSchools(schoolsWithScores);
    setFilteredSchools(schoolsWithScores);
  } catch (error) {
    console.error('Error fetching school scores:', error);
  }
};
```

#### 4. **handleAddSchool()**
```javascript
const handleAddSchool = async (schoolData) => {
  try {
    // Validate school code uniqueness
    const isCodeUnique = await validateSchoolCode(schoolData.code);
    if (!isCodeUnique) {
      throw new Error('School code already exists');
    }
    
    const newSchool = {
      ...schoolData,
      isActive: true,
      totalStudents: 0,
      schoolScore: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await addDoc(collection(db, 'schools'), newSchool);
    await fetchSchools();
    setShowAddModal(false);
    
    // Show success message
    toast.success('School added successfully');
  } catch (error) {
    console.error('Error adding school:', error);
    toast.error('Error adding school: ' + error.message);
  }
};
```

#### 5. **handleEditSchool()**
```javascript
const handleEditSchool = (school) => {
  setSelectedSchool(school);
  setShowEditModal(true);
};
```

#### 6. **handleUpdateSchool()**
```javascript
const handleUpdateSchool = async (updatedData) => {
  try {
    const schoolRef = doc(db, 'schools', selectedSchool.id);
    await updateDoc(schoolRef, {
      ...updatedData,
      updatedAt: new Date()
    });
    
    await fetchSchools();
    setShowEditModal(false);
    setSelectedSchool(null);
    
    toast.success('School updated successfully');
  } catch (error) {
    console.error('Error updating school:', error);
    toast.error('Error updating school: ' + error.message);
  }
};
```

#### 7. **toggleSchoolStatus()**
```javascript
const toggleSchoolStatus = async (school) => {
  try {
    const schoolRef = doc(db, 'schools', school.id);
    await updateDoc(schoolRef, {
      isActive: !school.isActive,
      updatedAt: new Date()
    });
    
    await fetchSchools();
    toast.success(`School ${school.isActive ? 'deactivated' : 'activated'} successfully`);
  } catch (error) {
    console.error('Error toggling school status:', error);
    toast.error('Error updating school status');
  }
};
```

#### 8. **handleDeleteSchool()**
```javascript
const handleDeleteSchool = async () => {
  try {
    // Check if school has students
    const studentsQuery = query(
      collection(db, 'students'),
      where('schoolCode', '==', selectedSchool.code)
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    
    if (studentsSnapshot.size > 0) {
      toast.error('Cannot delete school with existing students');
      return;
    }
    
    await deleteDoc(doc(db, 'schools', selectedSchool.id));
    await fetchSchools();
    setShowDeleteModal(false);
    setSelectedSchool(null);
    
    toast.success('School deleted successfully');
  } catch (error) {
    console.error('Error deleting school:', error);
    toast.error('Error deleting school');
  }
};
```

#### 9. **validateSchoolCode()**
```javascript
const validateSchoolCode = async (code) => {
  try {
    const schoolsQuery = query(
      collection(db, 'schools'),
      where('code', '==', code)
    );
    const schoolsSnapshot = await getDocs(schoolsQuery);
    return schoolsSnapshot.empty;
  } catch (error) {
    console.error('Error validating school code:', error);
    return false;
  }
};
```

#### 10. **applyFilters()**
```javascript
const applyFilters = () => {
  let filtered = [...schools];
  
  // Filter by state
  if (selectedState) {
    filtered = filtered.filter(school => school.stateCode === selectedState);
  }
  
  // Filter by district
  if (selectedDistrict) {
    filtered = filtered.filter(school => school.districtCode === selectedDistrict);
  }
  
  // Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(school => 
      school.name.toLowerCase().includes(term) ||
      school.code.toLowerCase().includes(term)
    );
  }
  
  setFilteredSchools(filtered);
};
```

#### 11. **exportSchoolData()**
```javascript
const exportSchoolData = () => {
  try {
    const exportData = filteredSchools.map(school => ({
      'School Name': school.name,
      'School Code': school.code,
      'State': school.stateCode,
      'District': school.districtCode,
      'Address': school.address,
      'Principal Name': school.principalName,
      'Principal Email': school.principalEmail,
      'Principal Phone': school.principalPhone,
      'Total Students': school.totalStudents,
      'School Score': school.schoolScore,
      'Status': school.isActive ? 'Active' : 'Inactive',
      'Created At': school.createdAt ? new Date(school.createdAt.seconds * 1000).toLocaleDateString() : '',
      'Updated At': school.updatedAt ? new Date(school.updatedAt.seconds * 1000).toLocaleDateString() : ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Schools');
    
    const fileName = `schools_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success('School data exported successfully');
  } catch (error) {
    console.error('Error exporting school data:', error);
    toast.error('Error exporting school data');
  }
};
```

### UI/UX Features

#### 1. **School List Display**
- **Table Format**: Clean, organized table layout
- **Sortable Columns**: Sort by name, code, score, students
- **Status Indicators**: Visual status indicators (active/inactive)
- **Action Buttons**: Edit, view, delete, toggle status

#### 2. **Filtering and Search**
- **State Dropdown**: Filter by state
- **District Dropdown**: Filter by district (dependent on state)
- **Search Bar**: Real-time search by name or code
- **Clear Filters**: Easy filter reset

#### 3. **School Forms**
- **Add School Form**: Comprehensive form with validation
- **Edit School Form**: Pre-populated form for updates
- **View School Modal**: Read-only detailed view
- **Delete Confirmation**: Safe deletion with confirmation

#### 4. **Performance Display**
- **Score Visualization**: Clear score display
- **Student Count**: Total student count per school
- **Performance Ranking**: Visual ranking indicators
- **Export Options**: Excel export functionality

### Data Flow

#### School Management Flow:
```
1. Admin accesses Schools tab
2. fetchStates() loads state/district data
3. fetchSchools() loads school data
4. fetchSchoolScores() calculates performance scores
5. applyFilters() applies current filters
6. Admin interacts with school data
7. Changes are saved to Firebase
8. UI updates with new data
```

#### Score Calculation Flow:
```
1. fetchSchoolScores() is called
2. For each school:
   - Query students collection for school
   - Get dailyStreaks for each student
   - Sum totalPoints for school score
   - Count total students
3. Update school records with scores
4. Display updated data
```

### Performance Optimizations

#### 1. **Data Loading**
- **Batch Operations**: Efficient batch data loading
- **Caching**: Cached state and district data
- **Lazy Loading**: Load scores on demand

#### 2. **Filtering**
- **Client-side Filtering**: Fast filtering without server calls
- **Debounced Search**: Optimized search performance
- **Efficient Updates**: Minimal re-renders

#### 3. **Score Calculation**
- **Parallel Processing**: Concurrent score calculations
- **Error Handling**: Graceful handling of calculation errors
- **Caching**: Cached score results

### Error Handling

#### 1. **Validation Errors**
- **School Code Uniqueness**: Prevent duplicate codes
- **Required Fields**: Validate required form fields
- **Data Format**: Validate data formats

#### 2. **Database Errors**
- **Connection Issues**: Handle Firebase connection problems
- **Permission Errors**: Handle access permission issues
- **Data Corruption**: Handle corrupted data gracefully

#### 3. **User Feedback**
- **Success Messages**: Clear success notifications
- **Error Messages**: Detailed error descriptions
- **Loading States**: Visual loading indicators

### Security Considerations

#### 1. **Access Control**
- **Permission-based Access**: Only authorized admins can manage schools
- **Role Validation**: Verify admin roles before operations
- **Audit Logging**: Log all school management activities

#### 2. **Data Validation**
- **Input Sanitization**: Sanitize all input data
- **Code Validation**: Validate school codes
- **Data Integrity**: Ensure data consistency

#### 3. **Safe Operations**
- **Deletion Checks**: Prevent deletion of schools with students
- **Status Validation**: Validate status changes
- **Backup Considerations**: Consider data backup strategies

### Integration Points

#### With User Management:
- **Student Association**: Link students to schools
- **Bulk Operations**: Manage students by school
- **Performance Tracking**: Track school performance

#### With State Management:
- **Geographic Organization**: Organize schools by location
- **District Management**: Manage school districts
- **Regional Reporting**: Generate regional reports

#### With Analytics:
- **Performance Metrics**: School performance tracking
- **Comparative Analysis**: School comparison tools
- **Trend Analysis**: Performance trend tracking
