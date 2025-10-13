# Admin Dashboard Overview

## Overview
The Admin Dashboard (`/admin`) is a comprehensive management interface for administrators to oversee and control all aspects of the MindLeap platform. It provides tools for managing schools, users, content, and analytics across the entire system. The dashboard is role-based, with different permission levels for main administrators and sub-administrators.

## Implementation Details

### File Location
- **Main Component**: `src/components/admin/AdminPanel.tsx`
- **Authentication**: Protected by `AdminAuthGuard`
- **Routing**: Accessible via `/admin` route

### Key Features

#### 1. **Role-Based Access Control**
- **Main Administrators**: Full access to all features
- **Sub-Administrators**: Limited access based on assigned permissions
- **Permission System**: Granular control over feature access

#### 2. **Comprehensive Management Tools**
- **School Management**: Add, edit, view, and manage schools
- **User Management**: Student account management and bulk operations
- **Content Management**: Quizzes, webinars, workshops, and questions
- **Analytics**: Performance tracking and reporting
- **System Administration**: States, districts, and system settings

#### 3. **Responsive Design**
- **Sidebar Navigation**: Collapsible sidebar for better space utilization
- **Tab-based Interface**: Organized content management
- **Mobile-friendly**: Responsive design for all screen sizes

### Database Connections

#### Firebase Collections Used:

1. **`subAdmins`** - Sub-administrator accounts and permissions
   ```javascript
   {
     id: "subAdminId",
     email: "admin@mindleap.edu",
     role: "Content Manager",
     permissions: ["quizzes", "webinars", "workshops"],
     isActive: true,
     authUid: "firebaseAuthUid",
     createdAt: timestamp
   }
   ```

2. **`states`** - State and district data
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

3. **`schools`** - School information and management
   ```javascript
   {
     id: "schoolId",
     name: "School Name",
     code: "SCHOOL001",
     stateCode: "ST",
     districtCode: "01",
     isActive: true,
     totalStudents: 150,
     schoolScore: 2500
   }
   ```

4. **`students`** - Student accounts and data
   ```javascript
   {
     id: "studentId",
     name: "Student Name",
     email: "student@mindleap.edu",
     schoolCode: "SCHOOL001",
     districtCode: "01",
     stateCode: "ST",
     isActive: true,
     totalPoints: 150
   }
   ```

5. **`quizzes`** - Quiz content and management
   ```javascript
   {
     id: "quizId",
     title: "Quiz Title",
     description: "Quiz Description",
     questions: [...],
     duration: 30,
     targetType: "all",
     isActive: true,
     createdAt: timestamp
   }
   ```

6. **`webinars`** - Webinar content and scheduling
   ```javascript
   {
     id: "webinarId",
     title: "Webinar Title",
     description: "Webinar Description",
     youtubeUrl: "https://youtube.com/watch?v=...",
     scheduledDate: timestamp,
     audienceType: "students",
     targetType: "all",
     isActive: true
   }
   ```

7. **`workshops`** - Workshop content and management
   ```javascript
   {
     id: "workshopId",
     title: "Workshop Title",
     description: "Workshop Description",
     youtubeUrl: "https://youtube.com/watch?v=...",
     scheduledDate: timestamp,
     audienceType: "students",
     targetType: "all",
     isActive: true
   }
   ```

8. **`subjects`** - Subject management for daily streak
   ```javascript
   {
     id: "subjectId",
     name: "Mathematics",
     scheduledDay: "Monday",
     isActive: true
   }
   ```

9. **`dailyQuestions`** - Daily streak question scheduling
   ```javascript
   {
     id: "dateString",
     questionId: "questionId",
     subjectId: "subjectId",
     scheduledDay: "Monday",
     totalAttempts: 150,
     correctAttempts: 120
   }
   ```

10. **`contactQueries`** - Contact form submissions
    ```javascript
    {
      id: "queryId",
      name: "Contact Name",
      email: "contact@email.com",
      message: "Contact message",
      status: "pending",
      createdAt: timestamp
    }
    ```

### Component Architecture

#### Main Components:

1. **AdminPanel Component**
   - Main dashboard container
   - Manages sidebar state and navigation
   - Handles tab switching and permissions

2. **Tab Components**:
   - `SchoolsTab`: School management
   - `UsersTab`: Student user management
   - `SubAdminManagementTab`: Sub-admin management
   - `SchoolReportsTab`: School performance reports
   - `StateManagementTab`: State and district management
   - `QuizManagementTab`: Quiz content management
   - `WebinarManagementTab`: Webinar management
   - `WorkshopManagementTab`: Workshop management
   - `ContactQueriesTab`: Contact query management
   - `DailyStreakQuestionsTab`: Daily streak question management
   - `QuestionSchedulerTab`: Question scheduling calendar

#### State Management:
```javascript
const [activeTab, setActiveTab] = useState('schools');
const [isSidebarOpen, setIsSidebarOpen] = useState(true);
const [adminUser, setAdminUser] = useState(null);
const [loading, setLoading] = useState(true);
```

### Key Functions

#### 1. **useAdminPermissions()**
```javascript
const useAdminPermissions = () => {
  const { adminUser } = useAdminContext();
  
  const permissions = {
    canManageSchools: adminUser?.role === 'main' || adminUser?.permissions?.includes('schools'),
    canManageUsers: adminUser?.role === 'main' || adminUser?.permissions?.includes('users'),
    canManageSubAdmins: adminUser?.role === 'main',
    canViewReports: adminUser?.role === 'main' || adminUser?.permissions?.includes('reports'),
    canManageStates: adminUser?.role === 'main' || adminUser?.permissions?.includes('states'),
    canManageQuizzes: adminUser?.role === 'main' || adminUser?.permissions?.includes('quizzes'),
    canManageWebinars: adminUser?.role === 'main' || adminUser?.permissions?.includes('webinars'),
    canManageWorkshops: adminUser?.role === 'main' || adminUser?.permissions?.includes('workshops'),
    canManageQueries: adminUser?.role === 'main' || adminUser?.permissions?.includes('queries'),
    canManageQuestions: adminUser?.role === 'main' || adminUser?.permissions?.includes('questions')
  };
  
  return permissions;
};
```

#### 2. **handleSignOut()**
```javascript
const handleSignOut = async () => {
  try {
    await signOut(auth);
    // Redirect to login or home page
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
```

#### 3. **handleTabChange()**
```javascript
const handleTabChange = (tab) => {
  setActiveTab(tab);
  localStorage.setItem('adminActiveTab', tab);
};
```

#### 4. **toggleSidebar()**
```javascript
const toggleSidebar = () => {
  setIsSidebarOpen(!isSidebarOpen);
};
```

### Permission System

#### Permission Levels:

1. **Main Administrator**
   - Full access to all features
   - Can manage sub-administrators
   - Can delete records
   - Can access all reports

2. **Sub-Administrator**
   - Limited access based on assigned permissions
   - Cannot manage other administrators
   - Cannot delete records
   - Limited report access

#### Permission Categories:

1. **`schools`** - School management
2. **`users`** - Student user management
3. **`reports`** - Report viewing
4. **`states`** - State and district management
5. **`quizzes`** - Quiz content management
6. **`webinars`** - Webinar management
7. **`workshops`** - Workshop management
8. **`queries`** - Contact query management
9. **`questions`** - Daily streak question management

### UI/UX Features

#### 1. **Sidebar Navigation**
- Collapsible sidebar for better space utilization
- Clear navigation icons and labels
- Active tab highlighting
- Permission-based visibility

#### 2. **Tab Management**
- Persistent tab selection (localStorage)
- Smooth tab transitions
- Loading states for each tab
- Error handling per tab

#### 3. **Responsive Design**
- Mobile-friendly layout
- Adaptive sidebar behavior
- Touch-friendly interactions
- Optimized for all screen sizes

#### 4. **User Experience**
- Clear permission indicators
- Intuitive navigation
- Consistent design patterns
- Helpful tooltips and guidance

### Data Flow

#### Admin Authentication Flow:
```
1. Admin visits /admin
2. AdminAuthGuard checks authentication
3. AdminContext provides user data
4. useAdminPermissions() determines access
5. AdminPanel renders appropriate tabs
6. User interacts with permitted features
```

#### Permission Check Flow:
```
1. User attempts to access feature
2. useAdminPermissions() checks role/permissions
3. Feature renders if permitted
4. Error message if not permitted
5. Audit log of access attempts
```

### Security Features

#### 1. **Authentication**
- Firebase Authentication integration
- Secure admin account management
- Session management and timeout

#### 2. **Authorization**
- Role-based access control
- Permission-based feature access
- Secure data operations

#### 3. **Data Protection**
- User-specific data filtering
- Secure database operations
- Protected admin functions

### Performance Optimizations

#### 1. **Lazy Loading**
- Tab components loaded on demand
- Efficient data fetching
- Optimized rendering

#### 2. **State Management**
- Minimal re-renders
- Efficient state updates
- Optimized data structures

#### 3. **Caching**
- Local storage for tab selection
- Cached permission data
- Optimized database queries

### Error Handling

#### 1. **Authentication Errors**
- Graceful handling of auth failures
- Clear error messages
- Redirect to login

#### 2. **Permission Errors**
- Clear permission denied messages
- Fallback UI for restricted access
- Helpful guidance for users

#### 3. **Data Errors**
- Graceful handling of data failures
- User-friendly error messages
- Retry mechanisms

### Integration Points

#### With Student Dashboard:
- User management integration
- Performance data access
- Content management

#### With Firebase:
- Authentication integration
- Database operations
- Storage management

#### With External Services:
- Email notifications
- File uploads
- Export functionality

### Analytics and Monitoring

#### 1. **Admin Activity**
- Login/logout tracking
- Feature usage monitoring
- Permission access logs

#### 2. **System Performance**
- Database query monitoring
- Response time tracking
- Error rate monitoring

#### 3. **User Engagement**
- Student activity tracking
- Content performance metrics
- System usage statistics
