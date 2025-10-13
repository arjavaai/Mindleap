import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion } from 'framer-motion';
import { Calendar, Award, Users, Search } from 'lucide-react';

interface PlatinumDateDoc {
  id: string; // YYYY-MM-DD
  date: string;
  updatedAt?: any;
}

interface PlatinumStudent {
  uid: string;
  name: string;
  studentId: string;
  email: string;
  schoolCode?: string;
  districtCode?: string;
  times?: number;
  achievedAt?: any;
}

const PlatinumAchievementsTab: React.FC = () => {
  const [dates, setDates] = useState<PlatinumDateDoc[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [students, setStudents] = useState<PlatinumStudent[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDates = async () => {
      setLoadingDates(true);
      try {
        const datesQuery = query(collection(db, 'platinumAchievements'));
        const snapshot = await getDocs(datesQuery);
        const docs: PlatinumDateDoc[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as any;
          docs.push({ id: d.id, date: data.date || d.id, updatedAt: data.updatedAt });
        });
        // Sort desc by id (YYYY-MM-DD)
        docs.sort((a, b) => (a.id < b.id ? 1 : -1));
        setDates(docs);
        if (docs.length > 0 && !selectedDate) setSelectedDate(docs[0].id);
      } catch (e) {
        console.error('Error fetching platinum dates:', e);
      } finally {
        setLoadingDates(false);
      }
    };

    fetchDates();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedDate) {
        setStudents([]);
        return;
      }
      setLoadingStudents(true);
      try {
        const snapshot = await getDocs(collection(db, 'platinumAchievements', selectedDate, 'students'));
        const rows: PlatinumStudent[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as any;
          rows.push({
            uid: data.uid || d.id,
            name: data.name || 'Student',
            studentId: data.studentId || '',
            email: data.email || '',
            schoolCode: data.schoolCode || '',
            districtCode: data.districtCode || '',
            times: Number(data.times) || 1,
            achievedAt: data.achievedAt,
          });
        });
        // Basic sort by times desc then name
        rows.sort((a, b) => (Number(b.times) - Number(a.times)) || a.name.localeCompare(b.name));
        setStudents(rows);
      } catch (e) {
        console.error('Error fetching platinum students:', e);
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [selectedDate]);

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.schoolCode || '').toLowerCase().includes(q) ||
      (s.districtCode || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6">
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Award className="w-6 h-6 text-purple-600" /> Platinum Achievers
        </h2>
        <p className="text-gray-600 mt-1">View daily students who crossed 4000 points (logged before reset).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Dates list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-800">Dates</span>
          </div>
          <div className="max-h-[520px] overflow-y-auto">
            {loadingDates ? (
              <div className="p-4 text-gray-500">Loading dates...</div>
            ) : dates.length === 0 ? (
              <div className="p-4 text-gray-500">No achievements yet.</div>
            ) : (
              <ul>
                {dates.map((d) => (
                  <li key={d.id}>
                    <button
                      onClick={() => setSelectedDate(d.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-purple-50 transition ${
                        selectedDate === d.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{d.id}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Students list */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-800">
                {selectedDate ? `Achievers on ${selectedDate}` : 'Select a date'}
              </span>
            </div>
            <div className="relative">
              <input
                className="border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                placeholder="Search name / ID / email / school"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {loadingStudents ? (
            <div className="p-6 text-gray-500">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-6 text-gray-500">{selectedDate ? 'No students for this date.' : 'Select a date.'}</div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudents.map((s) => (
                <motion.div
                  key={s.uid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">{s.name}</div>
                      <div className="text-sm text-gray-600">{s.studentId}</div>
                      <div className="text-sm text-gray-500">{s.email}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {s.schoolCode ? `School: ${s.schoolCode}` : ''}
                        {s.schoolCode && s.districtCode ? ' • ' : ''}
                        {s.districtCode ? `District: ${s.districtCode}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded">
                        <Award className="w-4 h-4" />
                        <span className="text-sm font-medium">× {s.times || 1}</span>
                      </div>
                      {s.achievedAt && (
                        <div className="text-xs text-gray-400 mt-1">Logged</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatinumAchievementsTab;
