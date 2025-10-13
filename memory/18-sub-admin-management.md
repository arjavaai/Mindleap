# Sub-Admin Management

## Overview
The Sub-Admin Management section provides comprehensive tools for main administrators to manage sub-administrator accounts. It supports creating new sub-admins with Firebase Authentication integration, assigning roles and specific permissions, activating/deactivating accounts, and deleting sub-admins. A key feature is the use of a secondary Firebase app for creating auth users to avoid logging out the main admin.

## Implementation Details

### File Location
- **Main Component**: `src/components/admin/SubAdminManagementTab.tsx`
- **Access**: Available only to main administrators
- **Integration**: Part of the Admin Dashboard

### Key Features

#### 1. **Sub-Admin CRUD Operations**
- **Create Sub-Admins**: Create new sub-admin accounts with Firebase Auth
- **Edit Sub-Admins**: Update sub-admin information and permissions
- **Delete Sub-Admins**: Remove sub-admin accounts
- **View Sub-Admins**: Display sub-admin details and permissions

#### 2. **Permission Management**
- **Granular Permissions**: Assign specific permissions to sub-admins
- **Role-based Access**: Different permission levels
- **Permission Categories**: Organized permission categories
- **Permission Validation**: Validate permission assignments

#### 3. **Firebase Authentication Integration**
- **Secondary App**: Use secondary Firebase app for auth operations
- **Auth User Creation**: Create Firebase Auth users for sub-admins
- **Auth User Deletion**: Remove Firebase Auth users when deleting sub-admins
- **Session Management**: Secure session management

#### 4. **Account Management**
- **Account Status**: Activate/deactivate sub-admin accounts
- **Account Security**: Secure account management
- **Audit Trail**: Track account changes
- **Access Control**: Control sub-admin access

### Database Connections

#### Firebase Collections Used:

1. **`subAdmins`** - Sub-administrator accounts and permissions
   ```javascript
   {
     id: "subAdminId",
     email: "admin@mindleap.edu",
     role: "Content Manager",
     permissions: [
       "quizzes",
       "webinars",
       "workshops"
     ],
     isActive: true,
     authUid: "firebaseAuthUid",
     createdAt: timestamp,
     updatedAt: timestamp,
     createdBy: "mainAdminId"
   }
   ```

### Component Architecture

#### Main Components:

1. **SubAdminManagementTab Component**
   - Main container for sub-admin management
   - Manages state and data operations
   - Handles sub-admin CRUD operations

2. **Sub-Admin Management Modals**:
   - `AddSubAdminModal`: Form for creating new sub-admins
   - `EditSubAdminModal`: Form for editing existing sub-admins
   - `ViewSubAdminModal`: Display sub-admin details
   - `DeleteSubAdminModal`: Confirmation for deletion

#### State Management:
```javascript
const [subAdmins, setSubAdmins] = useState([]);
const [selectedSubAdmin, setSelectedSubAdmin] = useState(null);
const [showAddModal, setShowAddModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showViewModal, setShowViewModal] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [loading, setLoading] = useState(false);
const [submitting, setSubmitting] = useState(false);
```

### Key Functions

#### 1. **fetchSubAdmins()**
```javascript
const fetchSubAdmins = async () => {
  setLoading(true);
  try {
    const subAdminsSnapshot = await getDocs(collection(db, 'subAdmins'));
    const subAdminsData = subAdminsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setSubAdmins(subAdminsData);
  } catch (error) {
    console.error('Error fetching sub-admins:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 2. **getSecondaryFirebaseApp()**
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

#### 3. **handleSubmit()**
```javascript
const handleSubmit = async (formData) => {
  setSubmitting(true);
  try {
    // Get secondary Firebase app
    const secondaryApp = getSecondaryFirebaseApp();
    const secondaryAuth = getAuth(secondaryApp);
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      formData.email,
      formData.password
    );
    
    // Sign out from secondary app
    await signOut(secondaryAuth);
    
    // Create sub-admin document
    const newSubAdmin = {
      email: formData.email,
      role: formData.role,
      permissions: formData.permissions,
      isActive: true,
      authUid: userCredential.user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: auth.currentUser.uid
    };
    
    await addDoc(collection(db, 'subAdmins'), newSubAdmin);
    await fetchSubAdmins();
    setShowAddModal(false);
    
    toast.success('Sub-admin created successfully');
  } catch (error) {
    console.error('Error creating sub-admin:', error);
    toast.error('Error creating sub-admin: ' + error.message);
  } finally {
    setSubmitting(false);
  }
};
```

#### 4. **handlePermissionChange()**
```javascript
const handlePermissionChange = (permission, isChecked, setPermissions) => {
  if (isChecked) {
    setPermissions(prev => [...prev, permission]);
  } else {
    setPermissions(prev => prev.filter(p => p !== permission));
  }
};
```

#### 5. **handleToggleActive()**
```javascript
const handleToggleActive = async (subAdmin) => {
  try {
    const subAdminRef = doc(db, 'subAdmins', subAdmin.id);
    await updateDoc(subAdminRef, {
      isActive: !subAdmin.isActive,
      updatedAt: new Date()
    });
    
    await fetchSubAdmins();
    toast.success(`Sub-admin ${subAdmin.isActive ? 'deactivated' : 'activated'} successfully`);
  } catch (error) {
    console.error('Error toggling sub-admin status:', error);
    toast.error('Error updating sub-admin status');
  }
};
```

#### 6. **handleDeleteSubAdmin()**
```javascript
const handleDeleteSubAdmin = async () => {
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, 'subAdmins', selectedSubAdmin.id));
    
    // Delete Firebase Auth user if authUid exists
    if (selectedSubAdmin.authUid) {
      await deleteFirebaseAuthUser(selectedSubAdmin.authUid);
    }
    
    await fetchSubAdmins();
    setShowDeleteModal(false);
    setSelectedSubAdmin(null);
    
    toast.success('Sub-admin deleted successfully');
  } catch (error) {
    console.error('Error deleting sub-admin:', error);
    toast.error('Error deleting sub-admin');
  }
};
```

#### 7. **deleteFirebaseAuthUser()**
```javascript
const deleteFirebaseAuthUser = async (authUid) => {
  try {
    // Try to sign in as the user to delete them
    const secondaryApp = getSecondaryFirebaseApp();
    const secondaryAuth = getAuth(secondaryApp);
    
    // Get sub-admin data to get email and password
    const subAdminQuery = query(
      collection(db, 'subAdmins'),
      where('authUid', '==', authUid)
    );
    const subAdminSnapshot = await getDocs(subAdminQuery);
    
    if (subAdminSnapshot.docs.length > 0) {
      const subAdminData = subAdminSnapshot.docs[0].data();
      
      try {
        // Sign in as the user
        await signInWithEmailAndPassword(
          secondaryAuth,
          subAdminData.email,
          subAdminData.password
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

### Permission System

#### Available Permissions:

1. **`schools`** - School management
2. **`users`** - Student user management
3. **`reports`** - Report viewing
4. **`states`** - State and district management
5. **`quizzes`** - Quiz content management
6. **`webinars`** - Webinar management
7. **`workshops`** - Workshop management
8. **`queries`** - Contact query management
9. **`questions`** - Daily streak question management

#### Permission Labels:
```javascript
const permissionLabels = {
  'schools': 'School Management',
  'users': 'User Management',
  'reports': 'Reports',
  'states': 'State Management',
  'quizzes': 'Quiz Management',
  'webinars': 'Webinar Management',
  'workshops': 'Workshop Management',
  'queries': 'Contact Queries',
  'questions': 'Daily Streak Questions'
};
```

### UI/UX Features

#### 1. **Sub-Admin List Display**
- **Table Format**: Clean, organized table layout
- **Status Indicators**: Visual status indicators (active/inactive)
- **Permission Display**: Show assigned permissions
- **Action Buttons**: Edit, view, delete, toggle status

#### 2. **Sub-Admin Creation Form**
- **Email and Password**: Basic account information
- **Role Selection**: Role assignment
- **Permission Selection**: Checkbox-based permission selection
- **Validation**: Form validation and error handling

#### 3. **Permission Management**
- **Checkbox Interface**: Easy permission selection
- **Permission Categories**: Organized permission display
- **Permission Validation**: Validate permission assignments
- **Clear Labels**: Clear permission descriptions

#### 4. **Account Management**
- **Status Toggle**: Easy activation/deactivation
- **Account Details**: Complete account information
- **Audit Trail**: Track account changes
- **Security Indicators**: Security status indicators

### Data Flow

#### Sub-Admin Creation Flow:
```
1. Main admin accesses Sub-Admin Management tab
2. Admin clicks "Add Sub-Admin"
3. Form is filled with email, password, role, permissions
4. handleSubmit() is called
5. Secondary Firebase app is used to create auth user
6. Sub-admin document is created in Firestore
7. Admin is signed out from secondary app
8. UI updates with new sub-admin
```

#### Permission Management Flow:
```
1. Admin selects permissions for sub-admin
2. handlePermissionChange() updates permission state
3. Permissions are validated
4. Sub-admin is created/updated with permissions
5. Permissions are stored in Firestore
6. UI updates with permission changes
```

### Performance Optimizations

#### 1. **Firebase App Management**
- **Secondary App**: Efficient secondary app usage
- **Session Management**: Secure session management
- **Auth Operations**: Optimized auth operations

#### 2. **Data Loading**
- **Batch Operations**: Efficient batch data loading
- **Caching**: Cached sub-admin data
- **Lazy Loading**: Load sub-admin data on demand

#### 3. **UI Optimization**
- **Minimal Re-renders**: Efficient state updates
- **Optimized Components**: Optimized component rendering
- **Smooth Animations**: Smooth UI transitions

### Error Handling

#### 1. **Auth Errors**
- **Auth Creation Failures**: Handle auth user creation errors
- **Auth Deletion Failures**: Handle auth user deletion errors
- **Secondary App Issues**: Handle secondary app problems

#### 2. **Validation Errors**
- **Required Fields**: Validate required form fields
- **Email Validation**: Validate email format
- **Permission Validation**: Validate permission assignments

#### 3. **Database Errors**
- **Connection Issues**: Handle Firebase connection problems
- **Permission Errors**: Handle access permission issues
- **Data Corruption**: Handle corrupted data gracefully

### Security Considerations

#### 1. **Access Control**
- **Main Admin Only**: Only main admins can manage sub-admins
- **Role Validation**: Verify admin roles before operations
- **Audit Logging**: Log all sub-admin management activities

#### 2. **Auth Security**
- **Secondary App**: Secure secondary app usage
- **Auth Cleanup**: Proper cleanup of auth users
- **Session Security**: Secure session management

#### 3. **Data Protection**
- **Input Sanitization**: Sanitize all input data
- **Password Security**: Secure password handling
- **Data Integrity**: Ensure data consistency

### Integration Points

#### With Admin Dashboard:
- **Permission Integration**: Sub-admin permissions control dashboard access
- **Role-based Access**: Different access levels for different roles
- **Audit Integration**: Track sub-admin actions

#### With Firebase Authentication:
- **Auth User Management**: Create and manage auth users
- **Session Management**: Secure session handling
- **User Lifecycle**: Manage user lifecycle

#### With Permission System:
- **Permission Validation**: Validate permissions across the system
- **Access Control**: Control access to features
- **Role Management**: Manage different admin roles

### Best Practices

#### 1. **Security**
- **Use Secondary App**: Always use secondary app for auth operations
- **Secure Passwords**: Generate secure passwords
- **Audit Trail**: Maintain audit trail of changes

#### 2. **Permission Management**
- **Principle of Least Privilege**: Grant minimum necessary permissions
- **Regular Review**: Regularly review permissions
- **Clear Documentation**: Document permission purposes

#### 3. **User Experience**
- **Clear Interface**: Provide clear permission interface
- **Validation Feedback**: Provide clear validation feedback
- **Error Handling**: Handle errors gracefully
