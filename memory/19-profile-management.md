# Profile Management

## Overview
The Profile Management system provides comprehensive user profile management for both students and administrators. It handles profile information, authentication, preferences, and account settings. The system supports different user types with role-based access and provides secure profile management with Firebase Authentication integration.

## Implementation Details

### File Location
- **Student Profile**: `src/components/StudentHeader.tsx` (profile display)
- **Admin Profile**: Integrated into admin dashboard
- **Authentication**: `src/lib/firebase.ts`
- **Profile Hooks**: `src/hooks/useStudentData.tsx`

### Key Features

#### 1. **Student Profile Management**
- **Profile Display**: Name, email, school information
- **Badge System**: Current badge and progress display
- **Profile Picture**: Avatar display and management
- **Account Information**: Student ID, school details

#### 2. **Admin Profile Management**
- **Admin Information**: Name, email, role
- **Permission Display**: Current permissions and access
- **Account Settings**: Profile settings and preferences
- **Security Settings**: Password and security management

#### 3. **Authentication Integration**
- **Firebase Auth**: Secure authentication system
- **Session Management**: Secure session handling
- **Role-based Access**: Different access levels
- **Account Security**: Secure account management

#### 4. **Profile Customization**
- **Preferences**: User preferences and settings
- **Display Options**: Customizable display options
- **Notification Settings**: Notification preferences
- **Privacy Settings**: Privacy and data settings

### Database Connections

#### Firebase Collections Used:

1. **`students`** - Student profile data
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

2. **`subAdmins`** - Sub-administrator profile data
   ```javascript
   {
     id: "subAdminId",
     email: "admin@mindleap.edu",
     name: "Admin Name",
     role: "Content Manager",
     permissions: ["quizzes", "webinars", "workshops"],
     isActive: true,
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

3. **`dailyStreaks`** - Student performance data
   ```javascript
   {
     id: "studentId",
     currentStreak: 15,
     totalPoints: 450,
     records: [...]
   }
   ```

### Component Architecture

#### Main Components:

1. **StudentHeader Component**
   - Student profile display
   - Badge and progress visualization
   - Profile picture and information

2. **Profile Management Components**:
   - `ProfileModal`: Profile editing interface
   - `SettingsModal`: Account settings
   - `SecurityModal`: Security settings
   - `PreferencesModal`: User preferences

#### State Management:
```javascript
const [user, setUser] = useState(null);
const [profile, setProfile] = useState(null);
const [loading, setLoading] = useState(true);
const [showProfileModal, setShowProfileModal] = useState(false);
const [showSettingsModal, setShowSettingsModal] = useState(false);
const [showSecurityModal, setShowSecurityModal] = useState(false);
```

### Key Functions

#### 1. **useStudentData()** - Custom Hook
```javascript
const useStudentData = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuthState(auth);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user) {
        setStudent(null);
        setLoading(false);
        return;
      }

      try {
        const studentDoc = await getDoc(doc(db, 'students', user.uid));
        if (studentDoc.exists()) {
          setStudent({ id: studentDoc.id, ...studentDoc.data() });
        } else {
          setError('Student profile not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [user]);

  return { student, loading, error };
};
```

#### 2. **updateProfile()**
```javascript
const updateProfile = async (profileData) => {
  try {
    const profileRef = doc(db, 'students', user.uid);
    await updateDoc(profileRef, {
      ...profileData,
      updatedAt: new Date()
    });
    
    // Update local state
    setProfile(prev => ({ ...prev, ...profileData }));
    
    toast.success('Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.error('Error updating profile');
  }
};
```

#### 3. **updatePreferences()**
```javascript
const updatePreferences = async (preferences) => {
  try {
    const profileRef = doc(db, 'students', user.uid);
    await updateDoc(profileRef, {
      preferences: preferences,
      updatedAt: new Date()
    });
    
    // Update local state
    setProfile(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences }
    }));
    
    toast.success('Preferences updated successfully');
  } catch (error) {
    console.error('Error updating preferences:', error);
    toast.error('Error updating preferences');
  }
};
```

#### 4. **uploadProfilePicture()**
```javascript
const uploadProfilePicture = async (file) => {
  try {
    const storageRef = ref(storage, `profiles/${user.uid}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update profile with new picture URL
    await updateProfile({ profilePicture: downloadURL });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};
```

#### 5. **changePassword()**
```javascript
const changePassword = async (currentPassword, newPassword) => {
  try {
    // Re-authenticate user
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await updatePassword(user, newPassword);
    
    toast.success('Password changed successfully');
  } catch (error) {
    console.error('Error changing password:', error);
    toast.error('Error changing password: ' + error.message);
  }
};
```

#### 6. **getBadgeFromPoints()**
```javascript
const getBadgeFromPoints = (totalPoints) => {
  if (totalPoints >= 1000) return 'Platinum';
  if (totalPoints >= 500) return 'Gold';
  if (totalPoints >= 200) return 'Silver';
  if (totalPoints >= 50) return 'Bronze';
  return 'Beginner';
};
```

#### 7. **getBadgeIcon()**
```javascript
const getBadgeIcon = (badge) => {
  const iconMap = {
    'Platinum': '/medals_icons/platinium_medal.png.png',
    'Gold': '/medals_icons/gold_medal.png.png',
    'Silver': '/medals_icons/silver_medal.png.png',
    'Bronze': '/medals_icons/bronze_medal.png.png',
    'Beginner': '/medals_icons/bronze_medal.png.png'
  };
  return iconMap[badge] || iconMap['Beginner'];
};
```

#### 8. **getBadgeColor()**
```javascript
const getBadgeColor = (badge) => {
  const colorMap = {
    'Platinum': 'text-purple-600',
    'Gold': 'text-yellow-600',
    'Silver': 'text-gray-600',
    'Bronze': 'text-orange-600',
    'Beginner': 'text-gray-500'
  };
  return colorMap[badge] || colorMap['Beginner'];
};
```

### UI/UX Features

#### 1. **Profile Display**
- **Profile Picture**: Avatar display with upload option
- **User Information**: Name, email, role display
- **Badge System**: Current badge and progress
- **Quick Actions**: Edit profile, settings, logout

#### 2. **Profile Editing**
- **Form Interface**: Clean form for profile updates
- **Validation**: Real-time form validation
- **Image Upload**: Drag-and-drop image upload
- **Save Options**: Save and cancel options

#### 3. **Settings Management**
- **Preferences**: User preference settings
- **Notifications**: Notification preferences
- **Theme**: Theme selection
- **Language**: Language preferences

#### 4. **Security Settings**
- **Password Change**: Secure password change
- **Two-Factor Auth**: 2FA setup (if implemented)
- **Session Management**: Active session display
- **Security Log**: Security activity log

### Data Flow

#### Profile Management Flow:
```
1. User accesses profile section
2. useStudentData() loads profile data
3. Profile information is displayed
4. User edits profile information
5. updateProfile() saves changes to Firebase
6. Local state is updated
7. UI refreshes with new data
```

#### Authentication Flow:
```
1. User signs in with Firebase Auth
2. Profile data is loaded from Firestore
3. User role and permissions are determined
4. Profile interface is rendered
5. User can manage profile and settings
```

### Performance Optimizations

#### 1. **Data Loading**
- **Custom Hooks**: Efficient data loading with custom hooks
- **Caching**: Cached profile data
- **Lazy Loading**: Load profile data on demand

#### 2. **Image Handling**
- **Firebase Storage**: Efficient image storage
- **Image Optimization**: Optimized image handling
- **Progress Tracking**: Upload progress indicators

#### 3. **State Management**
- **Minimal Re-renders**: Efficient state updates
- **Optimized Components**: Optimized component rendering
- **Smooth Animations**: Smooth UI transitions

### Error Handling

#### 1. **Authentication Errors**
- **Auth Failures**: Handle authentication failures
- **Session Expiry**: Handle session expiry
- **Permission Errors**: Handle permission issues

#### 2. **Profile Errors**
- **Update Failures**: Handle profile update failures
- **Image Upload Errors**: Handle image upload failures
- **Validation Errors**: Handle validation errors

#### 3. **User Feedback**
- **Loading States**: Visual loading indicators
- **Error Messages**: Clear error notifications
- **Success Feedback**: Confirmation messages

### Security Considerations

#### 1. **Authentication Security**
- **Firebase Auth**: Secure authentication system
- **Session Management**: Secure session handling
- **Password Security**: Secure password management

#### 2. **Data Protection**
- **Input Sanitization**: Sanitize all input data
- **Data Validation**: Validate all profile data
- **Data Integrity**: Ensure data consistency

#### 3. **Access Control**
- **Role-based Access**: Different access levels
- **Permission Validation**: Validate user permissions
- **Audit Logging**: Log profile changes

### Integration Points

#### With Student Dashboard:
- **Profile Display**: Display profile in dashboard
- **Badge Integration**: Integrate badge system
- **Progress Tracking**: Track user progress

#### With Admin Dashboard:
- **Admin Profile**: Admin profile management
- **Permission Display**: Display admin permissions
- **Role Management**: Manage admin roles

#### With Authentication:
- **Firebase Auth**: Secure authentication
- **Session Management**: Manage user sessions
- **Account Security**: Secure account management

### Analytics and Insights

#### 1. **Profile Analytics**
- **Profile Completion**: Track profile completion rates
- **Update Frequency**: Track profile update frequency
- **User Engagement**: Track user engagement

#### 2. **Badge Analytics**
- **Badge Distribution**: Analyze badge distribution
- **Progress Tracking**: Track user progress
- **Achievement Rates**: Track achievement rates

#### 3. **User Behavior**
- **Profile Usage**: Track profile usage patterns
- **Settings Changes**: Track settings changes
- **Security Actions**: Track security actions
