# Database Structure and Connections

## Overview
The MindLeap platform uses Firebase Firestore as its primary database, with Firebase Authentication for user management and Firebase Storage for file storage. The database is designed with a hierarchical structure that supports the platform's educational features, user management, and content delivery systems.

## Firebase Configuration

### File Location
- **Firebase Config**: `src/lib/firebase.ts`
- **Environment Variables**: Firebase project configuration
- **Secondary App**: Used for admin operations

### Firebase Services Used

1. **Firebase Authentication**
   - User authentication and session management
   - Role-based access control
   - Secure user creation and deletion

2. **Firebase Firestore**
   - Primary database for all application data
   - Real-time data synchronization
   - Complex queries and data relationships

3. **Firebase Storage**
   - File storage for images and documents
   - Profile pictures, speaker images, and content files
   - Secure file upload and download

## Database Collections Structure

### 1. **`students`** - Student User Data
```javascript
{
  id: "studentId", // Firebase Auth UID
  name: "Student Name",
  email: "student@mindleap.edu",
  studentId: "ML25DCCCSCCCSERIAL", // Unique student identifier
  schoolCode: "SCHOOL001",
  districtCode: "01",
  stateCode: "ST",
  isActive: true,
  totalPoints: 150,
  authUid: "firebaseAuthUid",
  profilePicture: "https://firebasestorage.googleapis.com/...",
  preferences: {
    notifications: true,
    theme: "light",
    language: "en"
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 2. **`subAdmins`** - Sub-Administrator Data
```javascript
{
  id: "subAdminId",
  email: "admin@mindleap.edu",
  name: "Admin Name",
  role: "Content Manager",
  permissions: [
    "quizzes",
    "webinars",
    "workshops"
  ],
  isActive: true,
  authUid: "firebaseAuthUid",
  profilePicture: "https://firebasestorage.googleapis.com/...",
  preferences: {
    notifications: true,
    theme: "light",
    language: "en"
  },
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: "mainAdminId"
}
```

### 3. **`states`** - State and District Data
```javascript
{
  id: "stateId",
  name: "State Name",
  code: "ST",
  districts: [
    {
      name: "District Name 1",
      code: "01"
    },
    {
      name: "District Name 2",
      code: "02"
    }
  ],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 4. **`schools`** - School Information
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

### 5. **`dailyStreaks`** - Student Performance Data
```javascript
{
  id: "studentId", // Firebase Auth UID
  currentStreak: 15,
  longestStreak: 25,
  totalPoints: 450,
  records: [
    {
      date: "2024-01-15",
      questionId: "questionId",
      isCorrect: true,
      points: 10,
      subject: "Mathematics"
    }
  ]
}
```

### 6. **`subjects`** - Subject Management
```javascript
{
  id: "subjectId",
  name: "Mathematics",
  scheduledDay: "Monday",
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 7. **`subjects/{subjectId}/questions`** - Questions for Each Subject
```javascript
{
  id: "questionId",
  question: "What is 2 + 2?",
  options: [
    "3",
    "4",
    "5",
    "6"
  ],
  correctAnswer: 1,
  explanation: "2 + 2 equals 4 because...",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 8. **`dailyQuestions`** - Daily Question Scheduling
```javascript
{
  id: "dateString", // e.g., "2024-01-15"
  questionId: "questionId",
  subjectId: "subjectId",
  scheduledDay: "Monday",
  totalAttempts: 150,
  correctAttempts: 120,
  createdAt: timestamp
}
```

### 9. **`quizzes`** - Quiz Content
```javascript
{
  id: "quizId",
  title: "Quiz Title",
  description: "Quiz Description",
  questions: [
    {
      id: "questionId",
      question: "Question text",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: 0,
      explanation: "Explanation text"
    }
  ],
  duration: 30,
  targetType: "all", // "all", "state", "district", "school", "students"
  targetStateId: "ST",
  targetDistrictId: "01",
  targetSchoolId: "SCHOOL001",
  targetStudentIds: ["studentId1", "studentId2"],
  expiryType: "date", // "date", "attempts", "never"
  expiryValue: "2024-12-31",
  maxAttempts: 3,
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 10. **`quizAttempts`** - Student Quiz Attempts
```javascript
{
  id: "attemptId",
  quizId: "quizId",
  studentId: "studentId",
  studentName: "Student Name",
  score: 85,
  totalQuestions: 10,
  correctAnswers: 8.5,
  completionTime: 25,
  submittedAt: timestamp,
  answers: [
    {
      questionId: "questionId",
      selectedAnswer: 0,
      isCorrect: true
    }
  ]
}
```

### 11. **`webinars`** - Webinar Content
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

### 12. **`speakers`** - Speaker Profiles
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

### 13. **`webinarViews`** - Webinar View Tracking
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

### 14. **`workshops`** - Workshop Content
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

### 15. **`workshopViews`** - Workshop View Tracking
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

### 16. **`contactQueries`** - Contact Form Submissions
```javascript
{
  id: "queryId",
  name: "Contact Name",
  email: "contact@email.com",
  phone: "+1234567890",
  subject: "Query Subject",
  message: "Full message content",
  status: "pending", // "pending", "in-progress", "resolved", "closed"
  createdAt: timestamp,
  updatedAt: timestamp,
  resolvedAt: timestamp,
  resolvedBy: "adminId"
}
```

## Data Relationships

### 1. **Geographic Hierarchy**
```
States → Districts → Schools → Students
```

### 2. **User Hierarchy**
```
Main Admins → Sub-Admins → Students
```

### 3. **Content Hierarchy**
```
Subjects → Questions → Daily Questions
Quizzes → Quiz Attempts
Webinars → Webinar Views
Workshops → Workshop Views
```

### 4. **Performance Tracking**
```
Students → Daily Streaks → Records
Students → Quiz Attempts
Students → Webinar Views
Students → Workshop Views
```

## Database Operations

### 1. **Read Operations**
- **Single Document**: `getDoc(doc(db, 'collection', 'id'))`
- **Collection Query**: `getDocs(collection(db, 'collection'))`
- **Filtered Query**: `getDocs(query(collection(db, 'collection'), where('field', '==', 'value')))`
- **Ordered Query**: `getDocs(query(collection(db, 'collection'), orderBy('field', 'desc')))`

### 2. **Write Operations**
- **Create Document**: `addDoc(collection(db, 'collection'), data)`
- **Update Document**: `updateDoc(doc(db, 'collection', 'id'), data)`
- **Delete Document**: `deleteDoc(doc(db, 'collection', 'id'))`
- **Set Document**: `setDoc(doc(db, 'collection', 'id'), data)`

### 3. **Real-time Operations**
- **Listen to Changes**: `onSnapshot(collection(db, 'collection'), callback)`
- **Listen to Document**: `onSnapshot(doc(db, 'collection', 'id'), callback)`

## Security Rules

### 1. **Authentication Rules**
- Users must be authenticated to access data
- Users can only access their own data
- Admins have broader access based on permissions

### 2. **Data Validation**
- Required fields must be present
- Data types must match expected formats
- String lengths must be within limits

### 3. **Permission-based Access**
- Students can only access their own data
- Sub-admins can access data based on permissions
- Main admins have full access

## Performance Optimizations

### 1. **Indexing**
- Composite indexes for complex queries
- Single-field indexes for common filters
- Optimized query patterns

### 2. **Data Structure**
- Denormalized data for better performance
- Cached calculated values
- Efficient data relationships

### 3. **Query Optimization**
- Limit result sets
- Use pagination for large datasets
- Optimize query patterns

## Backup and Recovery

### 1. **Data Backup**
- Regular automated backups
- Point-in-time recovery
- Cross-region replication

### 2. **Data Recovery**
- Restore from backups
- Data integrity checks
- Recovery procedures

## Monitoring and Analytics

### 1. **Performance Monitoring**
- Query performance tracking
- Database usage monitoring
- Error rate monitoring

### 2. **Data Analytics**
- User engagement metrics
- Content performance analysis
- System usage statistics

## Integration Points

### 1. **Firebase Authentication**
- User authentication and authorization
- Session management
- Role-based access control

### 2. **Firebase Storage**
- File upload and download
- Image processing
- Document storage

### 3. **External Services**
- Email notifications
- Analytics services
- Third-party integrations
