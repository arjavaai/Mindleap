# Webinar Management

## Overview
The Webinar Management section provides comprehensive tools for administrators to create, edit, delete, and manage live webinars. It supports adding speakers, scheduling webinars, and viewing statistics including views and completion rates. Webinars can be targeted to students or parents and further by state, district, or school.

## Implementation Details

### File Location
- **Main Component**: `src/components/admin/WebinarManagementTab.tsx`
- **Access**: Available to administrators with 'webinars' permission
- **Integration**: Part of the Admin Dashboard

### Key Features

#### 1. **Webinar CRUD Operations**
- **Create Webinars**: Comprehensive webinar creation form
- **Edit Webinars**: Update existing webinar information
- **Delete Webinars**: Remove webinar records (main admin only)
- **View Webinars**: Detailed webinar information display

#### 2. **Speaker Management**
- **Add Speakers**: Create speaker profiles with images
- **Speaker Profiles**: Name, image, bio, expertise
- **Image Upload**: Firebase Storage integration for speaker images

#### 3. **Targeting System**
- **Audience Targeting**: Target students or parents
- **Geographic Targeting**: Target by state, district, or school
- **Scheduling**: Set webinar date and time

#### 4. **Analytics and Reporting**
- **View Statistics**: Track webinar views and completion
- **Performance Metrics**: View counts, completion rates
- **Export Functionality**: Export webinar statistics to CSV

### Database Connections

#### Firebase Collections Used:

1. **`webinars`** - Webinar management data
   ```javascript
   {
     id: "webinarId",
     title: "Webinar Title",
     description: "Webinar Description",
     youtubeUrl: "https://youtube.com/watch?v=...",
     scheduledDate: timestamp,
     audienceType: "students", // "students" or "parents"
     targetType: "all", // "all", "state", "district", "school"
     targetStateId: "ST",
     targetDistrictId: "01",
     targetSchoolId: "SCHOOL001",
     speakerId: "speakerId",
     speakerName: "Speaker Name",
     speakerImage: "https://firebasestorage.googleapis.com/...",
     isActive: true,
     viewCount: 150,
     completedCount: 120,
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

2. **`speakers`** - Speaker profile data
   ```javascript
   {
     id: "speakerId",
     name: "Speaker Name",
     image: "https://firebasestorage.googleapis.com/...",
     bio: "Speaker biography",
     expertise: "Subject expertise",
     isActive: true,
     createdAt: timestamp
   }
   ```

3. **`webinarViews`** - Student webinar view tracking
   ```javascript
   {
     id: "viewId",
     webinarId: "webinarId",
     studentId: "studentId",
     studentName: "Student Name",
     viewedAt: timestamp,
     completionPercentage: 85,
     totalWatchTime: 25 // in minutes
   }
   ```

4. **`students`** - Student data for targeting
   ```javascript
   {
     id: "studentId",
     name: "Student Name",
     schoolCode: "SCHOOL001",
     districtCode: "01",
     stateCode: "ST"
   }
   ```

5. **`schools`** - School data for targeting
   ```javascript
   {
     id: "schoolId",
     name: "School Name",
     code: "SCHOOL001",
     stateCode: "ST",
     districtCode: "01"
   }
   ```

6. **`states`** - State and district data for targeting
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

### Component Architecture

#### Main Components:

1. **WebinarManagementTab Component**
   - Main container for webinar management
   - Manages state and data operations
   - Handles webinar creation and editing

2. **Webinar Management Modals**:
   - `CreateWebinarModal`: Form for creating new webinars
   - `EditWebinarModal`: Form for editing existing webinars
   - `ViewWebinarModal`: Display webinar details
   - `DeleteWebinarModal`: Confirmation for deletion
   - `WebinarStatsModal`: Display webinar statistics

3. **Speaker Management**:
   - `AddSpeakerModal`: Form for adding new speakers
   - `SpeakerList`: Display list of available speakers

#### State Management:
```javascript
const [webinars, setWebinars] = useState([]);
const [speakers, setSpeakers] = useState([]);
const [states, setStates] = useState([]);
const [selectedWebinar, setSelectedWebinar] = useState(null);
const [showCreateModal, setShowCreateModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showViewModal, setShowViewModal] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [showStatsModal, setShowStatsModal] = useState(false);
const [showAddSpeakerModal, setShowAddSpeakerModal] = useState(false);
const [webinarStats, setWebinarStats] = useState(null);
const [loading, setLoading] = useState(false);
```

### Key Functions

#### 1. **fetchWebinars()**
```javascript
const fetchWebinars = async () => {
  setLoading(true);
  try {
    const webinarsSnapshot = await getDocs(collection(db, 'webinars'));
    const webinarsData = webinarsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setWebinars(webinarsData);
  } catch (error) {
    console.error('Error fetching webinars:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 2. **fetchSpeakers()**
```javascript
const fetchSpeakers = async () => {
  try {
    const speakersSnapshot = await getDocs(collection(db, 'speakers'));
    const speakersData = speakersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setSpeakers(speakersData);
  } catch (error) {
    console.error('Error fetching speakers:', error);
  }
};
```

#### 3. **fetchStates()**
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

#### 4. **handleCreateWebinar()**
```javascript
const handleCreateWebinar = async (webinarData) => {
  try {
    const newWebinar = {
      ...webinarData,
      isActive: true,
      viewCount: 0,
      completedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await addDoc(collection(db, 'webinars'), newWebinar);
    await fetchWebinars();
    setShowCreateModal(false);
    
    toast.success('Webinar created successfully');
  } catch (error) {
    console.error('Error creating webinar:', error);
    toast.error('Error creating webinar: ' + error.message);
  }
};
```

#### 5. **handleEditWebinar()**
```javascript
const handleEditWebinar = (webinar) => {
  setSelectedWebinar(webinar);
  setShowEditModal(true);
};
```

#### 6. **handleUpdateWebinar()**
```javascript
const handleUpdateWebinar = async (updatedData) => {
  try {
    const webinarRef = doc(db, 'webinars', selectedWebinar.id);
    await updateDoc(webinarRef, {
      ...updatedData,
      updatedAt: new Date()
    });
    
    await fetchWebinars();
    setShowEditModal(false);
    setSelectedWebinar(null);
    
    toast.success('Webinar updated successfully');
  } catch (error) {
    console.error('Error updating webinar:', error);
    toast.error('Error updating webinar: ' + error.message);
  }
};
```

#### 7. **handleDeleteWebinar()**
```javascript
const handleDeleteWebinar = async () => {
  try {
    await deleteDoc(doc(db, 'webinars', selectedWebinar.id));
    await fetchWebinars();
    setShowDeleteModal(false);
    setSelectedWebinar(null);
    
    toast.success('Webinar deleted successfully');
  } catch (error) {
    console.error('Error deleting webinar:', error);
    toast.error('Error deleting webinar');
  }
};
```

#### 8. **handleAddSpeaker()**
```javascript
const handleAddSpeaker = async (speakerData) => {
  try {
    const newSpeaker = {
      ...speakerData,
      isActive: true,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, 'speakers'), newSpeaker);
    await fetchSpeakers();
    setShowAddSpeakerModal(false);
    
    toast.success('Speaker added successfully');
  } catch (error) {
    console.error('Error adding speaker:', error);
    toast.error('Error adding speaker: ' + error.message);
  }
};
```

#### 9. **handleImageUpload()**
```javascript
const handleImageUpload = async (file) => {
  try {
    const storageRef = ref(storage, `speakers/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};
```

#### 10. **uploadImageToFirebase()**
```javascript
const uploadImageToFirebase = async (file) => {
  try {
    const storageRef = ref(storage, `speakers/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image to Firebase:', error);
    throw error;
  }
};
```

#### 11. **fetchWebinarStats()**
```javascript
const fetchWebinarStats = async (webinarId) => {
  try {
    // Get webinar views
    const viewsQuery = query(
      collection(db, 'webinarViews'),
      where('webinarId', '==', webinarId)
    );
    const viewsSnapshot = await getDocs(viewsQuery);
    
    const views = viewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Calculate statistics
    const stats = {
      totalViews: views.length,
      averageCompletion: views.reduce((sum, view) => sum + view.completionPercentage, 0) / views.length,
      averageWatchTime: views.reduce((sum, view) => sum + view.totalWatchTime, 0) / views.length,
      completionRate: views.filter(view => view.completionPercentage >= 80).length / views.length * 100,
      views: views.sort((a, b) => new Date(b.viewedAt.seconds) - new Date(a.viewedAt.seconds))
    };
    
    setWebinarStats(stats);
    setShowStatsModal(true);
  } catch (error) {
    console.error('Error fetching webinar stats:', error);
    toast.error('Error fetching webinar statistics');
  }
};
```

#### 12. **exportStatsToCSV()**
```javascript
const exportStatsToCSV = () => {
  if (!webinarStats) return;
  
  try {
    const exportData = webinarStats.views.map(view => ({
      'Student Name': view.studentName,
      'Viewed At': new Date(view.viewedAt.seconds * 1000).toLocaleString(),
      'Completion Percentage': view.completionPercentage,
      'Watch Time (minutes)': view.totalWatchTime
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Webinar Views');
    
    const fileName = `webinar_${selectedWebinar.title}_views_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success('Webinar statistics exported successfully');
  } catch (error) {
    console.error('Error exporting webinar stats:', error);
    toast.error('Error exporting webinar statistics');
  }
};
```

#### 13. **isWebinarCompleted()**
```javascript
const isWebinarCompleted = (scheduledDate) => {
  const now = new Date();
  const scheduled = new Date(scheduledDate.seconds * 1000);
  return now > scheduled;
};
```

### UI/UX Features

#### 1. **Webinar List Display**
- **Table Format**: Clean, organized table layout
- **Sortable Columns**: Sort by title, date, status
- **Status Indicators**: Visual status indicators (active/inactive, completed/upcoming)
- **Action Buttons**: Edit, view, delete, stats

#### 2. **Webinar Creation Form**
- **Comprehensive Form**: All necessary fields for webinar creation
- **Speaker Selection**: Dropdown with available speakers
- **Targeting Options**: Geographic and audience targeting
- **Scheduling**: Date and time selection

#### 3. **Speaker Management**
- **Speaker Profiles**: Name, image, bio, expertise
- **Image Upload**: Drag-and-drop image upload
- **Speaker List**: Display available speakers
- **Speaker Selection**: Easy speaker selection for webinars

#### 4. **Analytics Display**
- **Statistics Overview**: Key performance metrics
- **View Tracking**: Student view tracking
- **Completion Rates**: Completion percentage tracking
- **Export Options**: CSV export functionality

### Data Flow

#### Webinar Management Flow:
```
1. Admin accesses Webinar Management tab
2. fetchWebinars() loads webinar data
3. fetchSpeakers() loads speaker data
4. fetchStates() loads state/district data
5. Admin creates/edits webinars
6. Speaker is selected and assigned
7. Targeting is configured
8. Webinar is saved to Firebase
9. UI updates with new data
```

#### Webinar Statistics Flow:
```
1. Admin clicks "View Stats" for a webinar
2. fetchWebinarStats() is called
3. Webinar views are retrieved
4. Statistics are calculated
5. Data is displayed in modal
6. Export functionality is available
```

### Performance Optimizations

#### 1. **Data Loading**
- **Batch Operations**: Efficient batch data loading
- **Caching**: Cached speaker and state data
- **Lazy Loading**: Load webinar data on demand

#### 2. **Image Upload**
- **Firebase Storage**: Efficient image storage
- **Image Optimization**: Optimized image handling
- **Progress Tracking**: Upload progress indicators

#### 3. **Statistics Calculation**
- **Efficient Queries**: Optimized database queries
- **Caching**: Cached statistics data
- **Real-time Updates**: Real-time statistics updates

### Error Handling

#### 1. **Validation Errors**
- **Required Fields**: Validate required form fields
- **URL Validation**: Validate YouTube URLs
- **Date Validation**: Validate scheduled dates

#### 2. **Upload Errors**
- **File Format**: Validate image file formats
- **File Size**: Validate file size limits
- **Upload Failures**: Handle upload failures gracefully

#### 3. **Database Errors**
- **Connection Issues**: Handle Firebase connection problems
- **Permission Errors**: Handle access permission issues
- **Data Corruption**: Handle corrupted data gracefully

### Security Considerations

#### 1. **Access Control**
- **Permission-based Access**: Only authorized admins can manage webinars
- **Role Validation**: Verify admin roles before operations
- **Audit Logging**: Log all webinar management activities

#### 2. **Data Protection**
- **Input Sanitization**: Sanitize all input data
- **URL Security**: Validate and sanitize YouTube URLs
- **Data Integrity**: Ensure data consistency

#### 3. **Image Security**
- **File Validation**: Validate uploaded images
- **Storage Security**: Secure Firebase Storage access
- **Access Control**: Control image access permissions

### Integration Points

#### With Student Dashboard:
- **Webinar Access**: Students access targeted webinars
- **View Tracking**: Track student webinar views
- **Completion Tracking**: Track completion rates

#### With User Management:
- **Student Targeting**: Target specific students
- **Performance Data**: Access student performance data
- **Bulk Operations**: Manage students by webinar

#### With Analytics:
- **Performance Metrics**: Webinar performance tracking
- **Comparative Analysis**: Webinar comparison tools
- **Trend Analysis**: Performance trend tracking
