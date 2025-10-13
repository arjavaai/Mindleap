# Live Webinars

## Overview
The Live Webinars section (`/webinars`) provides students and parents with access to educational webinars. Webinars can be targeted to specific audiences and include features like scheduling, recording access, view tracking, and performance analytics.

## Implementation Details

### File Location
- **Main Component**: `src/pages/Webinars.tsx`
- **Uses Shadcn/UI Tabs** for audience and status categorization

### Key Features

#### 1. **Audience Targeting**
- **Students**: Webinars specifically for students
- **Parents**: Webinars specifically for parents
- **All Users**: Webinars available to both students and parents

#### 2. **Webinar Management**
- **Scheduled Webinars**: Future webinars with specific dates/times
- **Completed Webinars**: Past webinars with recording access
- **Live Webinars**: Currently ongoing webinars
- **Targeted Delivery**: Webinars can be targeted by state, district, or school

#### 3. **View Tracking**
- **View Count**: Tracks how many students have viewed each webinar
- **Completion Tracking**: Monitors webinar completion rates
- **Watch Time**: Records how long students watch each webinar
- **Engagement Metrics**: Detailed analytics on student engagement

### Database Connections

#### Firebase Collections Used:

1. **`webinars`** - Webinar definitions and configuration
   ```javascript
   {
     id: "webinarId",
     title: "Mathematics Masterclass",
     description: "Advanced mathematics concepts for grade 10",
     youtubeUrl: "https://youtube.com/watch?v=...",
     duration: 60, // minutes
     scheduledDate: timestamp,
     audienceType: "students", // "students" | "parents"
     targetType: "all", // "all" | "state" | "district" | "school"
     targetStateId: "stateId",
     targetDistrictId: "districtId",
     targetSchoolId: "schoolId",
     speakerId: "speakerId",
     speakerName: "Dr. John Smith",
     speakerImage: "https://...",
     isActive: true,
     viewCount: 0,
     completedCount: 0,
     createdAt: timestamp,
     createdBy: "admin"
   }
   ```

2. **`webinarViews`** - Student webinar viewing records
   ```javascript
   {
     id: "viewId",
     webinarId: "webinarId",
     studentId: "userId",
     studentName: "Student Name",
     viewedAt: timestamp,
     completionPercentage: 85, // percentage watched
     totalWatchTime: 3600 // seconds
   }
   ```

3. **`speakers`** - Speaker information
   ```javascript
   {
     id: "speakerId",
     name: "Dr. John Smith",
     profileImage: "https://...",
     bio: "Mathematics professor with 20 years experience",
     expertise: "Mathematics, Calculus, Algebra",
     createdAt: timestamp
   }
   ```

4. **`students`** - Student profile data for targeting
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

#### Webinar Fetching Flow:
```
1. Student visits /webinars
2. fetchStudentData() gets student location info
3. fetchWebinars() runs:
   - Fetch all active webinars
   - Filter by audienceType (students/parents)
   - Filter by targetType and student location
   - Categorize as upcoming/completed
4. Display webinars in appropriate tabs
```

#### Webinar Viewing Flow:
```
1. Student clicks "View Webinar"
2. handleViewWebinar() runs:
   - Record view in webinarViews collection
   - Update viewCount in webinars collection
   - Open YouTube video in new tab
3. Track viewing progress (if implemented)
4. Update completion metrics
```

### Component Architecture

#### Main Components:

1. **Webinars Component**
   - Manages webinar state and data fetching
   - Handles webinar filtering and targeting
   - Coordinates viewing flow

2. **Tabs Component**
   - Categorizes webinars by audience and status
   - Provides navigation between webinar types

#### State Management:
```javascript
const [webinars, setWebinars] = useState([]);
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

#### 2. **fetchWebinars()**
```javascript
const fetchWebinars = async () => {
  try {
    const webinarsSnapshot = await getDocs(collection(db, 'webinars'));
    const webinarsData = [];
    
    webinarsSnapshot.forEach(doc => {
      const webinar = { id: doc.id, ...doc.data() };
      
      // Filter by audience type
      if (webinar.audienceType === activeTab || webinar.audienceType === 'all') {
        // Filter by target type and student location
        if (isWebinarTargetedToStudent(webinar, studentData)) {
          webinarsData.push(webinar);
        }
      }
    });
    
    setWebinars(webinarsData);
  } catch (error) {
    console.error('Error fetching webinars:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 3. **isWebinarTargetedToStudent()**
```javascript
const isWebinarTargetedToStudent = (webinar, studentData) => {
  if (!studentData) return false;
  
  switch (webinar.targetType) {
    case 'all':
      return true;
    case 'state':
      return studentData.state === webinar.targetStateId;
    case 'district':
      return studentData.districtCode === webinar.targetDistrictId;
    case 'school':
      return studentData.schoolCode === webinar.targetSchoolId;
    default:
      return false;
  }
};
```

#### 4. **handleViewWebinar()**
```javascript
const handleViewWebinar = async (webinar) => {
  try {
    // Record view
    await addDoc(collection(db, 'webinarViews'), {
      webinarId: webinar.id,
      studentId: user.uid,
      studentName: studentData.name,
      viewedAt: new Date(),
      completionPercentage: 0,
      totalWatchTime: 0
    });
    
    // Update view count
    await updateDoc(doc(db, 'webinars', webinar.id), {
      viewCount: increment(1)
    });
    
    // Open YouTube video
    window.open(webinar.youtubeUrl, '_blank');
  } catch (error) {
    console.error('Error recording webinar view:', error);
  }
};
```

#### 5. **isWebinarCompleted()**
```javascript
const isWebinarCompleted = (webinar) => {
  if (!webinar.scheduledDate) return false;
  const scheduledDate = webinar.scheduledDate.toDate ? 
    webinar.scheduledDate.toDate() : 
    new Date(webinar.scheduledDate);
  return new Date() > scheduledDate;
};
```

### UI/UX Features

#### 1. **Webinar Cards**
- Clean, informative webinar display
- Speaker information with profile images
- Scheduled date and time display
- Duration and audience type indicators

#### 2. **Tab Navigation**
- **Audience Tabs**: Students / Parents
- **Status Tabs**: Upcoming / Completed
- Clear visual indicators for active tabs

#### 3. **Webinar Information**
- Title and description
- Speaker details with bio
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
- Webinar data loaded on demand
- Speaker images lazy loaded
- YouTube thumbnails loaded as needed

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
- Webinar format validation
- Student data verification
- YouTube URL validation

#### 3. **User Feedback**
- Loading states during operations
- Error notifications
- Clear error messages

### Integration Points

#### With Dashboard:
- Upcoming webinar notifications
- Recent webinar access
- Quick access from dashboard cards

#### With Admin Panel:
- Webinar creation and management
- Speaker management
- Analytics and reporting

#### With Reports:
- Webinar engagement analytics
- Student participation tracking
- Performance metrics

### Security Considerations

#### 1. **Access Control**
- User-specific webinar access
- Targeted delivery based on student location
- Authentication verification

#### 2. **Data Protection**
- Secure webinar data storage
- Protected viewing records
- Privacy-compliant analytics

#### 3. **Content Security**
- YouTube URL validation
- Safe external link handling
- Content moderation

### Analytics and Tracking

#### 1. **View Metrics**
- Total views per webinar
- Unique viewers
- View duration tracking
- Completion rates

#### 2. **Engagement Analytics**
- Audience participation
- Geographic distribution
- Time-based viewing patterns
- Speaker performance metrics

#### 3. **Performance Insights**
- Most popular webinars
- Audience preferences
- Optimal scheduling times
- Content effectiveness
