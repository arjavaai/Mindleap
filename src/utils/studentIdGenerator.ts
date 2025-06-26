
import { collection, getDocs, query, orderBy, where, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface District {
  id: string;
  name: string;
  districtCode: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
  schoolCode: string;
  districtCode: string;
  districtName: string;
}

export interface StudentData {
  studentId: string;
  name: string;
  school: string;
  district: string;
  schoolCode: string;
  districtCode: string;
  password: string;
  email: string;
}

export const generateDistrictCode = async (districtName: string): Promise<string> => {
  // Check if district already exists
  const q = query(collection(db, 'districts'), where('name', '==', districtName));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const existingDistrict = querySnapshot.docs[0].data() as District;
    return existingDistrict.districtCode;
  }

  // Get all districts to find the next available code
  const allDistrictsQuery = query(collection(db, 'districts'), orderBy('districtCode'));
  const allDistrictsSnapshot = await getDocs(allDistrictsQuery);
  
  const existingCodes = new Set<string>();
  allDistrictsSnapshot.forEach((doc) => {
    const data = doc.data() as District;
    existingCodes.add(data.districtCode);
  });

  // Find next available district code (01-99)
  let nextCode = '';
  for (let i = 1; i <= 99; i++) {
    const code = i.toString().padStart(2, '0');
    if (!existingCodes.has(code)) {
      nextCode = code;
      break;
    }
  }

  if (!nextCode) {
    throw new Error('No more district codes available (01-99)');
  }

  // Save new district
  await addDoc(collection(db, 'districts'), {
    name: districtName,
    districtCode: nextCode,
    createdAt: new Date().toISOString()
  });

  return nextCode;
};

export const generateSchoolCode = async (schoolName: string, districtCode: string): Promise<string> => {
  // Check if school already exists
  const q = query(
    collection(db, 'schools'), 
    where('name', '==', schoolName),
    where('districtCode', '==', districtCode)
  );
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const existingSchool = querySnapshot.docs[0].data() as School;
    return existingSchool.schoolCode;
  }

  // Get all schools to find the next available code
  const allSchoolsQuery = query(collection(db, 'schools'), orderBy('schoolCode'));
  const allSchoolsSnapshot = await getDocs(allSchoolsQuery);
  
  const existingCodes = new Set<string>();
  allSchoolsSnapshot.forEach((doc) => {
    const data = doc.data() as School;
    existingCodes.add(data.schoolCode);
  });

  // Find next available school code (001-999)
  let nextCode = '';
  for (let i = 1; i <= 999; i++) {
    const code = i.toString().padStart(3, '0');
    if (!existingCodes.has(code)) {
      nextCode = code;
      break;
    }
  }

  if (!nextCode) {
    throw new Error('No more school codes available (001-999)');
  }

  return nextCode;
};

export const generateStudentSerialNumber = async (schoolCode: string): Promise<string> => {
  // Get all students from the same school
  const q = query(
    collection(db, 'students'), 
    where('schoolCode', '==', schoolCode),
    orderBy('name')
  );
  const querySnapshot = await getDocs(q);
  
  const existingSerials = new Set<string>();
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.studentId) {
      // Extract the last 3 digits (NNN) from student ID
      const serial = data.studentId.slice(-3);
      existingSerials.add(serial);
    }
  });

  // Find next available serial number (001-999)
  for (let i = 1; i <= 999; i++) {
    const serial = i.toString().padStart(3, '0');
    if (!existingSerials.has(serial)) {
      return serial;
    }
  }

  throw new Error('No more student serial numbers available for this school (001-999)');
};

export const generateStudentId = async (
  studentName: string,
  schoolName: string,
  districtName: string,
  schoolAddress: string
): Promise<{ studentId: string; districtCode: string; schoolCode: string }> => {
  // Generate district code
  const districtCode = await generateDistrictCode(districtName);
  
  // Generate school code
  let schoolCode = await generateSchoolCode(schoolName, districtCode);
  
  // If school doesn't exist, create it
  const schoolQuery = query(
    collection(db, 'schools'),
    where('name', '==', schoolName),
    where('districtCode', '==', districtCode)
  );
  const schoolSnapshot = await getDocs(schoolQuery);
  
  if (schoolSnapshot.empty) {
    await addDoc(collection(db, 'schools'), {
      name: schoolName,
      address: schoolAddress,
      schoolCode: schoolCode,
      districtCode: districtCode,
      districtName: districtName,
      createdAt: new Date().toISOString()
    });
  }
  
  // Generate student serial number
  const studentSerial = await generateStudentSerialNumber(schoolCode);
  
  // Format: ML25 + DD + SSS + NNN (legacy format)
  const studentId = `ML25${districtCode}${schoolCode}${studentSerial}`;
  
  return { studentId, districtCode, schoolCode };
};

export const generateStudentIdWithStateCode = async (
  studentName: string,
  schoolName: string,
  districtName: string,
  schoolAddress: string,
  stateCode: string
): Promise<{ studentId: string; districtCode: string; schoolCode: string }> => {
  // Generate district code
  const districtCode = await generateDistrictCode(districtName);
  
  // Generate school code
  let schoolCode = await generateSchoolCode(schoolName, districtCode);
  
  // If school doesn't exist, create it
  const schoolQuery = query(
    collection(db, 'schools'),
    where('name', '==', schoolName),
    where('districtCode', '==', districtCode)
  );
  const schoolSnapshot = await getDocs(schoolQuery);
  
  if (schoolSnapshot.empty) {
    await addDoc(collection(db, 'schools'), {
      name: schoolName,
      address: schoolAddress,
      schoolCode: schoolCode,
      districtCode: districtCode,
      districtName: districtName,
      createdAt: new Date().toISOString()
    });
  }
  
  // Generate student serial number
  const studentSerial = await generateStudentSerialNumber(schoolCode);
  
  // Format: StateCode + 25 + DD + SSS + NNN
  const studentId = `${stateCode}25${districtCode}${schoolCode}${studentSerial}`;
  
  return { studentId, districtCode, schoolCode };
};

export const generatePassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = Math.floor(Math.random() * 3) + 6; // 6-8 characters
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};
