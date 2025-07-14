import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { User } from 'lucide-react';

interface ProfileModalProps {
  studentId: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ studentId }) => {
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!isModalOpen) return;
      setLoading(true);
      try {
        const studentRef = doc(db, 'students', studentId);
        const studentSnap = await getDoc(studentRef);
        if (studentSnap.exists()) {
          setStudentData(studentSnap.data());
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStudentData();
    }
  }, [studentId, isModalOpen]);

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Student Profile</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p>Loading...</p>
        ) : studentData ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="col-span-1 font-semibold">Name</p>
              <p className="col-span-3">{studentData.name}</p>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="col-span-1 font-semibold">Class</p>
              <p className="col-span-3">{studentData.grade}</p>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="col-span-1 font-semibold">Gender</p>
              <p className="col-span-3">{studentData.gender || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="col-span-1 font-semibold">Age</p>
              <p className="col-span-3">{studentData.age || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="col-span-1 font-semibold">Parent</p>
              <p className="col-span-3">{studentData.parentInfo?.fatherName || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="col-span-1 font-semibold">WhatsApp</p>
              <p className="col-span-3">{studentData.phone}</p>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="col-span-1 font-semibold">Email</p>
              <p className="col-span-3">{studentData.email}</p>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="col-span-1 font-semibold">Address</p>
              <p className="col-span-3">
                {studentData.schoolInfo?.address?.street}, {studentData.schoolInfo?.address?.city},{' '}
                {studentData.schoolInfo?.address?.pincode}
              </p>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="col-span-1 font-semibold">Student ID</p>
              <p className="col-span-3">{studentData.studentId}</p>
            </div>
          </div>
        ) : (
          <p>No data available.</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
