import React, { useEffect, useState, useRef } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, subMonths, isAfter, isBefore } from 'date-fns';
import {
  Brain,
  Calendar,
  Download,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  ChevronLeft,
  Filter,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import StudentHeader from '../components/StudentHeader';
import StudentAuthGuard from '../components/auth/StudentAuthGuard';

interface SubjectReport {
  subjectName: string;
  questionsAnswered: number;
  totalScore: number;
  percentage: number;
  streak: number;
  medal: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | null;
}

interface MonthlyReport {
  month: string;
  year: number;
  totalQuestions: number;
  totalScore: number;
  streakMaintained: number;
  overallMedal: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | null;
  subjects: SubjectReport[];
}

const Reports = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [studentName, setStudentName] = useState('');
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchAvailableMonths();
  }, [user]);

  useEffect(() => {
    if (user && selectedMonth) {
      fetchMonthlyReport();
    }
  }, [user, selectedMonth]);

  const fetchAvailableMonths = async () => {
    if (!user) return;
    
    try {
      // Fetch daily streak data to see which months have data
      const userStreakDoc = await getDoc(doc(db, 'dailyStreaks', user.uid));
      const availableMonthsSet = new Set<string>();
      
      if (userStreakDoc.exists()) {
        const streakData = userStreakDoc.data();
        const records = streakData.records || {};
        
        // Get all months that have data
        Object.keys(records).forEach(dateString => {
          const date = new Date(dateString);
          const monthKey = format(date, 'yyyy-MM');
          availableMonthsSet.add(monthKey);
        });
      }
      
      setAvailableMonths(Array.from(availableMonthsSet).sort().reverse());
      
      // Set default to current month if available, otherwise the latest available month
      const currentMonth = format(new Date(), 'yyyy-MM');
      if (availableMonthsSet.has(currentMonth)) {
        setSelectedMonth(new Date());
      } else if (availableMonthsSet.size > 0) {
        const latestMonth = Array.from(availableMonthsSet).sort().reverse()[0];
        setSelectedMonth(new Date(latestMonth + '-01'));
      }
    } catch (error) {
      console.error('Error fetching available months:', error);
    }
  };

  const fetchMonthlyReport = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch student data
      const studentRef = doc(db, 'students', user.uid);
      const studentSnap = await getDoc(studentRef);
      
      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        setStudentName(studentData.name || studentData.studentId || 'Student');
      }

      // Fetch daily streak data for the selected month
      const userStreakDoc = await getDoc(doc(db, 'dailyStreaks', user.uid));
      
      if (userStreakDoc.exists()) {
        const streakData = userStreakDoc.data();
        const records = streakData.records || {};
        
        // Filter records for selected month
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);
        
        const monthRecords = Object.values(records).filter((record: any) => {
          const recordDate = record.timestamp?.toDate?.() || new Date(record.timestamp);
          return recordDate >= monthStart && recordDate <= monthEnd;
        });

        // Calculate subject-wise reports
        const subjectMap = new Map<string, SubjectReport>();
        let totalQuestions = 0;
        let totalScore = 0;
        let streakDays = 0;

        monthRecords.forEach((record: any) => {
          const subject = record.subject || 'General Knowledge';
          const points = record.points || (record.isCorrect ? 200 : 100);
          
          totalQuestions++;
          totalScore += points;
          if (record.isCorrect) streakDays++;

          if (!subjectMap.has(subject)) {
            subjectMap.set(subject, {
              subjectName: subject,
              questionsAnswered: 0,
              totalScore: 0,
              percentage: 0,
              streak: 0,
              medal: null
            });
          }

          const subjectReport = subjectMap.get(subject)!;
          subjectReport.questionsAnswered++;
          subjectReport.totalScore += points;
          if (record.isCorrect) subjectReport.streak++;
        });

        // Calculate percentages and medals for subjects
        const subjects: SubjectReport[] = Array.from(subjectMap.values()).map(subject => {
          const percentage = subject.questionsAnswered > 0 
            ? (subject.streak / subject.questionsAnswered) * 100 
            : 0;
          
          return {
            ...subject,
            percentage,
            medal: getMedalFromScore(subject.totalScore)
          };
        });

        const overallPercentage = totalQuestions > 0 ? (streakDays / totalQuestions) * 100 : 0;

        setMonthlyReport({
          month: format(selectedMonth, 'MMMM'),
          year: selectedMonth.getFullYear(),
          totalQuestions,
          totalScore,
          streakMaintained: streakDays,
          overallMedal: getMedalFromScore(totalScore),
          subjects: subjects.sort((a, b) => b.percentage - a.percentage)
        });
      } else {
        // No data for this month
        setMonthlyReport({
          month: format(selectedMonth, 'MMMM'),
          year: selectedMonth.getFullYear(),
          totalQuestions: 0,
          totalScore: 0,
          streakMaintained: 0,
          overallMedal: null,
          subjects: []
        });
      }
    } catch (error) {
      console.error('Error fetching monthly report:', error);
    }
    setLoading(false);
  };

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

  const getMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    // Generate last 12 months but only include available months
    for (let i = 0; i < 12; i++) {
      const date = subMonths(currentDate, i);
      const monthKey = format(date, 'yyyy-MM');
      
      // Only include months that have data and are not in the future
      if (availableMonths.includes(monthKey) && !isAfter(date, currentDate)) {
        options.push({
          value: date.toISOString(),
          label: format(date, 'MMMM yyyy')
        });
      }
    }
    
    return options;
  };

  const downloadReportAsPDF = async () => {
    if (!monthlyReport || !reportRef.current) return;
    
    setIsDownloading(true);
    
    try {
      // Dynamically import html2canvas and jspdf
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;
      
      // Capture the report content as canvas
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Download PDF
      pdf.save(`MindLeap_Report_${monthlyReport.month}_${monthlyReport.year}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadReportAsPNG = async () => {
    if (!monthlyReport || !reportRef.current) return;
    
    setIsDownloading(true);
    
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      // Capture the report content as canvas
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: reportRef.current.scrollWidth,
        height: reportRef.current.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `MindLeap_Report_${monthlyReport.month}_${monthlyReport.year}.png`;
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

  const downloadReportAsOldPDF = () => {
    if (!monthlyReport) return;
    
    // Create a new window for PDF generation that matches the exact report layout
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const htmlContent = `<!DOCTYPE html>
      <html>
        <head>
          <title>MindLeap Monthly Report - ${monthlyReport.month} ${monthlyReport.year}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 0; 
              padding: 20px;
              background: white; 
              color: #333;
              line-height: 1.6;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              padding-bottom: 20px;
              border-bottom: 3px solid #7C3AED;
            }
            .logo {
              color: #7C3AED;
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .title { 
              font-size: 28px; 
              font-weight: bold; 
              color: #1F2937;
              margin-bottom: 8px;
            }
            .subtitle {
              font-size: 18px;
              color: #6B7280;
              margin: 5px 0;
            }
            .card { 
              background: white;
              border: 1px solid #E5E7EB;
              border-radius: 16px;
              margin-bottom: 30px; 
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .card-header {
              background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
              padding: 20px 24px;
              border-bottom: 1px solid #E5E7EB;
            }
            .card-title { 
              font-size: 20px; 
              font-weight: bold; 
              color: #1F2937;
              margin: 0;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .card-content {
              padding: 24px;
            }
            .stats-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 24px; 
            }
            .stat-item { 
              text-align: center;
            }
            .stat-value { 
              font-size: 36px; 
              font-weight: bold; 
              margin-bottom: 4px;
            }
            .stat-value.blue { color: #2563EB; }
            .stat-value.purple { color: #7C3AED; }
            .stat-value.orange { color: #EA580C; }
            .stat-value.green { color: #16A34A; }
            .stat-label { 
              font-size: 14px; 
              color: #6B7280;
              font-weight: 500;
            }
            .subject-item { 
              background: #F9FAFB;
              padding: 20px; 
              border-radius: 12px;
              margin-bottom: 16px;
            }
            .subject-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
            }
            .subject-name { 
              font-weight: 600; 
              font-size: 18px;
              color: #1F2937;
            }
            .subject-percentage {
              text-align: right;
            }
            .percentage-value {
              font-size: 20px;
              font-weight: bold;
              color: #1F2937;
            }
            .questions-count {
              font-size: 14px;
              color: #6B7280;
            }
            .progress-bar {
              width: 100%;
              height: 8px;
              background-color: #E5E7EB;
              border-radius: 4px;
              margin-bottom: 12px;
              overflow: hidden;
            }
            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg, #3B82F6, #8B5CF6);
              border-radius: 4px;
              transition: width 0.3s ease;
            }
            .subject-stats { 
              display: flex;
              justify-content: space-between;
              font-size: 14px;
              color: #6B7280;
            }
            .subject-stat {
              display: flex;
              gap: 4px;
            }
            .subject-stat .value {
              font-weight: 600;
              color: #1F2937;
            }
            .no-data {
              text-align: center;
              color: #6B7280;
              font-style: italic;
              padding: 60px 20px;
              background: #F9FAFB;
              border-radius: 12px;
            }
            .no-data-icon {
              font-size: 48px;
              margin-bottom: 16px;
              color: #D1D5DB;
            }
            .no-data-title {
              font-size: 16px;
              font-weight: 500;
              margin-bottom: 8px;
            }
            .no-data-subtitle {
              font-size: 14px;
            }
            .recommendations {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 24px;
            }
            .rec-card {
              padding: 20px;
              border-radius: 12px;
            }
            .rec-card.strong {
              background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
              border: 1px solid #BBF7D0;
            }
            .rec-card.focus {
              background: linear-gradient(135deg, #FFF7ED 0%, #FED7AA 100%);
              border: 1px solid #FDBA74;
            }
            .rec-title {
              font-weight: 600;
              font-size: 16px;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .rec-title.strong { color: #166534; }
            .rec-title.focus { color: #9A3412; }
            .rec-content {
              margin-bottom: 8px;
            }
            .rec-content.strong { color: #15803D; }
            .rec-content.focus { color: #C2410C; }
            .rec-subtitle {
              font-size: 14px;
            }
            .rec-subtitle.strong { color: #16A34A; }
            .rec-subtitle.focus { color: #EA580C; }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #6B7280;
              font-size: 14px;
              border-top: 1px solid #E5E7EB;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">MindLeap</div>
              <div class="title">${monthlyReport.month} ${monthlyReport.year} Report</div>
              <div class="subtitle">Student: ${studentName}</div>
            </div>
            
            <div class="card">
              <div class="card-header">
                <div class="card-title">📊 Overall Performance</div>
              </div>
              <div class="card-content">
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-value blue">${monthlyReport.totalQuestions}</div>
                    <div class="stat-label">Questions Answered</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value purple">${monthlyReport.totalScore}</div>
                    <div class="stat-label">Total Score</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value orange">${monthlyReport.streakMaintained}</div>
                    <div class="stat-label">Streak Days</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-value green">${monthlyReport.totalQuestions > 0 ? ((monthlyReport.streakMaintained / monthlyReport.totalQuestions) * 100).toFixed(1) : 0}%</div>
                    <div class="stat-label">Accuracy</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="card">
              <div class="card-header">
                <div class="card-title">📈 Subject-wise Performance</div>
              </div>
              <div class="card-content">
                ${monthlyReport.subjects.length > 0 ? monthlyReport.subjects.map(subject => `
                  <div class="subject-item">
                    <div class="subject-header">
                      <div class="subject-name">${subject.subjectName}</div>
                      <div class="subject-percentage">
                        <div class="percentage-value">${subject.percentage.toFixed(1)}%</div>
                        <div class="questions-count">${subject.questionsAnswered} questions</div>
                      </div>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${subject.percentage}%"></div>
                    </div>
                    <div class="subject-stats">
                      <div class="subject-stat">
                        <span>Score:</span>
                        <span class="value">${subject.totalScore}</span>
                      </div>
                      <div class="subject-stat">
                        <span>Correct:</span>
                        <span class="value">${subject.streak}</span>
                      </div>
                    </div>
                  </div>
                `).join('') : `
                  <div class="no-data">
                    <div class="no-data-icon">📄</div>
                    <div class="no-data-title">No data available for ${monthlyReport.month} ${monthlyReport.year}</div>
                    <div class="no-data-subtitle">Try selecting a different month or start answering daily questions!</div>
                  </div>
                `}
              </div>
            </div>
            
            ${monthlyReport.subjects.length > 0 ? `
              <div class="card">
                <div class="card-header">
                  <div class="card-title">🎯 Performance Analysis & Recommendations</div>
                </div>
                <div class="card-content">
                  <div class="recommendations">
                    <div class="rec-card strong">
                      <div class="rec-title strong">📈 Strongest Subject</div>
                      <div class="rec-content strong">
                        <strong>${monthlyReport.subjects[0].subjectName}</strong> - ${monthlyReport.subjects[0].percentage.toFixed(1)}% accuracy
                      </div>
                      <div class="rec-subtitle strong">Great job! Keep up the excellent work in this subject.</div>
                    </div>
                    <div class="rec-card focus">
                      <div class="rec-title focus">🎯 Focus Area</div>
                      <div class="rec-content focus">
                        <strong>${monthlyReport.subjects[monthlyReport.subjects.length - 1].subjectName}</strong> - ${monthlyReport.subjects[monthlyReport.subjects.length - 1].percentage.toFixed(1)}% accuracy
                      </div>
                      <div class="rec-subtitle focus">Consider spending more time practicing this subject.</div>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}
            
            <div class="footer">
              Generated on ${format(new Date(), 'MMMM dd, yyyy')} • MindLeap - Ignite Young Minds
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <FileText className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-lg font-semibold text-gray-700">Generating your report...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <StudentAuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        {/* Header */}
        <StudentHeader backTo="/dashboard" />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Report Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Month
                    </label>
                    <Select
                      value={selectedMonth.toISOString()}
                      onValueChange={(value) => setSelectedMonth(new Date(value))}
                    >
                      <SelectTrigger>
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
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={downloadReportAsPDF}
                      className="flex items-center gap-2"
                      disabled={!monthlyReport || isDownloading}
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? 'Generating...' : 'Download PDF'}
                    </Button>
                    <Button
                      onClick={downloadReportAsPNG}
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={!monthlyReport || isDownloading}
                    >
                      <ImageIcon className="w-4 h-4" />
                      {isDownloading ? 'Generating...' : 'Download PNG'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Report Content */}
          {monthlyReport && (
            <motion.div
              ref={reportRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Report Header */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col space-y-4">
                    {/* Student Information */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{monthlyReport.month} {monthlyReport.year} Report</h2>
                        {studentName && (
                          <div className="mt-2 space-y-1">
                            <p className="text-lg font-semibold text-blue-600">{studentName}</p>
                            <p className="text-sm text-gray-600">Student ID: {user?.email?.split('@')[0]?.toUpperCase() || 'N/A'}</p>
                          </div>
                        )}
                      </div>
                      {monthlyReport.overallMedal && (
                        <div className="flex items-center gap-2">
                          <img 
                            src={getMedalIcon(monthlyReport.overallMedal)} 
                            alt={`${monthlyReport.overallMedal} Medal`}
                            className="w-8 h-8"
                          />
                          <Badge className={`bg-gradient-to-r ${getMedalColor(monthlyReport.overallMedal)} text-white`}>
                            {monthlyReport.overallMedal}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{monthlyReport.totalQuestions}</div>
                      <div className="text-sm text-gray-600">Questions Answered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{monthlyReport.totalScore}</div>
                      <div className="text-sm text-gray-600">Total Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">{monthlyReport.streakMaintained}</div>
                      <div className="text-sm text-gray-600">Streak Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {monthlyReport.totalQuestions > 0 
                          ? ((monthlyReport.streakMaintained / monthlyReport.totalQuestions) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <div className="text-sm text-gray-600">Accuracy</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subject-wise Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Subject-wise Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyReport.subjects.length > 0 ? (
                    <div className="space-y-4">
                      {monthlyReport.subjects.map((subject, index) => (
                        <motion.div
                          key={subject.subjectName}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-gray-800">{subject.subjectName}</h3>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg">{subject.percentage.toFixed(1)}%</div>
                              <div className="text-sm text-gray-600">{subject.questionsAnswered} questions</div>
                            </div>
                          </div>
                          
                          <Progress value={subject.percentage} className="h-2 mb-2" />
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Score: </span>
                              <span className="font-semibold">{subject.totalScore}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Correct: </span>
                              <span className="font-semibold">{subject.streak}</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No data available for {monthlyReport.month} {monthlyReport.year}</p>
                      <p className="text-sm text-gray-400">Try selecting a different month or start answering daily questions!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              {monthlyReport.subjects.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Performance Analysis & Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Strongest Subject
                        </h4>
                        <p className="text-green-700">
                          <strong>{monthlyReport.subjects[0].subjectName}</strong> - 
                          {monthlyReport.subjects[0].percentage.toFixed(1)}% accuracy
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Great job! Keep up the excellent work in this subject.
                        </p>
                      </div>
                      
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Focus Area
                        </h4>
                        <p className="text-orange-700">
                          <strong>{monthlyReport.subjects[monthlyReport.subjects.length - 1].subjectName}</strong> - 
                          {monthlyReport.subjects[monthlyReport.subjects.length - 1].percentage.toFixed(1)}% accuracy
                        </p>
                        <p className="text-sm text-orange-600 mt-1">
                          Consider spending more time practicing this subject.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </StudentAuthGuard>
  );
};

export default Reports;