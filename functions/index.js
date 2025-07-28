const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * Cloud Function to delete Firebase Auth user
 * This function provides automatic deletion of Firebase Auth users
 * which cannot be done securely from client-side code
 */
exports.deleteAuthUser = functions.https.onCall(async (data, context) => {
  // Verify that the request is from an authenticated user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to delete auth users'
    );
  }

  // Check if user is admin (you can customize this logic)
  const adminEmail = 'tech@mindleap.org.in';
  if (context.auth.token.email !== adminEmail) {
    // Alternative: Check custom claims for admin role
    // if (!context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can delete authentication users'
    );
  }

  const { uid, studentName, studentEmail } = data;

  // Validate input parameters
  if (!uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Firebase Auth UID is required'
    );
  }

  try {
    // Delete the user from Firebase Auth
    await admin.auth().deleteUser(uid);
    
    // Log the deletion for audit purposes
    console.log(`✅ Successfully deleted Firebase Auth user: ${uid} (${studentName || 'Unknown'} - ${studentEmail || 'Unknown email'})`);
    
    return {
      success: true,
      message: `Firebase Auth user deleted successfully`,
      uid: uid,
      studentName: studentName || 'Unknown',
      deletedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`❌ Error deleting Firebase Auth user ${uid}:`, error);
    
    // Handle specific Firebase Auth errors
    if (error.code === 'auth/user-not-found') {
      // User doesn't exist, consider it successful
      console.log(`⚠️ User ${uid} not found, may have been already deleted`);
      return {
        success: true,
        message: `User was already deleted or didn't exist`,
        uid: uid,
        studentName: studentName || 'Unknown',
        deletedAt: new Date().toISOString()
      };
    }
    
    throw new functions.https.HttpsError(
      'internal',
      `Failed to delete Firebase Auth user: ${error.message}`,
      error
    );
  }
});

/**
 * Cloud Function to bulk delete Firebase Auth users
 * Handles deletion of multiple users at once
 */
exports.bulkDeleteAuthUsers = functions.https.onCall(async (data, context) => {
  // Verify that the request is from an authenticated user
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to delete auth users'
    );
  }

  // Check if user is admin
  const adminEmail = 'tech@mindleap.org.in';
  if (context.auth.token.email !== adminEmail) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can delete authentication users'
    );
  }

  const { users } = data; // Array of { uid, studentName, studentEmail }

  if (!users || !Array.isArray(users) || users.length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Users array is required and must not be empty'
    );
  }

  const results = {
    successful: [],
    failed: [],
    alreadyDeleted: []
  };

  // Process each user deletion
  for (const user of users) {
    const { uid, studentName, studentEmail } = user;
    
    if (!uid) {
      results.failed.push({
        uid: 'missing',
        studentName: studentName || 'Unknown',
        error: 'UID is required'
      });
      continue;
    }

    try {
      await admin.auth().deleteUser(uid);
      
      results.successful.push({
        uid,
        studentName: studentName || 'Unknown',
        studentEmail: studentEmail || 'Unknown email',
        deletedAt: new Date().toISOString()
      });
      
      console.log(`✅ Bulk delete: Successfully deleted ${uid} (${studentName})`);
      
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        results.alreadyDeleted.push({
          uid,
          studentName: studentName || 'Unknown',
          message: 'User was already deleted or didn\'t exist'
        });
        console.log(`⚠️ Bulk delete: User ${uid} not found (${studentName})`);
      } else {
        results.failed.push({
          uid,
          studentName: studentName || 'Unknown',
          error: error.message
        });
        console.error(`❌ Bulk delete: Failed to delete ${uid} (${studentName}):`, error);
      }
    }
  }

  console.log(`📊 Bulk deletion completed: ${results.successful.length} successful, ${results.failed.length} failed, ${results.alreadyDeleted.length} already deleted`);

  return {
    success: true,
    summary: {
      total: users.length,
      successful: results.successful.length,
      failed: results.failed.length,
      alreadyDeleted: results.alreadyDeleted.length
    },
    results
  };
}); 