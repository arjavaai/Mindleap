# Performance Reports

## Overview
The Performance Reports section (`/reports`) provides students with detailed monthly performance reports based on their daily streak activity. Students can select any month, view overall and subject-wise performance, and download reports as PDF or PNG files. The reports include comprehensive analytics, subject-wise breakdowns, and achievement recognition.

## Implementation Details

### File Location
- **Main Component**: `src/pages/Reports.tsx`

### Key Features

#### 1. **Monthly Report Generation**
- **Month Selection**: Students can choose any month with available data
- **Overall Performance**: Total questions, score, streak maintenance
- **Subject-wise Breakdown**: Performance analysis by subject
- **Achievement Recognition**: Medals and badges based on performance

#### 2. **Report Export Options**
- **PDF Export**: High-quality PDF reports using html2canvas and jspdf
- **PNG Export**: Image format for easy sharing
- **Print-friendly**: Optimized for printing and sharing

#### 3. **Performance Analytics**
- **Accuracy Metrics**: Percentage of correct answers
- **Subject Analysis**: Best and worst performing subjects
- **Streak Tracking**: Monthly streak maintenance
- **Progress Visualization**: Charts and progress indicators

### Database Connections

#### Firebase Collections Used:

1. **`students`** - Student profile data
   ```javascript
   {
     id: "userId",
     name: "Student Name",
     email: "student@mindleap.edu",
     schoolCode: "SCHOOL001",
     districtCode: "DIST001",
     state: "State Name"
   }
   ```

2. **`dailyStreaks`** - Student streak and performance data
   ```javascript
   {
     id: "userId",
     currentStreak: 15,
     longestStreak: 25,
     totalPoints: 450,
     records: [
       {
         date: "2024-01-15",
         questionId: "questionId",
         isCorrect: true,
         points: 10,
         subject: "Mathematics"
       }
     ]
   }
   ```

### Data Flow

#### Report Generation Flow:
```
1. Student visits /reports
2. fetchAvailableMonths() identifies months with data
3. Student selects a month
4. fetchMonthlyReport() runs:
   - Get student data
   - Get dailyStreaks records for selected month
   - Process records to calculate metrics
   - Generate subject-wise breakdown
   - Calculate overall performance
5. Display comprehensive report
```

#### Data Processing Flow:
```
1. Filter dailyStreaks records by selected month
2. Calculate overall metrics:
   - Total questions attempted
   - Total score earned
   - Streak maintenance
   - Accuracy percentage
3. Process subject-wise data:
   - Group records by subject
   - Calculate subject-specific metrics
   - Identify strongest/weakest subjects
4. Generate achievement data:
   - Medal assignment based on score
   - Badge recognition
   - Performance highlights
```

### Component Architecture

#### Main Components:

1. **Reports Component**
   - Manages report state and data fetching
   - Handles month selection and data processing
   - Coordinates report generation and export

#### State Management:
```javascript
const [availableMonths, setAvailableMonths] = useState([]);
const [selectedMonth, setSelectedMonth] = useState('');
const [monthlyReport, setMonthlyReport] = useState(null);
const [loading, setLoading] = useState(false);
const [exporting, setExporting] = useState(false);
```

### Key Functions

#### 1. **fetchAvailableMonths()**
```javascript
const fetchAvailableMonths = async () => {
  try {
    const studentDoc = await getDoc(doc(db, 'students', user.uid));
    if (studentDoc.exists()) {
      const studentData = studentDoc.data();
      
      // Get dailyStreaks data
      const streakDoc = await getDoc(doc(db, 'dailyStreaks', user.uid));
      if (streakDoc.exists()) {
        const streakData = streakDoc.data();
        const records = streakData.records || [];
        
        // Extract unique months from records
        const months = new Set();
        records.forEach(record => {
          if (record.date) {
            const date = new Date(record.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            months.add(monthKey);
          }
        });
        
        const sortedMonths = Array.from(months).sort().reverse();
        setAvailableMonths(sortedMonths);
        
        // Set default to most recent month
        if (sortedMonths.length > 0) {
          setSelectedMonth(sortedMonths[0]);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching available months:', error);
  }
};
```

#### 2. **fetchMonthlyReport()**
```javascript
const fetchMonthlyReport = async (month) => {
  if (!month) return;
  
  setLoading(true);
  try {
    const [year, monthNum] = month.split('-');
    const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
    
    // Get student data
    const studentDoc = await getDoc(doc(db, 'students', user.uid));
    const studentData = studentDoc.exists() ? studentDoc.data() : {};
    
    // Get dailyStreaks data
    const streakDoc = await getDoc(doc(db, 'dailyStreaks', user.uid));
    if (streakDoc.exists()) {
      const streakData = streakDoc.data();
      const records = streakData.records || [];
      
      // Filter records for selected month
      const monthlyRecords = records.filter(record => {
        if (!record.date) return false;
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      });
      
      // Calculate overall metrics
      const totalQuestions = monthlyRecords.length;
      const totalScore = monthlyRecords.reduce((sum, record) => sum + (record.points || 0), 0);
      const correctAnswers = monthlyRecords.filter(record => record.isCorrect).length;
      const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
      
      // Calculate streak maintenance
      const streakMaintained = calculateStreakMaintenance(monthlyRecords);
      
      // Process subject-wise data
      const subjectReports = processSubjectReports(monthlyRecords);
      
      // Generate report
      const report = {
        month: month,
        monthName: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        student: studentData,
        overall: {
          totalQuestions,
          totalScore,
          correctAnswers,
          accuracy,
          streakMaintained
        },
        subjects: subjectReports,
        strongestSubject: getStrongestSubject(subjectReports),
        focusArea: getFocusArea(subjectReports)
      };
      
      setMonthlyReport(report);
    }
  } catch (error) {
    console.error('Error fetching monthly report:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 3. **processSubjectReports()**
```javascript
const processSubjectReports = (records) => {
  const subjectMap = new Map();
  
  records.forEach(record => {
    const subject = record.subject || 'Unknown';
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, {
        subject,
        totalQuestions: 0,
        correctAnswers: 0,
        totalScore: 0
      });
    }
    
    const subjectData = subjectMap.get(subject);
    subjectData.totalQuestions++;
    if (record.isCorrect) {
      subjectData.correctAnswers++;
    }
    subjectData.totalScore += record.points || 0;
  });
  
  // Calculate accuracy for each subject
  const subjectReports = Array.from(subjectMap.values()).map(subject => ({
    ...subject,
    accuracy: subject.totalQuestions > 0 ? 
      Math.round((subject.correctAnswers / subject.totalQuestions) * 100) : 0
  }));
  
  return subjectReports.sort((a, b) => b.accuracy - a.accuracy);
};
```

#### 4. **calculateStreakMaintenance()**
```javascript
const calculateStreakMaintenance = (records) => {
  if (records.length === 0) return 0;
  
  // Sort records by date
  const sortedRecords = records.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let currentStreak = 0;
  let maxStreak = 0;
  
  sortedRecords.forEach(record => {
    if (record.isCorrect) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  });
  
  return maxStreak;
};
```

#### 5. **getStrongestSubject()**
```javascript
const getStrongestSubject = (subjectReports) => {
  if (subjectReports.length === 0) return null;
  
  return subjectReports.reduce((strongest, current) => 
    current.accuracy > strongest.accuracy ? current : strongest
  );
};
```

#### 6. **getFocusArea()**
```javascript
const getFocusArea = (subjectReports) => {
  if (subjectReports.length === 0) return null;
  
  return subjectReports.reduce((weakest, current) => 
    current.accuracy < weakest.accuracy ? current : weakest
  );
};
```

#### 7. **getMedalFromScore()**
```javascript
const getMedalFromScore = (score) => {
  if (score >= 400) return 'Platinum';
  if (score >= 300) return 'Gold';
  if (score >= 200) return 'Silver';
  if (score >= 100) return 'Bronze';
  return 'Participant';
};
```

#### 8. **getMedalIcon()**
```javascript
const getMedalIcon = (medal) => {
  const iconMap = {
    'Platinum': '/medals_icons/platinium_medal.png.png',
    'Gold': '/medals_icons/gold_medal.png.png',
    'Silver': '/medals_icons/silver_medal.png.png',
    'Bronze': '/medals_icons/bronze_medal.png.png',
    'Participant': '/medals_icons/bronze_medal.png.png'
  };
  return iconMap[medal] || iconMap['Participant'];
};
```

#### 9. **getMedalColor()**
```javascript
const getMedalColor = (medal) => {
  const colorMap = {
    'Platinum': 'text-purple-600',
    'Gold': 'text-yellow-600',
    'Silver': 'text-gray-600',
    'Bronze': 'text-orange-600',
    'Participant': 'text-gray-500'
  };
  return colorMap[medal] || colorMap['Participant'];
};
```

#### 10. **downloadReportAsPDF()**
```javascript
const downloadReportAsPDF = async () => {
  setExporting(true);
  try {
    const element = document.getElementById('report-content');
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
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
    
    pdf.save(`${monthlyReport.student.name}_${monthlyReport.monthName}_Report.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    setExporting(false);
  }
};
```

#### 11. **downloadReportAsPNG()**
```javascript
const downloadReportAsPNG = async () => {
  setExporting(true);
  try {
    const element = document.getElementById('report-content');
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    
    const link = document.createElement('a');
    link.download = `${monthlyReport.student.name}_${monthlyReport.monthName}_Report.png`;
    link.href = canvas.toDataURL();
    link.click();
  } catch (error) {
    console.error('Error generating PNG:', error);
  } finally {
    setExporting(false);
  }
};
```

### UI/UX Features

#### 1. **Month Selection**
- Dropdown with available months
- Automatic selection of most recent month
- Clear indication of data availability

#### 2. **Report Display**
- Clean, professional report layout
- Comprehensive performance metrics
- Visual indicators for achievements
- Subject-wise breakdown

#### 3. **Export Options**
- PDF export for high-quality reports
- PNG export for easy sharing
- Print-friendly formatting
- Loading states during export

#### 4. **Performance Visualization**
- Progress bars for accuracy
- Medal icons for achievements
- Color-coded performance indicators
- Clear metric displays

### Performance Optimizations

#### 1. **Data Processing**
- Efficient filtering of monthly records
- Optimized calculations for metrics
- Memoized subject-wise processing

#### 2. **Export Generation**
- High-quality canvas rendering
- Optimized PDF generation
- Efficient image processing

#### 3. **State Management**
- Minimal re-renders
- Efficient state updates
- Optimized data structures

### Error Handling

#### 1. **Data Validation**
- Validation of monthly data availability
- Handling of missing or corrupted records
- Fallback values for missing data

#### 2. **Export Errors**
- Graceful handling of export failures
- User feedback for errors
- Retry mechanisms

#### 3. **User Feedback**
- Loading states during operations
- Error notifications
- Clear error messages

### Integration Points

#### With Dashboard:
- Quick access from dashboard cards
- Recent report notifications
- Performance summaries

#### With Daily Streak:
- Real-time data from streak records
- Performance tracking integration
- Achievement synchronization

#### With Leaderboard:
- Performance data for rankings
- Achievement recognition
- Progress tracking

### Security Considerations

#### 1. **Data Privacy**
- User-specific report generation
- Protected student information
- Secure data processing

#### 2. **Access Control**
- Authenticated user access only
- User-specific data filtering
- Secure report generation

#### 3. **Data Integrity**
- Validation of report data
- Secure data transmission
- Protected export files

### Analytics and Insights

#### 1. **Performance Metrics**
- Overall performance trends
- Subject-wise analysis
- Accuracy improvements

#### 2. **Achievement Tracking**
- Medal progression
- Streak achievements
- Performance milestones

#### 3. **Progress Monitoring**
- Monthly progress tracking
- Performance comparisons
- Improvement identification
