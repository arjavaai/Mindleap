# Firebase Auth User Deletion Guide

## Problem
When deleting students from the admin panel, only the Firestore document gets deleted, but the Firebase Auth user remains. This creates orphaned authentication accounts.

## Current Implementation
The admin panel now:
- ✅ Deletes the student document from Firestore
- ✅ Shows clear messaging about Firebase Auth cleanup needed
- ✅ Logs the UID in console for manual cleanup
- ✅ Provides instructions for proper deletion

## Solutions

### Option 1: Manual Cleanup (Current)
1. Delete student from admin panel
2. Check browser console for the UID
3. Go to Firebase Console → Authentication → Users  
4. Search for the UID
5. Delete the user manually

### Option 2: Cloud Function (Recommended)

Create a Firebase Cloud Function to handle auth user deletion:

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.deleteAuthUser = functions.https.onCall(async (data, context) => {
  // Verify admin permissions
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { uid, studentName } = data;
  
  try {
    await admin.auth().deleteUser(uid);
    console.log(`Successfully deleted Firebase Auth user: ${uid} (${studentName})`);
    
    return { 
      success: true, 
      message: `Auth user deleted for ${studentName}` 
    };
  } catch (error) {
    console.error('Error deleting auth user:', error);
    throw new functions.https.HttpsError(
      'internal', 
      `Failed to delete auth user: ${error.message}`
    );
  }
});
```

Then update the client-side code:

```javascript
// In UsersTab.tsx - replace the deleteFirebaseAuthUser function
const deleteFirebaseAuthUser = async (uid: string, studentName: string): Promise<boolean> => {
  try {
    const deleteAuthUser = httpsCallable(functions, 'deleteAuthUser');
    const result = await deleteAuthUser({ uid, studentName });
    
    console.log(`✅ ${result.data.message}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete auth user for ${studentName}:`, error);
    return false;
  }
};
```

### Option 3: REST API Endpoint

If you have a backend server, create an API endpoint:

```javascript
// Backend API endpoint
app.post('/api/delete-auth-user', async (req, res) => {
  const { uid, studentName } = req.body;
  
  try {
    // Verify admin authentication here
    
    await admin.auth().deleteUser(uid);
    
    res.json({ 
      success: true, 
      message: `Auth user deleted for ${studentName}` 
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});
```

## Setup Instructions

### For Cloud Functions:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Initialize functions in your project:
   ```bash
   firebase init functions
   ```

3. Install dependencies:
   ```bash
   cd functions
   npm install firebase-admin firebase-functions
   ```

4. Add the Cloud Function code above to `functions/index.js`

5. Deploy:
   ```bash
   firebase deploy --only functions
   ```

6. Update your client-side code to use the Cloud Function

### For Admin Claims:

Set admin claims for your admin user:

```javascript
// Run this once to set admin claims
admin.auth().setCustomUserClaims('admin-uid-here', { admin: true });
```

## Security Considerations

- Only authenticated admin users should be able to delete auth users
- Implement proper permission checks
- Log all deletion activities
- Consider implementing soft deletes instead of hard deletes
- Test thoroughly in development environment first

## Current Status

✅ Firestore deletion works
⚠️ Firebase Auth deletion requires manual cleanup or server-side implementation
📋 Console logs provide UIDs for manual cleanup
🔧 Ready for Cloud Function implementation 