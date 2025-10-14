/**
 * Data Migration Script
 * 
 * This script migrates existing dailyStreaks data to include the new absoluteTotalPoints field.
 * 
 * Run this ONCE after deploying the new code to populate missing fields for existing users.
 * 
 * Usage:
 * 1. Import this function in an admin page or console
 * 2. Call migrateLeaderboardData() once
 * 3. Monitor console for progress
 */

import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface MigrationStats {
  total: number;
  migrated: number;
  alreadyMigrated: number;
  errors: number;
  errorDetails: { uid: string; error: string }[];
}

export async function migrateLeaderboardData(): Promise<MigrationStats> {
  console.log('🚀 Starting leaderboard data migration...');
  
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    alreadyMigrated: 0,
    errors: 0,
    errorDetails: []
  };

  try {
    // Get all dailyStreaks documents
    const streaksSnapshot = await getDocs(collection(db, 'dailyStreaks'));
    stats.total = streaksSnapshot.size;
    
    console.log(`📊 Found ${stats.total} student records to check`);

    let processed = 0;
    
    for (const streakDocSnap of streaksSnapshot.docs) {
      processed++;
      const uid = streakDocSnap.id;
      const data = streakDocSnap.data();
      
      try {
        // Check if already migrated
        if (typeof data.absoluteTotalPoints === 'number') {
          stats.alreadyMigrated++;
          console.log(`✅ [${processed}/${stats.total}] Already migrated: ${uid}`);
          continue;
        }

        // Calculate absoluteTotalPoints from records
        const records = data.records || {};
        const absoluteTotal = Object.values(records).reduce(
          (sum: number, record: any) => sum + (record?.points || 0),
          0
        );

        // Calculate platinum count
        const platinumCount = Math.floor(absoluteTotal / 4000);

        // Update document
        await updateDoc(doc(db, 'dailyStreaks', uid), {
          absoluteTotalPoints: absoluteTotal,
          platinumCount: platinumCount
        });

        stats.migrated++;
        console.log(`✨ [${processed}/${stats.total}] Migrated: ${uid} - Points: ${absoluteTotal} - Platinums: ${platinumCount}`);
        
      } catch (error) {
        stats.errors++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        stats.errorDetails.push({ uid, error: errorMsg });
        console.error(`❌ [${processed}/${stats.total}] Error migrating ${uid}:`, error);
      }

      // Add delay every 10 records to avoid rate limiting
      if (processed % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n🎉 Migration Complete!');
    console.log('📊 Final Stats:');
    console.log(`   - Total records: ${stats.total}`);
    console.log(`   - Newly migrated: ${stats.migrated}`);
    console.log(`   - Already migrated: ${stats.alreadyMigrated}`);
    console.log(`   - Errors: ${stats.errors}`);
    
    if (stats.errorDetails.length > 0) {
      console.log('\n❌ Errors:');
      stats.errorDetails.forEach(({ uid, error }) => {
        console.log(`   - ${uid}: ${error}`);
      });
    }

    return stats;

  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    throw error;
  }
}

/**
 * Quick verification function to check migration status
 */
export async function verifyMigration(): Promise<void> {
  console.log('🔍 Verifying migration...');
  
  try {
    const streaksSnapshot = await getDocs(collection(db, 'dailyStreaks'));
    
    let withAbsolutePoints = 0;
    let withoutAbsolutePoints = 0;
    let totalPoints = 0;
    let topStudents: { uid: string; points: number }[] = [];

    streaksSnapshot.forEach(doc => {
      const data = doc.data();
      
      if (typeof data.absoluteTotalPoints === 'number') {
        withAbsolutePoints++;
        totalPoints += data.absoluteTotalPoints;
        topStudents.push({ uid: doc.id, points: data.absoluteTotalPoints });
      } else {
        withoutAbsolutePoints++;
      }
    });

    // Sort to get top 10
    topStudents.sort((a, b) => b.points - a.points);
    const top10 = topStudents.slice(0, 10);

    console.log('\n📊 Migration Status:');
    console.log(`   ✅ With absoluteTotalPoints: ${withAbsolutePoints}`);
    console.log(`   ❌ Without absoluteTotalPoints: ${withoutAbsolutePoints}`);
    console.log(`   📈 Total points across all users: ${totalPoints}`);
    console.log(`   📊 Average points per user: ${Math.round(totalPoints / withAbsolutePoints)}`);
    
    console.log('\n🏆 Top 10 Students:');
    top10.forEach((student, index) => {
      console.log(`   ${index + 1}. ${student.uid.substring(0, 8)}: ${student.points} points`);
    });

    if (withoutAbsolutePoints === 0) {
      console.log('\n✅ All records have been migrated successfully!');
    } else {
      console.log(`\n⚠️  Warning: ${withoutAbsolutePoints} records still need migration`);
    }

  } catch (error) {
    console.error('❌ Error verifying migration:', error);
  }
}

/**
 * Export for use in admin console or admin page
 * 
 * Example usage in browser console (when on admin page):
 * 
 * import { migrateLeaderboardData, verifyMigration } from './utils/migrateLeaderboardData';
 * 
 * // Run migration
 * await migrateLeaderboardData();
 * 
 * // Verify results
 * await verifyMigration();
 */
