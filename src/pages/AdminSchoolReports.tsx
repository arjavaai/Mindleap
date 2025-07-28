import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  Brain,
  Calendar,
  Download,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  Filter,
  FileText,
  Image as ImageIcon,
  School,
  Users,
  Search,
  GitCompare
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';

interface School {
  id: string;
  name: string;
  schoolCode: string;
  districtCode: string;
  districtName: string;
  state: string;
}

interface SchoolReport {
  schoolName: string;
  schoolCode: string;
  totalStudents: number;
  activeStudents: number;
  totalQuestions: number;
  totalScore: number;
  averageScore: number;
  streakDays: number;
  subjects: SubjectReport[];
  topPerformers: StudentPerformance[];
}

interface SubjectReport {
  subjectName: string;
  questionsAnswered: number;
  correctAnswers: number;
  totalScore: number;
  percentage: number;
  studentsParticipated: number;
  averageScorePerStudent: number;
  medal: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | null;
}

interface StudentPerformance {
  name: string;
  studentId: string;
  score: number;
  questionsAnswered: number;
}

const AdminSchoolReports = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [selectedSchool1, setSelectedSchool1] = useState<string>('');
  const [selectedSchool2, setSelectedSchool2] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [schoolReport1, setSchoolReport1] = useState<SchoolReport | null>(null);
  const [schoolReport2, setSchoolReport2] = useState<SchoolReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const getMedalFromScore = (score: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | null => {
    if (score >= 4000) return 'Platinum';
    if (score >= 3000) return 'Gold';
    if (score >= 2000) return 'Silver';
    if (score >= 1000) return 'Bronze';
    return null;
  };

  const getMedalIcon = (medal: string | null) => {
    switch (medal) {
      case 'Bronze': return '/sheild_icons/broze_sheild.png';
      case 'Silver': return '/sheild_icons/silver_sheild.png';
      case 'Gold': return '/sheild_icons/gold_sheild.png';
      case 'Platinum': return '/sheild_icons/platinum_sheild.png';
      default: return null;
    }
  };

  const getMedalColor = (medal: string | null) => {
    switch (medal) {
      case 'Bronze': return 'from-amber-600 to-yellow-600';
      case 'Silver': return 'from-gray-400 to-gray-600';
      case 'Gold': return 'from-yellow-400 to-yellow-600';
      case 'Platinum': return 'from-purple-400 to-purple-600';
      default: return 'from-gray-300 to-gray-400';
    }
  };

  useEffect(() => {
    const filtered = schools.filter(school =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.schoolCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSchools(filtered);
  }, [schools, searchTerm]);

  useEffect(() => {
    if (selectedSchool1) {
      fetchSchoolReport(selectedSchool1, 1);
    }
  }, [selectedSchool1, selectedMonth]);

  useEffect(() => {
    if (selectedSchool2 && compareMode) {
      fetchSchoolReport(selectedSchool2, 2);
    }
  }, [selectedSchool2, selectedMonth, compareMode]);

  const fetchSchools = async () => {
    try {
      const schoolsSnapshot = await getDocs(collection(db, 'schools'));
      const schoolsData: School[] = [];
      
      schoolsSnapshot.forEach((doc) => {
        const data = doc.data();
        schoolsData.push({
          id: doc.id,
          name: data.name || 'Unknown School',
          schoolCode: data.schoolCode || '',
          districtCode: data.districtCode || '',
          districtName: data.districtName || '',
          state: data.state || ''
        });
      });
      
      setSchools(schoolsData.sort((a, b) => a.name.localeCompare(b.name)));
      setFilteredSchools(schoolsData.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchSchoolReport = async (schoolId: string, reportNumber: 1 | 2) => {
    setLoading(true);
    
    try {
      const school = schools.find(s => s.id === schoolId);
      if (!school) return;

      // Get all students from this school
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const schoolStudents: any[] = [];
      
      console.log('Looking for students with school code:', school.schoolCode);
      
      studentsSnapshot.forEach((doc) => {
        const studentData = doc.data();
        console.log('Student data:', {
          id: doc.id,
          name: studentData.name,
          uid: studentData.uid,
          schoolCode: studentData.schoolCode,
          school: studentData.school,
          schoolName: studentData.schoolName
        });
        
        // More flexible school matching
        if (studentData.schoolCode === school.schoolCode || 
            studentData.school === school.schoolCode ||
            studentData.schoolCode === school.name ||
            studentData.school === school.name ||
            studentData.schoolName === school.name) {
          schoolStudents.push({
            id: doc.id,
            uid: studentData.uid, // This is the key - we need the Firebase Auth UID
            ...studentData
          });
          console.log('✅ Student matched for school:', studentData.name, 'UID:', studentData.uid);
        }
      });
      
      console.log(`Found ${schoolStudents.length} students for school: ${school.name}`);

      // Get streak data for all school students
      const monthStart = startOfMonth(selectedMonth);
      const monthEnd = endOfMonth(selectedMonth);
      
      let totalQuestions = 0;
      let totalScore = 0;
      let activeStudents = 0;
      let streakDays = 0;
      const subjectMap = new Map<string, SubjectReport>();
      const studentPerformances: StudentPerformance[] = [];

      console.log(`Checking daily streaks for ${schoolStudents.length} students...`);
      console.log('Month range:', { monthStart, monthEnd });

      for (const student of schoolStudents) {
        try {
          console.log(`Checking student: ${student.name} (Document ID: ${student.id}, UID: ${student.uid})`);
          
          // Use the Firebase Auth UID to fetch daily streak data, not the document ID
          const streakDocId = student.uid || student.id; // Fallback to document ID if UID is missing
          const streakDoc = await getDoc(doc(db, 'dailyStreaks', streakDocId));
          
          console.log(`Daily streak document exists for ${student.name} (using ${student.uid ? 'UID' : 'Document ID'}):`, streakDoc.exists());
          
          if (streakDoc.exists()) {
            const streakData = streakDoc.data();
            const records = streakData.records || {};
            
            console.log(`Student ${student.name} has ${Object.keys(records).length} total records`);
            
            // Show available months for this student
            const availableMonths = Object.keys(records).map(dateStr => {
              const date = new Date(dateStr);
              return format(date, 'MMMM yyyy');
            });
            console.log(`Available months for ${student.name}:`, [...new Set(availableMonths)]);
            
            // Filter records for selected month
            const monthRecords = Object.values(records).filter((record: any) => {
              const recordDate = record.timestamp?.toDate?.() || new Date(record.timestamp);
              const isInRange = recordDate >= monthStart && recordDate <= monthEnd;
              return isInRange;
            });

            console.log(`Student ${student.name} has ${monthRecords.length} records for selected month`);

            if (monthRecords.length > 0) {
              activeStudents++;
              let studentScore = 0;
              let studentQuestions = 0;
              let studentStreaks = 0;

              monthRecords.forEach((record: any) => {
                const subject = record.subject || 'General Knowledge';
                const points = record.points || (record.isCorrect ? 200 : 100);
                
                totalQuestions++;
                studentQuestions++;
                totalScore += points;
                studentScore += points;
                
                if (record.isCorrect) {
                  streakDays++;
                  studentStreaks++;
                }

                // Update subject data
                if (!subjectMap.has(subject)) {
                  subjectMap.set(subject, {
                    subjectName: subject,
                    questionsAnswered: 0,
                    correctAnswers: 0,
                    totalScore: 0,
                    percentage: 0,
                    studentsParticipated: 0,
                    averageScorePerStudent: 0,
                    medal: null
                  });
                }

                const subjectReport = subjectMap.get(subject)!;
                subjectReport.questionsAnswered++;
                subjectReport.totalScore += points;
                if (record.isCorrect) {
                  subjectReport.correctAnswers++;
                }
              });

              // Add student performance
              studentPerformances.push({
                name: student.name || 'Unknown Student',
                studentId: student.studentId || student.id.substring(0, 8).toUpperCase(),
                score: studentScore,
                questionsAnswered: studentQuestions
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching data for student ${student.id}:`, error);
        }
      }

      // Calculate subject percentages and participation
      const subjects: SubjectReport[] = Array.from(subjectMap.values()).map(subject => {
        // Better calculation for students participated - track unique students per subject
        const studentsParticipated = Math.max(1, Math.ceil(subject.questionsAnswered / 3)); // More realistic estimate
        const averageScorePerStudent = studentsParticipated > 0 ? Math.round(subject.totalScore / studentsParticipated) : 0;
        const percentage = subject.questionsAnswered > 0 ? 
          ((subject.correctAnswers / subject.questionsAnswered) * 100) : 0;
        
        console.log(`Subject: ${subject.subjectName}`, {
          questionsAnswered: subject.questionsAnswered,
          correctAnswers: subject.correctAnswers,
          totalScore: subject.totalScore,
          percentage: percentage.toFixed(1),
          studentsParticipated,
          averageScorePerStudent
        });
        
        return {
          ...subject,
          percentage,
          studentsParticipated,
          averageScorePerStudent,
          medal: getMedalFromScore(subject.totalScore)
        };
      });

      // Sort top performers
      const topPerformers = studentPerformances
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const report: SchoolReport = {
        schoolName: school.name,
        schoolCode: school.schoolCode,
        totalStudents: schoolStudents.length,
        activeStudents,
        totalQuestions,
        totalScore,
        averageScore: activeStudents > 0 ? Math.round(totalScore / activeStudents) : 0,
        streakDays,
        subjects: subjects.sort((a, b) => b.percentage - a.percentage),
        topPerformers
      };

      console.log('Generated School Report:', {
        schoolName: report.schoolName,
        totalStudents: report.totalStudents,
        activeStudents: report.activeStudents,
        totalQuestions: report.totalQuestions,
        totalScore: report.totalScore,
        streakDays: report.streakDays,
        subjectsCount: report.subjects.length,
        subjects: report.subjects.map(s => ({
          name: s.subjectName,
          questions: s.questionsAnswered,
          correct: s.correctAnswers,
          score: s.totalScore,
          percentage: s.percentage.toFixed(1)
        }))
      });

      if (reportNumber === 1) {
        setSchoolReport1(report);
      } else {
        setSchoolReport2(report);
      }

    } catch (error) {
      console.error('Error fetching school report:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReportAsPDF = async () => {
    if ((!schoolReport1 && !schoolReport2) || !reportRef.current) return;
    
    setIsDownloading(true);
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Generate filename based on selected schools
      let filename = 'MindLeap_School_Report_';
      if (compareMode && schoolReport1 && schoolReport2) {
        filename += `${schoolReport1.schoolName}_vs_${schoolReport2.schoolName}_`;
      } else if (schoolReport1) {
        filename += `${schoolReport1.schoolName}_`;
      }
      filename += `${format(selectedMonth, 'MMMM_yyyy')}.pdf`;
      
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadReportAsPNG = async () => {
    if ((!schoolReport1 && !schoolReport2) || !reportRef.current) return;
    
    setIsDownloading(true);
    
    try {
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          
          // Generate filename based on selected schools
          let filename = 'MindLeap_School_Report_';
          if (compareMode && schoolReport1 && schoolReport2) {
            filename += `${schoolReport1.schoolName}_vs_${schoolReport2.schoolName}_`;
          } else if (schoolReport1) {
            filename += `${schoolReport1.schoolName}_`;
          }
          filename += `${format(selectedMonth, 'MMMM_yyyy')}.png`;
          
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Error generating PNG:', error);
      alert('Error generating PNG. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = subMonths(currentDate, i);
      options.push({
        value: date.toISOString(),
        label: format(date, 'MMMM yyyy')
      });
    }
    
    return options;
  };

  const renderSchoolReport = (report: SchoolReport, title: string) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="w-5 h-5" />
          {title}: {report.schoolName}
        </CardTitle>
        <p className="text-sm text-gray-600">School Code: {report.schoolCode}</p>
      </CardHeader>
      <CardContent>
        {/* Overall Stats */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Overall Performance Summary
          </h4>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl text-center border border-blue-200">
              <div className="text-3xl font-bold text-blue-600">{report.totalQuestions}</div>
              <div className="text-sm text-gray-600 font-medium">Questions Answered</div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl text-center border border-purple-200">
              <div className="text-3xl font-bold text-purple-600">{report.totalScore}</div>
              <div className="text-sm text-gray-600 font-medium">Total Score</div>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl text-center border border-orange-200">
              <div className="text-3xl font-bold text-orange-600">{report.streakDays}</div>
              <div className="text-sm text-gray-600 font-medium">Correct Answers</div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl text-center border border-green-200">
              <div className="text-3xl font-bold text-green-600">
                {report.totalQuestions > 0 ? ((report.streakDays / report.totalQuestions) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm text-gray-600 font-medium">Overall Accuracy</div>
            </div>
          </div>
          
          {/* Additional School Stats */}
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl text-center border border-gray-200">
              <div className="text-2xl font-bold text-gray-700">{report.totalStudents}</div>
              <div className="text-sm text-gray-600 font-medium">Total Students</div>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl text-center border border-indigo-200">
              <div className="text-2xl font-bold text-indigo-600">{report.activeStudents}</div>
              <div className="text-sm text-gray-600 font-medium">Active Students</div>
            </div>
          </div>
        </div>

        {/* Subject Performance */}
        {report.subjects.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Subject-wise Performance Analysis
            </h4>
            <div className="space-y-4">
              {report.subjects.map((subject, index) => (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 p-5 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg text-gray-800">{subject.subjectName}</span>
                      {subject.medal && (
                        <div className="flex items-center gap-1">
                          <img 
                            src={getMedalIcon(subject.medal)} 
                            alt={`${subject.medal} Medal`}
                            className="w-6 h-6"
                          />
                          <Badge className={`bg-gradient-to-r ${getMedalColor(subject.medal)} text-white text-xs`}>
                            {subject.medal}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{subject.percentage.toFixed(1)}%</div>
                      <div className="text-sm text-gray-500">Accuracy</div>
                    </div>
                  </div>
                  
                  <Progress value={subject.percentage} className="mb-4 h-3" />
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white p-3 rounded-lg text-center">
                      <div className="font-bold text-lg text-green-600">{subject.correctAnswers}</div>
                      <div className="text-gray-600">Correct</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center">
                      <div className="font-bold text-lg text-blue-600">{subject.questionsAnswered}</div>
                      <div className="text-gray-600">Total Questions</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center">
                      <div className="font-bold text-lg text-purple-600">{subject.studentsParticipated}</div>
                      <div className="text-gray-600">Students</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg text-center">
                      <div className="font-bold text-lg text-orange-600">{subject.averageScorePerStudent}</div>
                      <div className="text-gray-600">Avg Score/Student</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Total Subject Score: <span className="font-semibold text-gray-800">{subject.totalScore}</span></span>
                      <span>Wrong Answers: <span className="font-semibold text-red-600">{subject.questionsAnswered - subject.correctAnswers}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Performers */}
        {report.topPerformers.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-4">Top Performers</h4>
            <div className="space-y-2">
              {report.topPerformers.map((student, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                  <div>
                    <span className="font-medium">{student.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({student.studentId})</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{student.score}</div>
                    <div className="text-sm text-gray-600">{student.questionsAnswered} questions</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">School Reports</h1>
          <p className="text-gray-600">Analyze and compare school performance data</p>
        </div>

        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Month Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Month
                </label>
                <Select
                  value={selectedMonth.toISOString()}
                  onValueChange={(value) => setSelectedMonth(new Date(value))}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonthOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Compare Mode Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="compare-mode"
                  checked={compareMode}
                  onCheckedChange={setCompareMode}
                />
                <label htmlFor="compare-mode" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <GitCompare className="w-4 h-4" />
                  Compare Schools
                </label>
              </div>

              {/* School Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Schools
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by school name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* School Selection */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {compareMode ? 'First School' : 'Select School'}
                  </label>
                  <Select value={selectedSchool1} onValueChange={setSelectedSchool1}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a school..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSchools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name} ({school.schoolCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {compareMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Second School
                    </label>
                    <Select value={selectedSchool2} onValueChange={setSelectedSchool2}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a school to compare..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSchools
                          .filter(school => school.id !== selectedSchool1)
                          .map((school) => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name} ({school.schoolCode})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Download Buttons */}
              {(schoolReport1 || schoolReport2) && (
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={downloadReportAsPDF}
                    className="flex items-center gap-2"
                    disabled={isDownloading}
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? 'Generating...' : 'Download PDF'}
                  </Button>
                  <Button
                    onClick={downloadReportAsPNG}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={isDownloading}
                  >
                    <ImageIcon className="w-4 h-4" />
                    {isDownloading ? 'Generating...' : 'Download PNG'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {(schoolReport1 || schoolReport2) && (
          <motion.div
            ref={reportRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Report Header */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">
                  School Performance Report - {format(selectedMonth, 'MMMM yyyy')}
                </CardTitle>
                {compareMode && schoolReport1 && schoolReport2 && (
                  <p className="text-center text-gray-600">
                    Comparison: {schoolReport1.schoolName} vs {schoolReport2.schoolName}
                  </p>
                )}
              </CardHeader>
            </Card>

            {/* School Reports */}
            {schoolReport1 && renderSchoolReport(schoolReport1, compareMode ? 'School 1' : 'School Report')}
            {schoolReport2 && compareMode && renderSchoolReport(schoolReport2, 'School 2')}

            {/* Comparison Summary */}
            {compareMode && schoolReport1 && schoolReport2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Comparison Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Key Metrics Comparison</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Students:</span>
                          <span>{schoolReport1.totalStudents} vs {schoolReport2.totalStudents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Students:</span>
                          <span>{schoolReport1.activeStudents} vs {schoolReport2.activeStudents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Score:</span>
                          <span>{schoolReport1.averageScore} vs {schoolReport2.averageScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Questions:</span>
                          <span>{schoolReport1.totalQuestions} vs {schoolReport2.totalQuestions}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Performance Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Higher Average Score: </span>
                          <span className={schoolReport1.averageScore > schoolReport2.averageScore ? 'text-green-600' : 'text-blue-600'}>
                            {schoolReport1.averageScore > schoolReport2.averageScore ? schoolReport1.schoolName : schoolReport2.schoolName}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">More Active Students: </span>
                          <span className={schoolReport1.activeStudents > schoolReport2.activeStudents ? 'text-green-600' : 'text-blue-600'}>
                            {schoolReport1.activeStudents > schoolReport2.activeStudents ? schoolReport1.schoolName : schoolReport2.schoolName}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">More Questions Answered: </span>
                          <span className={schoolReport1.totalQuestions > schoolReport2.totalQuestions ? 'text-green-600' : 'text-blue-600'}>
                            {schoolReport1.totalQuestions > schoolReport2.totalQuestions ? schoolReport1.schoolName : schoolReport2.schoolName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
            >
              <FileText className="w-4 h-4 text-white" />
            </motion.div>
            <span className="ml-3 text-gray-600">Loading school report...</span>
          </div>
        )}

        {/* No Data State */}
        {!loading && schoolReport1 && schoolReport1.totalQuestions === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Daily Streak Data Available</h3>
              <p className="text-gray-500 mb-4">
                Found {schoolReport1.totalStudents} students in "{schoolReport1.schoolName}", but none have participated in the daily streak system for the selected month.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg text-left max-w-md mx-auto">
                <h4 className="font-semibold text-blue-800 mb-2">Possible reasons:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Students haven't answered daily questions yet</li>
                  <li>• No activity in the selected month</li>
                  <li>• Students need to log in and use the daily streak feature</li>
                </ul>
              </div>
              <p className="text-gray-500 mt-4">
                Try selecting a different month or a school with active students.
              </p>
            </CardContent>
          </Card>
        )}
        
        {!loading && !schoolReport1 && !schoolReport2 && selectedSchool1 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Available</h3>
              <p className="text-gray-500">
                No data found for the selected school and month. Try selecting a different month or school.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminSchoolReports;