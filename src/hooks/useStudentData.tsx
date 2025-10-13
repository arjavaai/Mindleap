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
      console.log('Fetching student data for user:', user.uid, 'Email:', user.email);

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

      // Get detailed student information - try multiple approaches
      let studentProfile = {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || '',
      };

      // First try: Get by user UID (document ID)
      const studentDoc = await getDoc(doc(db, 'students', user.uid));
      
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        console.log('useStudentData - Found student by UID:', studentData);
        
        studentProfile = {
          ...studentProfile,
          ...extractStudentProfile(studentData, studentDoc.id)
        };
      } else {
        console.log('useStudentData - No student found by UID doc. Trying other methods...');

        // First try: Search by stored uid field in students collection
        try {
          const { query, where, getDocs, collection } = await import('firebase/firestore');
          const byUidQuery = query(
            collection(db, 'students'),
            where('uid', '==', user.uid)
          );
          const byUidSnapshot = await getDocs(byUidQuery);

          if (!byUidSnapshot.empty) {
            const studentDoc = byUidSnapshot.docs[0];
            const studentData = studentDoc.data();
            console.log('useStudentData - Found student by uid field:', studentData);

            studentProfile = {
              ...studentProfile,
              ...extractStudentProfile(studentData, studentDoc.id)
            };
          } else if (user.email) {
            // Second try: Search by email if available
            try {
              const studentsQuery = query(
                collection(db, 'students'),
                where('email', '==', user.email)
              );
              const studentsSnapshot = await getDocs(studentsQuery);
              
              if (!studentsSnapshot.empty) {
                const studentDoc = studentsSnapshot.docs[0];
                const studentData = studentDoc.data();
                console.log('useStudentData - Found student by email:', studentData);
                
                studentProfile = {
                  ...studentProfile,
                  ...extractStudentProfile(studentData, studentDoc.id)
                };
              } else {
                // Third try: Extract student ID from email and search
                if (user.email.includes('@mindleap.edu')) {
                  const studentIdFromEmail = user.email.split('@')[0].toUpperCase();
                  console.log('useStudentData - Trying student ID from email:', studentIdFromEmail);
                  
                  const studentIdQuery = query(
                    collection(db, 'students'),
                    where('studentId', '==', studentIdFromEmail)
                  );
                  const studentIdSnapshot = await getDocs(studentIdQuery);
                  
                  if (!studentIdSnapshot.empty) {
                    const studentDoc = studentIdSnapshot.docs[0];
                    const studentData = studentDoc.data();
                    console.log('useStudentData - Found student by studentId:', studentData);
                    
                    studentProfile = {
                      ...studentProfile,
                      ...extractStudentProfile(studentData, studentDoc.id)
                    };
                  }
                }
              }
            } catch (searchError) {
              console.error('Error searching for student by email/studentId:', searchError);
            }
          }
        } catch (uidSearchError) {
          console.error('Error searching for student by uid field:', uidSearchError);
        }
      }

      // Enrich student profile with additional data from school
      if (studentProfile.schoolCode) {
        studentProfile = await enrichStudentProfile(studentProfile);
      }

      // If core fields are missing (common when a lightweight students/{uid} doc exists),
      // try to find a canonical student document and merge its data.
      try {
        const needsMerge = !studentProfile.studentId || !studentProfile.name || !studentProfile.schoolCode;
        if (needsMerge) {
          const { query, where, getDocs, collection } = await import('firebase/firestore');
          let mergedProfile = { ...studentProfile } as any;

          // 1) Prefer doc with uid field match
          const byUidQuery = query(collection(db, 'students'), where('uid', '==', user.uid));
          const byUidSnap = await getDocs(byUidQuery);
          if (!byUidSnap.empty) {
            const canonicalData = byUidSnap.docs[0].data();
            mergedProfile = { ...mergedProfile, ...extractStudentProfile(canonicalData, byUidSnap.docs[0].id) };
          }

          // 2) If still missing, try by email
          if ((!mergedProfile.studentId || !mergedProfile.schoolCode || !mergedProfile.name) && user.email) {
            const byEmailQuery = query(collection(db, 'students'), where('email', '==', user.email));
            const byEmailSnap = await getDocs(byEmailQuery);
            if (!byEmailSnap.empty) {
              const data = byEmailSnap.docs[0].data();
              mergedProfile = { ...mergedProfile, ...extractStudentProfile(data, byEmailSnap.docs[0].id) };
            }
          }

          // 3) If email is institutional, derive studentId and try
          if ((!mergedProfile.studentId || !mergedProfile.schoolCode || !mergedProfile.name) && user.email && user.email.includes('@mindleap.edu')) {
            const derivedId = user.email.split('@')[0].toUpperCase();
            const byStudIdQuery = query(collection(db, 'students'), where('studentId', '==', derivedId));
            const byStudIdSnap = await getDocs(byStudIdQuery);
            if (!byStudIdSnap.empty) {
              const data = byStudIdSnap.docs[0].data();
              mergedProfile = { ...mergedProfile, ...extractStudentProfile(data, byStudIdSnap.docs[0].id) };
            }
          }

          // Enrich if we obtained a schoolCode during merge
          if (mergedProfile.schoolCode) {
            mergedProfile = await enrichStudentProfile(mergedProfile);
          }

          studentProfile = mergedProfile;
        } else {
          // We already have necessary fields; enrich if schoolCode present
          if (studentProfile.schoolCode) {
            studentProfile = await enrichStudentProfile(studentProfile);
          }
        }
      } catch (mergeErr) {
        console.error('Error merging canonical student profile:', mergeErr);
      }

      console.log('useStudentData - Final student profile:', studentProfile);

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

  // Helper function to extract student profile data
  const extractStudentProfile = (studentData: any, docId: string) => {
    return {
      // Basic information
      id: docId,
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
      
      // Structured parent info
      parentInfo: {
        fatherName: studentData.parentInfo?.fatherName || studentData.parentDetails || '',
        motherName: studentData.parentInfo?.motherName || '',
        guardianPhone: studentData.parentInfo?.guardianPhone || studentData.whatsappNumber || '',
        guardianEmail: studentData.parentInfo?.guardianEmail || ''
      }
    };
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
