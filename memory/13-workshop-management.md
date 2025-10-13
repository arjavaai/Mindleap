# Workshop Management

## Overview
The Workshop Management section provides comprehensive tools for administrators to create, edit, delete, and manage interactive workshops. It supports scheduling workshops, targeting specific audiences, and viewing statistics including views and completion rates. Workshops are similar to webinars but focus on interactive learning experiences.

## Implementation Details

### File Location
- **Main Component**: `src/components/admin/WorkshopManagementTab.tsx`
- **Access**: Available to administrators with 'workshops' permission
- **Integration**: Part of the Admin Dashboard

### Key Features

#### 1. **Workshop CRUD Operations**
- **Create Workshops**: Comprehensive workshop creation form
- **Edit Workshops**: Update existing workshop information
- **Delete Workshops**: Remove workshop records (main admin only)
- **View Workshops**: Detailed workshop information display

#### 2. **Targeting System**
- **Audience Targeting**: Target students or parents
- **Geographic Targeting**: Target by state, district, or school
- **Scheduling**: Set workshop date and time

#### 3. **Analytics and Reporting**
- **View Statistics**: Track workshop views and completion
- **Performance Metrics**: View counts, completion rates
- **Export Functionality**: Export workshop statistics to CSV

#### 4. **Content Management**
- **YouTube Integration**: Link to workshop recordings
- **Description Management**: Rich text descriptions
- **Status Management**: Active/inactive workshop status

### Database Connections

#### Firebase Collections Used:

1. **`workshops`** - Workshop management data
   ```javascript
   {
     id: "workshopId",
     title: "Workshop Title",
     description: "Workshop Description",
     youtubeUrl: "https://youtube.com/watch?v=...",
     scheduledDate: timestamp,
     audienceType: "students", // "students" or "parents"
     targetType: "all", // "all", "state", "district", "school"
     targetStateId: "ST",
     targetDistrictId: "01",
     targetSchoolId: "SCHOOL001",
     isActive: true,
     viewCount: 150,
     completedCount: 120,
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

2. **`workshopViews`** - Student workshop view tracking
   ```javascript
   {
     id: "viewId",
     workshopId: "workshopId",
     studentId: "studentId",
     studentName: "Student Name",
     viewedAt: timestamp,
     completionPercentage: 85,
     totalWatchTime: 25 // in minutes
   }
   ```

3. **`students`** - Student data for targeting
   ```javascript
   {
     id: "studentId",
     name: "Student Name",
     schoolCode: "SCHOOL001",
     districtCode: "01",
     stateCode: "ST"
   }
   ```

4. **`schools`** - School data for targeting
   ```javascript
   {
     id: "schoolId",
     name: "School Name",
     code: "SCHOOL001",
     stateCode: "ST",
     districtCode: "01"
   }
   ```

5. **`states`** - State and district data for targeting
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

1. **WorkshopManagementTab Component**
   - Main container for workshop management
   - Manages state and data operations
   - Handles workshop creation and editing

2. **Workshop Management Modals**:
   - `CreateWorkshopModal`: Form for creating new workshops
   - `EditWorkshopModal`: Form for editing existing workshops
   - `ViewWorkshopModal`: Display workshop details
   - `DeleteWorkshopModal`: Confirmation for deletion
   - `WorkshopStatsModal`: Display workshop statistics

#### State Management:
```javascript
const [workshops, setWorkshops] = useState([]);
const [states, setStates] = useState([]);
const [selectedWorkshop, setSelectedWorkshop] = useState(null);
const [showCreateModal, setShowCreateModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showViewModal, setShowViewModal] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [showStatsModal, setShowStatsModal] = useState(false);
const [workshopStats, setWorkshopStats] = useState(null);
const [loading, setLoading] = useState(false);
```

### Key Functions

#### 1. **fetchWorkshops()**
```javascript
const fetchWorkshops = async () => {
  setLoading(true);
  try {
    const workshopsSnapshot = await getDocs(collection(db, 'workshops'));
    const workshopsData = workshopsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setWorkshops(workshopsData);
  } catch (error) {
    console.error('Error fetching workshops:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 2. **fetchStates()**
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

#### 3. **handleCreateWorkshop()**
```javascript
const handleCreateWorkshop = async (workshopData) => {
  try {
    const newWorkshop = {
      ...workshopData,
      isActive: true,
      viewCount: 0,
      completedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await addDoc(collection(db, 'workshops'), newWorkshop);
    await fetchWorkshops();
    setShowCreateModal(false);
    
    toast.success('Workshop created successfully');
  } catch (error) {
    console.error('Error creating workshop:', error);
    toast.error('Error creating workshop: ' + error.message);
  }
};
```

#### 4. **handleEditWorkshop()**
```javascript
const handleEditWorkshop = (workshop) => {
  setSelectedWorkshop(workshop);
  setShowEditModal(true);
};
```

#### 5. **handleUpdateWorkshop()**
```javascript
const handleUpdateWorkshop = async (updatedData) => {
  try {
    const workshopRef = doc(db, 'workshops', selectedWorkshop.id);
    await updateDoc(workshopRef, {
      ...updatedData,
      updatedAt: new Date()
    });
    
    await fetchWorkshops();
    setShowEditModal(false);
    setSelectedWorkshop(null);
    
    toast.success('Workshop updated successfully');
  } catch (error) {
    console.error('Error updating workshop:', error);
    toast.error('Error updating workshop: ' + error.message);
  }
};
```

#### 6. **handleDeleteWorkshop()**
```javascript
const handleDeleteWorkshop = async () => {
  try {
    await deleteDoc(doc(db, 'workshops', selectedWorkshop.id));
    await fetchWorkshops();
    setShowDeleteModal(false);
    setSelectedWorkshop(null);
    
    toast.success('Workshop deleted successfully');
  } catch (error) {
    console.error('Error deleting workshop:', error);
    toast.error('Error deleting workshop');
  }
};
```

#### 7. **fetchWorkshopStats()**
```javascript
const fetchWorkshopStats = async (workshopId) => {
  try {
    // Get workshop views
    const viewsQuery = query(
      collection(db, 'workshopViews'),
      where('workshopId', '==', workshopId)
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
    
    setWorkshopStats(stats);
    setShowStatsModal(true);
  } catch (error) {
    console.error('Error fetching workshop stats:', error);
    toast.error('Error fetching workshop statistics');
  }
};
```

#### 8. **exportStatsToCSV()**
```javascript
const exportStatsToCSV = () => {
  if (!workshopStats) return;
  
  try {
    const exportData = workshopStats.views.map(view => ({
      'Student Name': view.studentName,
      'Viewed At': new Date(view.viewedAt.seconds * 1000).toLocaleString(),
      'Completion Percentage': view.completionPercentage,
      'Watch Time (minutes)': view.totalWatchTime
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Workshop Views');
    
    const fileName = `workshop_${selectedWorkshop.title}_views_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success('Workshop statistics exported successfully');
  } catch (error) {
    console.error('Error exporting workshop stats:', error);
    toast.error('Error exporting workshop statistics');
  }
};
```

#### 9. **isWorkshopCompleted()**
```javascript
const isWorkshopCompleted = (scheduledDate) => {
  const now = new Date();
  const scheduled = new Date(scheduledDate.seconds * 1000);
  return now > scheduled;
};
```

### UI/UX Features

#### 1. **Workshop List Display**
- **Table Format**: Clean, organized table layout
- **Sortable Columns**: Sort by title, date, status
- **Status Indicators**: Visual status indicators (active/inactive, completed/upcoming)
- **Action Buttons**: Edit, view, delete, stats

#### 2. **Workshop Creation Form**
- **Comprehensive Form**: All necessary fields for workshop creation
- **Targeting Options**: Geographic and audience targeting
- **Scheduling**: Date and time selection
- **Content Management**: Title, description, YouTube URL

#### 3. **Analytics Display**
- **Statistics Overview**: Key performance metrics
- **View Tracking**: Student view tracking
- **Completion Rates**: Completion percentage tracking
- **Export Options**: CSV export functionality

#### 4. **Status Management**
- **Active/Inactive Toggle**: Easy status management
- **Completion Status**: Visual completion indicators
- **Scheduling Status**: Upcoming/completed status

### Data Flow

#### Workshop Management Flow:
```
1. Admin accesses Workshop Management tab
2. fetchWorkshops() loads workshop data
3. fetchStates() loads state/district data
4. Admin creates/edits workshops
5. Targeting is configured
6. Workshop is saved to Firebase
7. UI updates with new data
```

#### Workshop Statistics Flow:
```
1. Admin clicks "View Stats" for a workshop
2. fetchWorkshopStats() is called
3. Workshop views are retrieved
4. Statistics are calculated
5. Data is displayed in modal
6. Export functionality is available
```

### Performance Optimizations

#### 1. **Data Loading**
- **Batch Operations**: Efficient batch data loading
- **Caching**: Cached state and district data
- **Lazy Loading**: Load workshop data on demand

#### 2. **Statistics Calculation**
- **Efficient Queries**: Optimized database queries
- **Caching**: Cached statistics data
- **Real-time Updates**: Real-time statistics updates

#### 3. **UI Optimization**
- **Minimal Re-renders**: Efficient state updates
- **Optimized Components**: Optimized component rendering
- **Smooth Animations**: Smooth UI transitions

### Error Handling

#### 1. **Validation Errors**
- **Required Fields**: Validate required form fields
- **URL Validation**: Validate YouTube URLs
- **Date Validation**: Validate scheduled dates

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
- **Permission-based Access**: Only authorized admins can manage workshops
- **Role Validation**: Verify admin roles before operations
- **Audit Logging**: Log all workshop management activities

#### 2. **Data Protection**
- **Input Sanitization**: Sanitize all input data
- **URL Security**: Validate and sanitize YouTube URLs
- **Data Integrity**: Ensure data consistency

#### 3. **Content Security**
- **Content Validation**: Validate workshop content
- **Access Control**: Control workshop access permissions
- **Audit Trail**: Track content changes

### Integration Points

#### With Student Dashboard:
- **Workshop Access**: Students access targeted workshops
- **View Tracking**: Track student workshop views
- **Completion Tracking**: Track completion rates

#### With User Management:
- **Student Targeting**: Target specific students
- **Performance Data**: Access student performance data
- **Bulk Operations**: Manage students by workshop

#### With Analytics:
- **Performance Metrics**: Workshop performance tracking
- **Comparative Analysis**: Workshop comparison tools
- **Trend Analysis**: Performance trend tracking

### Comparison with Webinar Management

#### Similarities:
- **CRUD Operations**: Both support create, read, update, delete
- **Targeting System**: Both support geographic and audience targeting
- **Analytics**: Both provide view tracking and statistics
- **Export Functionality**: Both support CSV export

#### Differences:
- **Speaker Management**: Webinars have speaker profiles, workshops don't
- **Content Focus**: Webinars focus on presentations, workshops on interaction
- **Complexity**: Webinars have more complex speaker management
- **Use Cases**: Different educational use cases and objectives
