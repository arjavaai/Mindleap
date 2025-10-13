# Quiz Management

## Overview
The Quiz Management section provides comprehensive tools for administrators to create, edit, delete, and manage quizzes. It includes a multi-step wizard for quiz creation, supports bulk import of questions via CSV, and displays leaderboards and statistics for each quiz. Quizzes can be targeted to specific states, districts, schools, or individual students.

## Implementation Details

### File Location
- **Main Component**: `src/components/admin/QuizManagementTab.tsx`
- **Access**: Available to administrators with 'quizzes' permission
- **Integration**: Part of the Admin Dashboard

### Key Features

#### 1. **Quiz CRUD Operations**
- **Create Quizzes**: Multi-step wizard for quiz creation
- **Edit Quizzes**: Update existing quiz information
- **Delete Quizzes**: Remove quiz records (main admin only)
- **View Quizzes**: Detailed quiz information display

#### 2. **Question Management**
- **Add Questions**: Individual question creation
- **Bulk Import**: CSV-based bulk question import
- **Edit Questions**: Update question details
- **Delete Questions**: Remove questions from quizzes

#### 3. **Targeting System**
- **Geographic Targeting**: Target by state, district, or school
- **Student Targeting**: Target specific students
- **Audience Control**: Control who can access quizzes

#### 4. **Analytics and Reporting**
- **Quiz Statistics**: Performance metrics for each quiz
- **Leaderboards**: Student performance rankings
- **Export Functionality**: Export quiz results to CSV

### Database Connections

#### Firebase Collections Used:

1. **`quizzes`** - Quiz management data
   ```javascript
   {
     id: "quizId",
     title: "Quiz Title",
     description: "Quiz Description",
     questions: [
       {
         id: "questionId",
         question: "Question text",
         options: ["Option A", "Option B", "Option C", "Option D"],
         correctAnswer: 0,
         explanation: "Explanation text"
       }
     ],
     duration: 30,
     targetType: "all", // "all", "state", "district", "school", "students"
     targetStateId: "ST",
     targetDistrictId: "01",
     targetSchoolId: "SCHOOL001",
     targetStudentIds: ["studentId1", "studentId2"],
     expiryType: "date", // "date", "attempts", "never"
     expiryValue: "2024-12-31",
     maxAttempts: 3,
     isActive: true,
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

2. **`quizAttempts`** - Student quiz attempts
   ```javascript
   {
     id: "attemptId",
     quizId: "quizId",
     studentId: "studentId",
     studentName: "Student Name",
     score: 85,
     totalQuestions: 10,
     correctAnswers: 8.5,
     completionTime: 25,
     submittedAt: timestamp,
     answers: [
       {
         questionId: "questionId",
         selectedAnswer: 0,
         isCorrect: true
       }
     ]
   }
   ```

3. **`students`** - Student data for targeting and leaderboards
   ```javascript
   {
     id: "studentId",
     name: "Student Name",
     schoolCode: "SCHOOL001",
     districtCode: "01",
     stateCode: "ST"
   }
   ```

4. **`schools`** - School data for targeting
   ```javascript
   {
     id: "schoolId",
     name: "School Name",
     code: "SCHOOL001",
     stateCode: "ST",
     districtCode: "01"
   }
   ```

5. **`states`** - State and district data for targeting
   ```javascript
   {
     id: "stateId",
     name: "State Name",
     code: "ST",
     districts: [
       {
         name: "District Name",
         code: "01"
       }
     ]
   }
   ```

### Component Architecture

#### Main Components:

1. **QuizManagementTab Component**
   - Main container for quiz management
   - Manages state and data operations
   - Handles quiz creation wizard

2. **Quiz Management Modals**:
   - `CreateQuizModal`: Multi-step quiz creation wizard
   - `EditQuizModal`: Form for editing existing quizzes
   - `ViewQuizModal`: Display quiz details
   - `DeleteQuizModal`: Confirmation for deletion
   - `QuizStatsModal`: Display quiz statistics and leaderboard

#### State Management:
```javascript
const [quizzes, setQuizzes] = useState([]);
const [states, setStates] = useState([]);
const [selectedQuiz, setSelectedQuiz] = useState(null);
const [showCreateModal, setShowCreateModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showViewModal, setShowViewModal] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [showStatsModal, setShowStatsModal] = useState(false);
const [quizStats, setQuizStats] = useState(null);
const [loading, setLoading] = useState(false);
```

### Key Functions

#### 1. **fetchQuizzes()**
```javascript
const fetchQuizzes = async () => {
  setLoading(true);
  try {
    const quizzesSnapshot = await getDocs(collection(db, 'quizzes'));
    const quizzesData = quizzesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setQuizzes(quizzesData);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 2. **fetchStates()**
```javascript
const fetchStates = async () => {
  try {
    const statesSnapshot = await getDocs(collection(db, 'states'));
    const statesData = statesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setStates(statesData);
  } catch (error) {
    console.error('Error fetching states:', error);
  }
};
```

#### 3. **handleCreateQuiz()**
```javascript
const handleCreateQuiz = async (quizData) => {
  try {
    const newQuiz = {
      ...quizData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await addDoc(collection(db, 'quizzes'), newQuiz);
    await fetchQuizzes();
    setShowCreateModal(false);
    
    toast.success('Quiz created successfully');
  } catch (error) {
    console.error('Error creating quiz:', error);
    toast.error('Error creating quiz: ' + error.message);
  }
};
```

#### 4. **handleEditQuiz()**
```javascript
const handleEditQuiz = (quiz) => {
  setSelectedQuiz(quiz);
  setShowEditModal(true);
};
```

#### 5. **handleUpdateQuiz()**
```javascript
const handleUpdateQuiz = async (updatedData) => {
  try {
    const quizRef = doc(db, 'quizzes', selectedQuiz.id);
    await updateDoc(quizRef, {
      ...updatedData,
      updatedAt: new Date()
    });
    
    await fetchQuizzes();
    setShowEditModal(false);
    setSelectedQuiz(null);
    
    toast.success('Quiz updated successfully');
  } catch (error) {
    console.error('Error updating quiz:', error);
    toast.error('Error updating quiz: ' + error.message);
  }
};
```

#### 6. **handleDeleteQuiz()**
```javascript
const handleDeleteQuiz = async () => {
  try {
    await deleteDoc(doc(db, 'quizzes', selectedQuiz.id));
    await fetchQuizzes();
    setShowDeleteModal(false);
    setSelectedQuiz(null);
    
    toast.success('Quiz deleted successfully');
  } catch (error) {
    console.error('Error deleting quiz:', error);
    toast.error('Error deleting quiz');
  }
};
```

#### 7. **addQuestion()**
```javascript
const addQuestion = (questions, setQuestions) => {
  const newQuestion = {
    id: Date.now().toString(),
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  };
  setQuestions([...questions, newQuestion]);
};
```

#### 8. **removeQuestion()**
```javascript
const removeQuestion = (questionId, questions, setQuestions) => {
  setQuestions(questions.filter(q => q.id !== questionId));
};
```

#### 9. **fetchQuizStats()**
```javascript
const fetchQuizStats = async (quizId) => {
  try {
    // Get quiz attempts
    const attemptsQuery = query(
      collection(db, 'quizAttempts'),
      where('quizId', '==', quizId)
    );
    const attemptsSnapshot = await getDocs(attemptsQuery);
    
    const attempts = attemptsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Enrich with student and school data
    const enrichedAttempts = await Promise.all(
      attempts.map(async (attempt) => {
        try {
          const studentDoc = await getDoc(doc(db, 'students', attempt.studentId));
          const studentData = studentDoc.exists() ? studentDoc.data() : {};
          
          // Get school name
          let schoolName = '';
          if (studentData.schoolCode) {
            const schoolQuery = query(
              collection(db, 'schools'),
              where('code', '==', studentData.schoolCode)
            );
            const schoolSnapshot = await getDocs(schoolQuery);
            const schoolData = schoolSnapshot.docs[0]?.data();
            schoolName = schoolData?.name || '';
          }
          
          return {
            ...attempt,
            schoolName,
            districtCode: studentData.districtCode,
            stateCode: studentData.stateCode
          };
        } catch (error) {
          console.error(`Error enriching attempt ${attempt.id}:`, error);
          return attempt;
        }
      })
    );
    
    // Calculate statistics
    const stats = {
      totalAttempts: enrichedAttempts.length,
      averageScore: enrichedAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / enrichedAttempts.length,
      highestScore: Math.max(...enrichedAttempts.map(attempt => attempt.score)),
      lowestScore: Math.min(...enrichedAttempts.map(attempt => attempt.score)),
      averageCompletionTime: enrichedAttempts.reduce((sum, attempt) => sum + attempt.completionTime, 0) / enrichedAttempts.length,
      attempts: enrichedAttempts.sort((a, b) => b.score - a.score || a.completionTime - b.completionTime)
    };
    
    setQuizStats(stats);
    setShowStatsModal(true);
  } catch (error) {
    console.error('Error fetching quiz stats:', error);
    toast.error('Error fetching quiz statistics');
  }
};
```

#### 10. **exportStatsToCSV()**
```javascript
const exportStatsToCSV = () => {
  if (!quizStats) return;
  
  try {
    const exportData = quizStats.attempts.map((attempt, index) => ({
      'Rank': index + 1,
      'Student Name': attempt.studentName,
      'School': attempt.schoolName,
      'District': attempt.districtCode,
      'State': attempt.stateCode,
      'Score': attempt.score,
      'Total Questions': attempt.totalQuestions,
      'Correct Answers': attempt.correctAnswers,
      'Completion Time (minutes)': attempt.completionTime,
      'Submitted At': new Date(attempt.submittedAt.seconds * 1000).toLocaleString()
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quiz Results');
    
    const fileName = `quiz_${selectedQuiz.title}_results_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success('Quiz statistics exported successfully');
  } catch (error) {
    console.error('Error exporting quiz stats:', error);
    toast.error('Error exporting quiz statistics');
  }
};
```

#### 11. **downloadTemplate()**
```javascript
const downloadTemplate = () => {
  const templateData = [
    {
      'Question': 'Sample question text',
      'Option A': 'First option',
      'Option B': 'Second option',
      'Option C': 'Third option',
      'Option D': 'Fourth option',
      'Correct Answer': 'A',
      'Explanation': 'Explanation for the correct answer'
    }
  ];
  
  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Questions Template');
  
  XLSX.writeFile(wb, 'quiz_questions_template.xlsx');
  toast.success('Template downloaded successfully');
};
```

#### 12. **handleBulkImport()**
```javascript
const handleBulkImport = (file, questions, setQuestions) => {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      const importedQuestions = jsonData.map((row, index) => ({
        id: `imported_${Date.now()}_${index}`,
        question: row['Question'] || '',
        options: [
          row['Option A'] || '',
          row['Option B'] || '',
          row['Option C'] || '',
          row['Option D'] || ''
        ],
        correctAnswer: getCorrectAnswerIndex(row['Correct Answer']),
        explanation: row['Explanation'] || ''
      }));
      
      setQuestions([...questions, ...importedQuestions]);
      toast.success(`${importedQuestions.length} questions imported successfully`);
    } catch (error) {
      console.error('Error importing questions:', error);
      toast.error('Error importing questions: ' + error.message);
    }
  };
  
  reader.readAsArrayBuffer(file);
};
```

#### 13. **getCorrectAnswerIndex()**
```javascript
const getCorrectAnswerIndex = (correctAnswer) => {
  const answerMap = {
    'A': 0,
    'B': 1,
    'C': 2,
    'D': 3,
    'a': 0,
    'b': 1,
    'c': 2,
    'd': 3
  };
  return answerMap[correctAnswer] || 0;
};
```

### UI/UX Features

#### 1. **Quiz List Display**
- **Table Format**: Clean, organized table layout
- **Sortable Columns**: Sort by title, date, status
- **Status Indicators**: Visual status indicators (active/inactive)
- **Action Buttons**: Edit, view, delete, stats

#### 2. **Quiz Creation Wizard**
- **Multi-step Process**: Step-by-step quiz creation
- **Question Management**: Add, edit, remove questions
- **Targeting Options**: Geographic and student targeting
- **Validation**: Form validation and error handling

#### 3. **Question Management**
- **Individual Questions**: Add questions one by one
- **Bulk Import**: CSV-based bulk question import
- **Template Download**: Download Excel template
- **Question Preview**: Preview questions before saving

#### 4. **Analytics Display**
- **Statistics Overview**: Key performance metrics
- **Leaderboard**: Student performance rankings
- **Export Options**: CSV export functionality
- **Visual Charts**: Performance visualization

### Data Flow

#### Quiz Management Flow:
```
1. Admin accesses Quiz Management tab
2. fetchQuizzes() loads quiz data
3. fetchStates() loads state/district data
4. Admin creates/edits quizzes
5. Questions are added/imported
6. Targeting is configured
7. Quiz is saved to Firebase
8. UI updates with new data
```

#### Quiz Statistics Flow:
```
1. Admin clicks "View Stats" for a quiz
2. fetchQuizStats() is called
3. Quiz attempts are retrieved
4. Student and school data is enriched
5. Statistics are calculated
6. Leaderboard is generated
7. Data is displayed in modal
```

### Performance Optimizations

#### 1. **Data Loading**
- **Batch Operations**: Efficient batch data loading
- **Caching**: Cached state and district data
- **Lazy Loading**: Load quiz data on demand

#### 2. **Question Management**
- **Bulk Operations**: Efficient bulk question import
- **Validation**: Client-side validation
- **Preview**: Real-time question preview

#### 3. **Statistics Calculation**
- **Parallel Processing**: Concurrent data enrichment
- **Caching**: Cached statistics data
- **Optimized Queries**: Efficient database queries

### Error Handling

#### 1. **Validation Errors**
- **Required Fields**: Validate required form fields
- **Question Validation**: Validate question structure
- **Targeting Validation**: Validate targeting configuration

#### 2. **Import Errors**
- **File Format**: Validate CSV file format
- **Data Validation**: Validate imported data
- **Error Reporting**: Clear error messages

#### 3. **Database Errors**
- **Connection Issues**: Handle Firebase connection problems
- **Permission Errors**: Handle access permission issues
- **Data Corruption**: Handle corrupted data gracefully

### Security Considerations

#### 1. **Access Control**
- **Permission-based Access**: Only authorized admins can manage quizzes
- **Role Validation**: Verify admin roles before operations
- **Audit Logging**: Log all quiz management activities

#### 2. **Data Protection**
- **Input Sanitization**: Sanitize all input data
- **Question Security**: Protect question content
- **Data Integrity**: Ensure data consistency

#### 3. **Targeting Security**
- **Access Control**: Validate targeting permissions
- **Data Privacy**: Protect student data
- **Audit Trail**: Track targeting changes

### Integration Points

#### With Student Dashboard:
- **Quiz Access**: Students access targeted quizzes
- **Performance Tracking**: Track student performance
- **Leaderboards**: Display quiz leaderboards

#### With User Management:
- **Student Targeting**: Target specific students
- **Performance Data**: Access student performance data
- **Bulk Operations**: Manage students by quiz

#### With Analytics:
- **Performance Metrics**: Quiz performance tracking
- **Comparative Analysis**: Quiz comparison tools
- **Trend Analysis**: Performance trend tracking
