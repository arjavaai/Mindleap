# Workshops

## Overview
The Workshops section (`/workshops`) provides students with access to interactive workshops. Similar to webinars, workshops can be targeted to specific audiences and include features like scheduling, recording access, view tracking, and performance analytics. Workshops are typically more hands-on and interactive than webinars.

## Implementation Details

### File Location
- **Main Component**: `src/pages/Workshops.tsx`
- **Uses Shadcn/UI Tabs** for audience and status categorization

### Key Features

#### 1. **Audience Targeting**
- **Students**: Workshops specifically for students
- **Parents**: Workshops specifically for parents
- **All Users**: Workshops available to both students and parents

#### 2. **Workshop Management**
- **Scheduled Workshops**: Future workshops with specific dates/times
- **Completed Workshops**: Past workshops with recording access
- **Live Workshops**: Currently ongoing workshops
- **Targeted Delivery**: Workshops can be targeted by state, district, or school

#### 3. **View Tracking**
- **View Count**: Tracks how many students have viewed each workshop
- **Completion Tracking**: Monitors workshop completion rates
- **Watch Time**: Records how long students watch each workshop
- **Engagement Metrics**: Detailed analytics on student engagement

### Database Connections

#### Firebase Collections Used:

1. **`workshops`** - Workshop definitions and configuration
   ```javascript
   {
     id: "workshopId",
     title: "Interactive Science Lab",
     description: "Hands-on science experiments for grade 8",
     youtubeUrl: "https://youtube.com/watch?v=...",
     duration: 90, // minutes
     scheduledDate: timestamp,
     audienceType: "students", // "students" | "parents"
     targetType: "all", // "all" | "state" | "district" | "school"
     targetStateId: "stateId",
     targetDistrictId: "districtId",
     targetSchoolId: "schoolId",
     isActive: true,
     viewCount: 0,
     completedCount: 0,
     createdAt: timestamp,
     createdBy: "admin"
   }
   ```

2. **`workshopViews`** - Student workshop viewing records
   ```javascript
   {
     id: "viewId",
     workshopId: "workshopId",
     studentId: "userId",
     studentName: "Student Name",
     viewedAt: timestamp,
     completionPercentage: 75, // percentage watched
     totalWatchTime: 5400 // seconds
   }
   ```

3. **`students`** - Student profile data for targeting
   ```javascript
   {
     id: "userId",
     name: "Student Name",
     email: "student@mindleap.edu",
     schoolCode: "SCHOOL001",
     districtCode: "DIST001",
     state: "State Name"
   }
   ```

### Data Flow

#### Workshop Fetching Flow:
```
1. Student visits /workshops
2. fetchStudentData() gets student location info
3. fetchWorkshops() runs:
   - Fetch all active workshops
   - Filter by audienceType (students/parents)
   - Filter by targetType and student location
   - Categorize as upcoming/completed
4. Display workshops in appropriate tabs
```

#### Workshop Viewing Flow:
```
1. Student clicks "View Workshop"
2. handleViewWorkshop() runs:
   - Record view in workshopViews collection
   - Update viewCount in workshops collection
   - Open YouTube video in new tab
3. Track viewing progress (if implemented)
4. Update completion metrics
```

### Component Architecture

#### Main Components:

1. **Workshops Component**
   - Manages workshop state and data fetching
   - Handles workshop filtering and targeting
   - Coordinates viewing flow

2. **Tabs Component**
   - Categorizes workshops by audience and status
   - Provides navigation between workshop types

#### State Management:
```javascript
const [workshops, setWorkshops] = useState([]);
const [studentData, setStudentData] = useState(null);
const [loading, setLoading] = useState(true);
const [activeTab, setActiveTab] = useState('students');
const [statusTab, setStatusTab] = useState('upcoming');
```

### Key Functions

#### 1. **fetchStudentData()**
```javascript
const fetchStudentData = async () => {
  try {
    const studentDoc = await getDoc(doc(db, 'students', user.uid));
    if (studentDoc.exists()) {
      setStudentData(studentDoc.data());
    }
  } catch (error) {
    console.error('Error fetching student data:', error);
  }
};
```

#### 2. **fetchWorkshops()**
```javascript
const fetchWorkshops = async () => {
  try {
    const workshopsSnapshot = await getDocs(collection(db, 'workshops'));
    const workshopsData = [];
    
    workshopsSnapshot.forEach(doc => {
      const workshop = { id: doc.id, ...doc.data() };
      
      // Filter by audience type
      if (workshop.audienceType === activeTab || workshop.audienceType === 'all') {
        // Filter by target type and student location
        if (isWorkshopTargetedToStudent(workshop, studentData)) {
          workshopsData.push(workshop);
        }
      }
    });
    
    setWorkshops(workshopsData);
  } catch (error) {
    console.error('Error fetching workshops:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 3. **isWorkshopTargetedToStudent()**
```javascript
const isWorkshopTargetedToStudent = (workshop, studentData) => {
  if (!studentData) return false;
  
  switch (workshop.targetType) {
    case 'all':
      return true;
    case 'state':
      return studentData.state === workshop.targetStateId;
    case 'district':
      return studentData.districtCode === workshop.targetDistrictId;
    case 'school':
      return studentData.schoolCode === workshop.targetSchoolId;
    default:
      return false;
  }
};
```

#### 4. **handleViewWorkshop()**
```javascript
const handleViewWorkshop = async (workshop) => {
  try {
    // Record view
    await addDoc(collection(db, 'workshopViews'), {
      workshopId: workshop.id,
      studentId: user.uid,
      studentName: studentData.name,
      viewedAt: new Date(),
      completionPercentage: 0,
      totalWatchTime: 0
    });
    
    // Update view count
    await updateDoc(doc(db, 'workshops', workshop.id), {
      viewCount: increment(1)
    });
    
    // Open YouTube video
    window.open(workshop.youtubeUrl, '_blank');
  } catch (error) {
    console.error('Error recording workshop view:', error);
  }
};
```

#### 5. **isWorkshopCompleted()**
```javascript
const isWorkshopCompleted = (workshop) => {
  if (!workshop.scheduledDate) return false;
  const scheduledDate = workshop.scheduledDate.toDate ? 
    workshop.scheduledDate.toDate() : 
    new Date(workshop.scheduledDate);
  return new Date() > scheduledDate;
};
```

### UI/UX Features

#### 1. **Workshop Cards**
- Clean, informative workshop display
- Scheduled date and time display
- Duration and audience type indicators
- Interactive elements for engagement

#### 2. **Tab Navigation**
- **Audience Tabs**: Students / Parents
- **Status Tabs**: Upcoming / Completed
- Clear visual indicators for active tabs

#### 3. **Workshop Information**
- Title and description
- Scheduled date and time
- Duration and target audience
- View count and engagement metrics

#### 4. **YouTube Integration**
- Direct links to YouTube videos
- Opens in new tab for better UX
- Maintains platform context

### Performance Optimizations

#### 1. **Efficient Filtering**
- Client-side filtering for better performance
- Cached student data to avoid repeated fetches
- Optimized Firebase queries

#### 2. **Lazy Loading**
- Workshop data loaded on demand
- YouTube thumbnails loaded as needed
- Images lazy loaded

#### 3. **State Management**
- Minimal re-renders with proper state structure
- Memoized calculations for filtering
- Efficient tab switching

### Error Handling

#### 1. **Network Issues**
- Retry mechanisms for failed requests
- Offline state handling
- Graceful degradation

#### 2. **Data Validation**
- Workshop format validation
- Student data verification
- YouTube URL validation

#### 3. **User Feedback**
- Loading states during operations
- Error notifications
- Clear error messages

### Integration Points

#### With Dashboard:
- Upcoming workshop notifications
- Recent workshop access
- Quick access from dashboard cards

#### With Admin Panel:
- Workshop creation and management
- Analytics and reporting
- Performance tracking

#### With Reports:
- Workshop engagement analytics
- Student participation tracking
- Performance metrics

### Security Considerations

#### 1. **Access Control**
- User-specific workshop access
- Targeted delivery based on student location
- Authentication verification

#### 2. **Data Protection**
- Secure workshop data storage
- Protected viewing records
- Privacy-compliant analytics

#### 3. **Content Security**
- YouTube URL validation
- Safe external link handling
- Content moderation

### Analytics and Tracking

#### 1. **View Metrics**
- Total views per workshop
- Unique viewers
- View duration tracking
- Completion rates

#### 2. **Engagement Analytics**
- Audience participation
- Geographic distribution
- Time-based viewing patterns
- Workshop effectiveness

#### 3. **Performance Insights**
- Most popular workshops
- Audience preferences
- Optimal scheduling times
- Content effectiveness

### Differences from Webinars

#### 1. **Content Type**
- **Workshops**: More hands-on, interactive content
- **Webinars**: More lecture-style, informational content

#### 2. **Duration**
- **Workshops**: Typically longer (90+ minutes)
- **Webinars**: Typically shorter (60 minutes)

#### 3. **Engagement**
- **Workshops**: Higher interaction requirements
- **Webinars**: More passive viewing

#### 4. **Targeting**
- **Workshops**: Often targeted to specific skill levels
- **Webinars**: Often targeted to broader audiences

### Future Enhancements

#### 1. **Interactive Features**
- Live chat during workshops
- Interactive polls and quizzes
- Real-time Q&A sessions

#### 2. **Progress Tracking**
- Detailed completion tracking
- Skill assessment integration
- Certificate generation

#### 3. **Collaboration Tools**
- Group workshop sessions
- Peer interaction features
- Collaborative projects
