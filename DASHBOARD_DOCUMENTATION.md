# MindLeap Dashboard Documentation

## 📊 Overview

This document provides detailed information about the MindLeap platform's dashboard systems, including the Student Dashboard and Admin Dashboard, along with comprehensive Firebase document structures and implementation details.

## 🎓 Student Dashboard

### Main Dashboard Page (`/dashboard`)

The student dashboard serves as the central hub for student activities and progress tracking. It displays:

#### Key Components:
1. **Header Section**
   - Student greeting with time-based messages
   - Current streak count with animated flame icon
   - Total points display with star icon
   - Badge/Shield progression indicator
   - Profile modal access
   - Sign out functionality

2. **Shield Progress Bar**
   - Visual representation of student's shield progression
   - Bronze (1000+ points), Silver (2000+ points), Gold (3000+ points), Platinum (4000+ points)
   - Animated progress visualization

3. **Quick Action Cards Grid** (6 main sections)

### 🔥 Section 1: Daily Streak Challenge (`/daily-streak`)

**Purpose**: Daily question answering to maintain learning streaks

**Features**:
- One question per day from scheduled subjects
- Streak tracking with calendar visualization
- Point system (200 points correct, 100 points incorrect)
- Subject rotation based on day of week

**Firebase Implementation**:
```javascript
// Collection: dailyStreaks/{userId}
{
  currentStreak: number,           // Current consecutive correct answers
  totalPoints: number,             // Sum of all points earned
  lastAnswered: timestamp,         // Last question answered date
  records: {                       // Daily question records
    "2024-12-07": {
      questionId: string,
      subject: string,
      selectedOption: string,
      correctOption: string,
      isCorrect: boolean,
      points: number,
      timestamp: Firestore.Timestamp,
      explanation: string
    }
  }
}
```

### 📚 Section 2: Quizzes (`/quiz`)

**Purpose**: Subject-based knowledge testing

**Features**:
- Multiple choice questions
- Instant feedback
- Score tracking
- Progress monitoring

**Firebase Implementation**:
```javascript
// Collection: quizResults/{userId}/attempts
{
  quizId: string,
  subject: string,
  score: number,
  totalQuestions: number,
  answers: [
    {
      questionId: string,
      selectedOption: string,
      correctOption: string,
      isCorrect: boolean,
      points: number
    }
  ],
  completedAt: Firestore.Timestamp,
  timeTaken: number // in seconds
}
```

### 🎥 Section 3: Live Webinars (`/webinars`)

**Purpose**: Interactive live learning sessions

**Features**:
- Scheduled webinar listings
- Registration system
- Live streaming integration
- Recording access

**Firebase Implementation**:
```javascript
// Collection: webinars
{
  id: string,
  title: string,
  description: string,
  instructor: string,
  scheduledDate: Firestore.Timestamp,
  duration: number, // in minutes
  maxAttendees: number,
  registeredStudents: string[], // Array of student UIDs
  streamUrl: string,
  recordingUrl: string,
  status: 'upcoming' | 'live' | 'completed' | 'cancelled',
  tags: string[],
  createdAt: Firestore.Timestamp
}

// Subcollection: webinars/{webinarId}/attendees
{
  studentId: string,
  joinedAt: Firestore.Timestamp,
  leftAt: Firestore.Timestamp,
  duration: number // in minutes
}
```

### 🛠️ Section 4: Workshops (`/workshops`)

**Purpose**: Hands-on practical learning sessions

**Features**:
- Interactive workshops
- Skill-building activities
- Certificate generation
- Progress tracking

**Firebase Implementation**:
```javascript
// Collection: workshops
{
  id: string,
  title: string,
  description: string,
  instructor: string,
  category: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  estimatedDuration: number, // in hours
  materials: string[], // Array of material URLs
  prerequisites: string[],
  learningOutcomes: string[],
  enrolledStudents: string[], // Array of student UIDs
  status: 'active' | 'inactive',
  createdAt: Firestore.Timestamp
}

// Subcollection: workshops/{workshopId}/progress/{studentId}
{
  enrolledAt: Firestore.Timestamp,
  completedModules: string[],
  currentModule: string,
  progressPercentage: number,
  timeSpent: number, // in minutes
  certificateIssued: boolean,
  certificateUrl: string
}
```

### 🏆 Section 5: Leaderboard (`/leaderboard`)

**Purpose**: Competitive ranking system

**Features**:
- Global and class rankings
- Points-based scoring
- Achievement badges
- Performance metrics

**Firebase Implementation**:
```javascript
// Collection: leaderboard
{
  id: string, // Same as student UID
  studentName: string,
  schoolCode: string,
  districtCode: string,
  totalPoints: number,
  currentStreak: number,
  questionsAnswered: number,
  badge: 'Bronze' | 'Silver' | 'Gold' | 'Platinum',
  lastUpdated: Firestore.Timestamp,
  rank: number,
  classRank: number,
  achievements: string[]
}

// Collection: rankings (for faster queries)
{
  type: 'global' | 'school' | 'district' | 'state',
  period: 'daily' | 'weekly' | 'monthly' | 'allTime',
  rankings: [
    {
      studentId: string,
      points: number,
      rank: number
    }
  ],
  lastUpdated: Firestore.Timestamp
}
```

### 📊 Section 6: Reports (`/reports`)

**Purpose**: Detailed performance analytics

**Features**:
- Progress charts
- Performance metrics
- Detailed analytics
- Downloadable reports

**Firebase Implementation**:
```javascript
// Collection: studentReports/{studentId}
{
  dailyStats: {
    "2024-12-07": {
      questionsAnswered: number,
      correctAnswers: number,
      points: number,
      timeSpent: number,
      subjects: string[]
    }
  },
  weeklyStats: {
    "2024-W49": {
      totalQuestions: number,
      accuracy: number,
      averageTime: number,
      strongSubjects: string[],
      weakSubjects: string[]
    }
  },
  monthlyStats: {
    "2024-12": {
      totalPoints: number,
      streakDays: number,
      improvement: number, // percentage
      goals: {
        target: number,
        achieved: number
      }
    }
  },
  overallStats: {
    totalPointsEarned: number,
    longestStreak: number,
    totalTimeSpent: number,
    subjectPerformance: {
      [subject]: {
        questionsAnswered: number,
        accuracy: number,
        averageScore: number
      }
    }
  }
}
```

## 👨‍💼 Admin Dashboard

### Overview
The admin dashboard provides comprehensive management tools for administrators to oversee the entire MindLeap platform.

### 🏫 Section 1: Schools Management (`AdminPanel` - Schools Tab)

**Purpose**: Manage educational institutions

**Features**:
- Add/edit/delete schools
- School status management
- Bulk operations
- Search and filtering

**Firebase Implementation**:
```javascript
// Collection: schools
{
  id: string, // Auto-generated document ID
  name: string, // School full name
  schoolCode: string, // 3-digit unique code (001-999)
  districtCode: string, // 2-digit district code
  districtName: string, // District full name
  state: string, // State name
  stateCode: string, // State abbreviation (AP, TS, etc.)
  status: 'active' | 'inactive', // School operational status
  address: {
    street: string,
    city: string,
    pincode: string,
    coordinates: {
      latitude: number,
      longitude: number
    }
  },
  contactInfo: {
    principalName: string,
    principalEmail: string,
    principalPhone: string,
    schoolPhone: string,
    schoolEmail: string
  },
  studentCount: number, // Current enrolled students
  establishedYear: number,
  boardAffiliation: string, // CBSE, ICSE, State Board, etc.
  grades: string[], // Array like ["6", "7", "8", "9", "10"]
  createdAt: Firestore.Timestamp,
  updatedAt: Firestore.Timestamp,
  createdBy: string // Admin UID who created
}
```

### 👥 Section 2: Students Management (`AdminPanel` - Users Tab)

**Purpose**: Manage student accounts and data

**Features**:
- Individual student creation
- Bulk student import via CSV/Excel
- Student profile editing
- Account status management

**Firebase Implementation**:
```javascript
// Collection: students
{
  uid: string, // Firebase Auth UID
  studentId: string, // Format: StateCode25DDSSSNN (e.g., AP25010001001)
  name: string, // Full student name
  email: string, // Student email address
  phone: string, // Student phone number
  grade: string, // Class/grade (6, 7, 8, 9, 10)
  section: string, // Class section (A, B, C, etc.)
  rollNumber: string, // School roll number
  schoolCode: string, // Reference to school
  schoolName: string, // School full name
  districtCode: string, // District code
  districtName: string, // District name
  state: string, // State name
  stateCode: string, // State code
  role: 'student', // User role
  status: 'active' | 'inactive' | 'suspended',
  parentInfo: {
    fatherName: string,
    motherName: string,
    guardianPhone: string,
    guardianEmail: string
  },
  academicInfo: {
    academicYear: string,
    admissionDate: Firestore.Timestamp,
    previousSchool: string
  },
  preferences: {
    language: string,
    notifications: boolean,
    timezone: string
  },
  createdAt: Firestore.Timestamp,
  updatedAt: Firestore.Timestamp,
  lastLogin: Firestore.Timestamp,
  createdBy: string // Admin UID who created
}
```

### 🗺️ Section 3: State Management (`AdminPanel` - State Management Tab)

**Purpose**: Manage geographical hierarchies

**Features**:
- State configuration
- District management
- Code assignment
- Hierarchical organization

**Firebase Implementation**:
```javascript
// Collection: states
{
  id: string,
  name: string, // Full state name
  stateCode: string, // Abbreviation (AP, TS, KA, etc.)
  country: string, // Country name
  districts: string[], // Array of district IDs
  totalSchools: number,
  totalStudents: number,
  status: 'active' | 'inactive',
  createdAt: Firestore.Timestamp
}

// Collection: districts
{
  id: string,
  name: string, // District full name
  districtCode: string, // 2-digit code (01-99)
  stateCode: string, // Parent state code
  stateName: string, // Parent state name
  schools: string[], // Array of school IDs
  headquarters: string, // District HQ city
  population: number,
  area: number, // in sq km
  totalSchools: number,
  totalStudents: number,
  status: 'active' | 'inactive',
  createdAt: Firestore.Timestamp
}
```

### 📚 Section 4: Quiz Management (`AdminPanel` - Quiz Management Tab)

**Purpose**: Manage quiz content and structure

**Features**:
- Quiz creation and editing
- Question bank management
- Subject organization
- Publishing controls

**Firebase Implementation**:
```javascript
// Collection: subjects
{
  id: string,
  name: string, // Subject name (Mathematics, Science, etc.)
  code: string, // Subject code (MATH, SCI, etc.)
  description: string,
  grade: string, // Target grade
  scheduledDay: string, // Day of week for daily streak
  color: string, // UI color code
  icon: string, // Icon name
  isActive: boolean,
  questionCount: number, // Total questions available
  createdAt: Firestore.Timestamp
}

// Subcollection: subjects/{subjectId}/questions
{
  id: string,
  question: string, // Question text
  options: {
    a: string,
    b: string,
    c: string,
    d: string
  },
  correctOption: 'a' | 'b' | 'c' | 'd',
  explanation: string, // Detailed explanation
  difficulty: 'easy' | 'medium' | 'hard',
  tags: string[], // Topic tags
  subject: string, // Subject name
  grade: string, // Target grade
  chapter: string, // Chapter/unit name
  learningObjective: string,
  timeLimit: number, // in seconds
  points: number, // Points for correct answer
  isActive: boolean,
  usageCount: number, // How many times used
  correctPercentage: number, // Success rate
  createdAt: Firestore.Timestamp,
  createdBy: string // Admin UID
}
```

### 📊 Section 5: Daily Streak Questions (`AdminPanel` - Daily Streak Questions Tab)

**Purpose**: Manage daily challenge questions

**Features**:
- Question scheduling
- Subject rotation
- Difficulty balancing
- Performance analytics

**Firebase Implementation**:
```javascript
// Collection: dailyQuestions
{
  id: string,
  date: string, // Format: YYYY-MM-DD
  questionId: string, // Reference to subject question
  subject: string,
  scheduledDay: string, // Day of week
  isActive: boolean,
  totalAttempts: number,
  correctAttempts: number,
  averageTime: number, // in seconds
  createdAt: Firestore.Timestamp
}

// Collection: dailyStreakConfig
{
  id: 'config',
  subjectSchedule: {
    Monday: 'Mathematics',
    Tuesday: 'Science',
    Wednesday: 'English',
    Thursday: 'Social Studies',
    Friday: 'Mathematics',
    Saturday: 'Science',
    Sunday: 'General Knowledge'
  },
  pointsSystem: {
    correctAnswer: 200,
    incorrectAnswer: 100,
    bonusStreak: 50 // Bonus per 7-day streak
  },
  timeLimit: 300, // 5 minutes in seconds
  maxAttemptsPerDay: 1
}
```

### 🎥 Section 6: Webinar Management (`AdminPanel` - Webinar Management Tab)

**Purpose**: Manage live learning sessions

**Features**:
- Webinar scheduling
- Instructor assignment
- Registration management
- Recording management

**Firebase Implementation**:
```javascript
// Collection: webinars
{
  id: string,
  title: string,
  description: string,
  instructor: {
    name: string,
    email: string,
    bio: string,
    profileImage: string
  },
  subject: string,
  targetGrades: string[], // Array of grades
  scheduledDate: Firestore.Timestamp,
  duration: number, // in minutes
  maxAttendees: number,
  registrationDeadline: Firestore.Timestamp,
  meetingUrl: string, // Zoom/Teams link
  meetingId: string,
  meetingPassword: string,
  materials: [
    {
      name: string,
      url: string,
      type: 'pdf' | 'ppt' | 'doc' | 'link'
    }
  ],
  recordingUrl: string,
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled',
  registeredStudents: string[], // Array of student UIDs
  attendedStudents: string[], // Array of student UIDs who attended
  feedback: {
    rating: number,
    comments: string[],
    totalResponses: number
  },
  createdAt: Firestore.Timestamp,
  createdBy: string // Admin UID
}
```

### 🛠️ Section 7: Workshop Management (`AdminPanel` - Workshop Management Tab)

**Purpose**: Manage hands-on learning workshops

**Features**:
- Workshop creation
- Module management
- Progress tracking
- Certificate generation

**Firebase Implementation**:
```javascript
// Collection: workshops
{
  id: string,
  title: string,
  description: string,
  instructor: {
    name: string,
    email: string,
    expertise: string[],
    profileImage: string
  },
  category: string, // STEM, Arts, Life Skills, etc.
  targetGrades: string[],
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  estimatedDuration: number, // in hours
  modules: [
    {
      id: string,
      title: string,
      description: string,
      duration: number, // in minutes
      materials: string[], // URLs to resources
      activities: [
        {
          id: string,
          title: string,
          type: 'video' | 'quiz' | 'assignment' | 'discussion',
          content: string,
          isRequired: boolean
        }
      ]
    }
  ],
  prerequisites: string[],
  learningOutcomes: string[],
  materials: string[], // Overall workshop materials
  certificateTemplate: string, // URL to certificate template
  enrollmentLimit: number,
  enrollmentDeadline: Firestore.Timestamp,
  startDate: Firestore.Timestamp,
  endDate: Firestore.Timestamp,
  schedule: [
    {
      date: Firestore.Timestamp,
      topic: string,
      duration: number
    }
  ],
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled',
  enrolledStudents: string[],
  completedStudents: string[],
  rating: number,
  reviews: number,
  createdAt: Firestore.Timestamp,
  createdBy: string
}
```

### 📞 Section 8: Contact Queries (`AdminPanel` - Contact Queries Tab)

**Purpose**: Manage user inquiries and support requests

**Features**:
- Query management
- Response tracking
- Priority assignment
- Status updates

**Firebase Implementation**:
```javascript
// Collection: contactQueries
{
  id: string,
  name: string, // Inquirer name
  email: string,
  phone: string,
  organization: string, // School/Institution name
  role: 'teacher' | 'principal' | 'administrator' | 'parent' | 'student' | 'other',
  subject: string, // Inquiry subject
  message: string, // Detailed message
  category: 'general' | 'technical' | 'billing' | 'partnership' | 'support',
  priority: 'low' | 'medium' | 'high' | 'urgent',
  status: 'new' | 'assigned' | 'in_progress' | 'resolved' | 'closed',
  assignedTo: string, // Admin UID
  response: string, // Admin response
  attachments: string[], // URLs to uploaded files
  tags: string[],
  followUp: boolean,
  followUpDate: Firestore.Timestamp,
  resolutionTime: number, // in hours
  customerSatisfaction: number, // 1-5 rating
  createdAt: Firestore.Timestamp,
  updatedAt: Firestore.Timestamp,
  respondedAt: Firestore.Timestamp
}
```

### 🏫 Section 9: School Requests (`AdminPanel` - School Requests Tab)

**Purpose**: Manage school partnership applications

**Features**:
- Application review
- Approval workflow
- Document management
- Onboarding process

**Firebase Implementation**:
```javascript
// Collection: schoolRequests
{
  id: string,
  schoolInfo: {
    name: string,
    address: {
      street: string,
      city: string,
      district: string,
      state: string,
      pincode: string
    },
    contactInfo: {
      principalName: string,
      principalEmail: string,
      principalPhone: string,
      schoolPhone: string,
      schoolEmail: string,
      website: string
    },
    academicInfo: {
      boardAffiliation: string,
      establishedYear: number,
      totalStudents: number,
      totalTeachers: number,
      grades: string[],
      facilities: string[]
    }
  },
  requestDetails: {
    interestedPrograms: string[],
    expectedStudents: number,
    startDate: Firestore.Timestamp,
    budget: string,
    requirements: string,
    additionalInfo: string
  },
  documents: [
    {
      name: string,
      url: string,
      type: 'license' | 'certificate' | 'proposal' | 'other',
      uploadedAt: Firestore.Timestamp
    }
  ],
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'on_hold',
  reviewNotes: string,
  assignedReviewer: string, // Admin UID
  approvalDate: Firestore.Timestamp,
  rejectionReason: string,
  followUpRequired: boolean,
  contractSent: boolean,
  contractSigned: boolean,
  onboardingCompleted: boolean,
  createdAt: Firestore.Timestamp,
  updatedAt: Firestore.Timestamp,
  reviewedAt: Firestore.Timestamp
}
```

## 🔐 Firebase Security Rules

### Authentication Rules
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Students can only access their own data
    match /students/{studentId} {
      allow read, write: if request.auth != null && request.auth.uid == studentId;
    }
    
    // Daily streaks - students can only access their own
    match /dailyStreaks/{studentId} {
      allow read, write: if request.auth != null && request.auth.uid == studentId;
    }
    
    // Admin-only collections
    match /schools/{schoolId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Questions are read-only for students
    match /subjects/{subjectId}/questions/{questionId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Helper function to check admin role
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

## 📈 Performance Optimization

### Data Fetching Strategies
1. **Lazy Loading**: Dashboard components load data on demand
2. **Caching**: React Query for client-side caching
3. **Pagination**: Large datasets use cursor-based pagination
4. **Indexing**: Firestore composite indexes for complex queries

### Real-time Updates
- Dashboard uses Firestore real-time listeners for live updates
- Efficient unsubscription on component unmount
- Optimistic updates for better UX

## 🚀 Deployment Architecture

### Environment Configuration
- Development: Firebase Emulator Suite
- Staging: Firebase Test Project
- Production: Firebase Production Project

### Data Backup Strategy
- Daily automated Firestore exports
- Point-in-time recovery capabilities
- Cross-region replication for disaster recovery

---

This documentation provides a comprehensive overview of the MindLeap dashboard systems and Firebase implementation. For technical implementation details, refer to the source code in the respective component files.