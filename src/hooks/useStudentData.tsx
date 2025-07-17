import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface StudentData {
  totalPoints: number;
  currentStreak: number;
  loading: boolean;
  error: string | null;
  // Additional profile information
  studentId?: string;
  name?: string;
  email?: string;
  phone?: string;
  grade?: string;
  section?: string;
  schoolName?: string;
  districtName?: string;
  state?: string;
  parentInfo?: {
    fatherName?: string;
    motherName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
  };
}

export const useStudentData = () => {
  const [user] = useAuthState(auth);
  const [studentData, setStudentData] = useState<StudentData>({
    totalPoints: 0,
    currentStreak: 0,
    loading: true,
    error: null,
    studentId: undefined,
    name: undefined,
    email: undefined,
    phone: undefined,
    grade: undefined,
    section: undefined,
    schoolName: undefined,
    districtName: undefined,
    state: undefined,
    parentInfo: undefined
  });

  const enrichStudentProfile = async (profileData) => {
    let enrichedProfile = { ...profileData };

    try {
      if (profileData.schoolCode) {
        const { query, where, getDocs, collection } = await import('firebase/firestore');
        const schoolsQuery = query(
          collection(db, 'schools'),
          where('schoolCode', '==', profileData.schoolCode)
        );
        
        const schoolsSnapshot = await getDocs(schoolsQuery);
        
        if (!schoolsSnapshot.empty) {
          const schoolData = schoolsSnapshot.docs[0].data();
          console.log('Found school data:', schoolData);
          enrichedProfile.schoolName = schoolData.name || '';
          enrichedProfile.districtName = schoolData.districtName || '';
          enrichedProfile.state = schoolData.state || '';
          enrichedProfile.stateCode = schoolData.stateCode || '';
        } else {
          console.log('No school found with code:', profileData.schoolCode);
        }
      }
    } catch (error) {
      console.error('Error enriching student data:', error);
    }

    return enrichedProfile;
  };

const fetchStudentData = async () => {
    if (!user) {
      setStudentData((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      setStudentData((prev) => ({ ...prev, loading: true, error: null }));
      console.log('Fetching student data for user:', user.uid);

      // Get the stored totals from dailyStreaks collection (same logic as DailyStreak.tsx)
      const userStreakDoc = await getDoc(doc(db, 'dailyStreaks', user.uid));
      let currentStreak = 0;
      let totalPoints = 0;

      if (userStreakDoc.exists()) {
        const streakData = userStreakDoc.data();
        console.log('useStudentData - Daily Streak Data:', streakData);

        // Use stored values first
        currentStreak = streakData.currentStreak || 0;
        totalPoints = streakData.totalPoints || 0;

        // Also calculate from records like Daily Streak page does
        const records = streakData.records || {};
        const calculatedTotalPoints = Object.values(records).reduce((sum, record) => {
          return sum + (typeof record?.points === 'number' ? record.points : 0);
        }, 0);

        // Use calculated points if available and different from stored
        if (Number(calculatedTotalPoints) > 0) {
          totalPoints = Number(calculatedTotalPoints);
        }

        console.log('useStudentData - Final values - Streak:', currentStreak, 'Points:', totalPoints);
      }

      // Get detailed student information - this is similar to how admin panel fetches data
      const studentDoc = await getDoc(doc(db, 'students', user.uid));
      let studentProfile = {};

      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        console.log('useStudentData - Student Profile Data:', studentData);

        // Extract all possible fields to ensure we have complete data
        studentProfile = {
          // Basic information
          id: studentDoc.id,
          studentId: studentData.studentId || '',
          name: studentData.name || '',
          email: studentData.email || '',
          phone: studentData.phone || '',
          grade: studentData.grade || studentData.class || '',
          section: studentData.section || '',
          schoolCode: studentData.schoolCode || '',
          districtCode: studentData.districtCode || '',
          
          // Additional data for completeness
          address: studentData.address || '',
          state: studentData.state || '',
          gender: studentData.gender || '',
          age: studentData.age || '',
          parentDetails: studentData.parentDetails || '',
          whatsappNumber: studentData.whatsappNumber || '',
          password: '', // We don't expose password in UI
          
          // Structured parent info
          parentInfo: {
            fatherName: studentData.parentInfo?.fatherName || studentData.parentDetails || '',
            motherName: studentData.parentInfo?.motherName || '',
            guardianPhone: studentData.parentInfo?.guardianPhone || studentData.whatsappNumber || '',
            guardianEmail: studentData.parentInfo?.guardianEmail || ''
          }
        };

        // Enrich student profile with additional data from school
        studentProfile = await enrichStudentProfile(studentProfile);
      }

      setStudentData({
        totalPoints,
        currentStreak,
        loading: false,
        error: null,
        ...studentProfile
      });
    } catch (error) {
      console.error('Error fetching student data:', error);
      setStudentData((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch student data'
      }));
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  // Refresh data when component becomes visible (same logic as Dashboard.tsx)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        fetchStudentData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  return {
    ...studentData,
    refetch: fetchStudentData
  };
};
