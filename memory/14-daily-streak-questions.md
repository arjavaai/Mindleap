# Daily Streak Questions Management

## Overview
The Daily Streak Questions Management section provides comprehensive tools for administrators to manage subjects for the daily streak challenge. It allows adding, editing, and deleting subjects, assigning scheduled days for each subject, and managing questions within each subject. This system ensures that students receive consistent, scheduled daily questions based on subject rotation.

## Implementation Details

### File Location
- **Main Component**: `src/components/admin/DailyStreakQuestionsTab.tsx`
- **Question Management**: `src/components/admin/QuestionManagementScreen.tsx`
- **Access**: Available to administrators with 'questions' permission
- **Integration**: Part of the Admin Dashboard

### Key Features

#### 1. **Subject Management**
- **Add Subjects**: Create new subjects with scheduled days
- **Edit Subjects**: Update subject information and scheduling
- **Delete Subjects**: Remove subjects (main admin only)
- **View Subjects**: Display subject details and scheduling

#### 2. **Question Management**
- **Add Questions**: Create questions with rich text and images
- **Edit Questions**: Update question content and options
- **Delete Questions**: Remove questions from subjects
- **View Questions**: Display question details

#### 3. **Scheduling System**
- **Day Assignment**: Assign subjects to specific days of the week
- **Weekly Rotation**: Ensure consistent subject rotation
- **Question Selection**: Automatic question selection for daily challenges

#### 4. **Rich Content Support**
- **WYSIWYG Editor**: Rich text editing for questions and explanations
- **Image Upload**: Support for images in questions and options
- **HTML Support**: Full HTML support for rich content

### Database Connections

#### Firebase Collections Used:

1. **`subjects`** - Subject management data
   ```javascript
   {
     id: "subjectId",
     name: "Mathematics",
     scheduledDay: "Monday",
     isActive: true,
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

2. **`subjects/{subjectId}/questions`** - Questions for each subject
   ```javascript
   {
     id: "questionId",
     question: "What is 2 + 2?",
     options: [
       "3",
       "4",
       "5",
       "6"
     ],
     correctAnswer: 1,
     explanation: "2 + 2 equals 4 because...",
     createdAt: timestamp,
     updatedAt: timestamp
   }
   ```

3. **`dailyQuestions`** - Daily question scheduling
   ```javascript
   {
     id: "dateString", // e.g., "2024-01-15"
     questionId: "questionId",
     subjectId: "subjectId",
     scheduledDay: "Monday",
     totalAttempts: 150,
     correctAttempts: 120,
     createdAt: timestamp
   }
   ```

4. **`dailyStreaks`** - Student streak records
   ```javascript
   {
     id: "userId",
     currentStreak: 15,
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

### Component Architecture

#### Main Components:

1. **DailyStreakQuestionsTab Component**
   - Main container for subject management
   - Manages state and data operations
   - Handles subject CRUD operations

2. **QuestionManagementScreen Component**
   - Detailed question management interface
   - Manages questions within a specific subject
   - Handles question CRUD operations

3. **Subject Management Modals**:
   - `AddSubjectModal`: Form for adding new subjects
   - `EditSubjectModal`: Form for editing existing subjects
   - `ViewSubjectModal`: Display subject details
   - `DeleteSubjectModal`: Confirmation for deletion

4. **Question Management Modals**:
   - `AddQuestionModal`: Form for adding new questions
   - `EditQuestionModal`: Form for editing existing questions
   - `ViewQuestionModal`: Display question details
   - `DeleteQuestionModal`: Confirmation for deletion

#### State Management:
```javascript
const [subjects, setSubjects] = useState([]);
const [selectedSubject, setSelectedSubject] = useState(null);
const [showAddModal, setShowAddModal] = useState(false);
const [showEditModal, setShowEditModal] = useState(false);
const [showViewModal, setShowViewModal] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [loading, setLoading] = useState(false);
```

### Key Functions

#### 1. **fetchSubjects()**
```javascript
const fetchSubjects = async () => {
  setLoading(true);
  try {
    const subjectsSnapshot = await getDocs(collection(db, 'subjects'));
    const subjectsData = subjectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setSubjects(subjectsData);
  } catch (error) {
    console.error('Error fetching subjects:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 2. **handleAddSubject()**
```javascript
const handleAddSubject = async (subjectData) => {
  try {
    const newSubject = {
      ...subjectData,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await addDoc(collection(db, 'subjects'), newSubject);
    await fetchSubjects();
    setShowAddModal(false);
    
    toast.success('Subject added successfully');
  } catch (error) {
    console.error('Error adding subject:', error);
    toast.error('Error adding subject: ' + error.message);
  }
};
```

#### 3. **handleEditSubject()**
```javascript
const handleEditSubject = (subject) => {
  setSelectedSubject(subject);
  setShowEditModal(true);
};
```

#### 4. **handleUpdateSubject()**
```javascript
const handleUpdateSubject = async (updatedData) => {
  try {
    const subjectRef = doc(db, 'subjects', selectedSubject.id);
    await updateDoc(subjectRef, {
      ...updatedData,
      updatedAt: new Date()
    });
    
    await fetchSubjects();
    setShowEditModal(false);
    setSelectedSubject(null);
    
    toast.success('Subject updated successfully');
  } catch (error) {
    console.error('Error updating subject:', error);
    toast.error('Error updating subject: ' + error.message);
  }
};
```

#### 5. **handleDeleteSubject()**
```javascript
const handleDeleteSubject = async () => {
  try {
    // Check if subject has questions
    const questionsQuery = query(
      collection(db, 'subjects', selectedSubject.id, 'questions')
    );
    const questionsSnapshot = await getDocs(questionsQuery);
    
    if (questionsSnapshot.size > 0) {
      toast.error('Cannot delete subject with existing questions');
      return;
    }
    
    await deleteDoc(doc(db, 'subjects', selectedSubject.id));
    await fetchSubjects();
    setShowDeleteModal(false);
    setSelectedSubject(null);
    
    toast.success('Subject deleted successfully');
  } catch (error) {
    console.error('Error deleting subject:', error);
    toast.error('Error deleting subject');
  }
};
```

#### 6. **handleOpenQuestions()**
```javascript
const handleOpenQuestions = (subject) => {
  setSelectedSubject(subject);
  // Navigate to QuestionManagementScreen
  // This would typically use React Router or state management
  setShowQuestionManagement(true);
};
```

#### 7. **getDayColor()**
```javascript
const getDayColor = (day) => {
  const colorMap = {
    'Monday': 'bg-blue-100 text-blue-800',
    'Tuesday': 'bg-green-100 text-green-800',
    'Wednesday': 'bg-yellow-100 text-yellow-800',
    'Thursday': 'bg-purple-100 text-purple-800',
    'Friday': 'bg-red-100 text-red-800',
    'Saturday': 'bg-indigo-100 text-indigo-800',
    'Sunday': 'bg-pink-100 text-pink-800'
  };
  return colorMap[day] || 'bg-gray-100 text-gray-800';
};
```

### Question Management Functions

#### 1. **fetchQuestions()**
```javascript
const fetchQuestions = async (subjectId) => {
  setLoading(true);
  try {
    const questionsQuery = query(
      collection(db, 'subjects', subjectId, 'questions'),
      orderBy('createdAt', 'desc')
    );
    const questionsSnapshot = await getDocs(questionsQuery);
    
    const questionsData = questionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Handle different option formats from Firebase
        options: parseQuestionOptions(data.options)
      };
    });
    
    setQuestions(questionsData);
  } catch (error) {
    console.error('Error fetching questions:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 2. **parseQuestionOptions()**
```javascript
const parseQuestionOptions = (options) => {
  if (!options) return ['', '', '', ''];
  
  // Handle different Firebase data structures
  if (Array.isArray(options)) {
    return options;
  }
  
  if (typeof options === 'object') {
    // Handle object with keys like 'a', 'b', 'c', 'd' or 'A', 'B', 'C', 'D'
    const keys = Object.keys(options).sort();
    return keys.map(key => options[key]);
  }
  
  return ['', '', '', ''];
};
```

#### 3. **handleAddQuestion()**
```javascript
const handleAddQuestion = async (questionData) => {
  try {
    // Validate required fields
    if (!questionData.question.trim()) {
      toast.error('Question text is required');
      return;
    }
    
    if (!questionData.options.every(opt => opt.trim())) {
      toast.error('All options must be filled');
      return;
    }
    
    if (questionData.options.length !== 4) {
      toast.error('Exactly 4 options are required');
      return;
    }
    
    // Check for duplicate options
    const uniqueOptions = new Set(questionData.options);
    if (uniqueOptions.size !== 4) {
      toast.error('All options must be unique');
      return;
    }
    
    const newQuestion = {
      ...questionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await addDoc(collection(db, 'subjects', subject.id, 'questions'), newQuestion);
    await fetchQuestions(subject.id);
    setShowAddModal(false);
    
    toast.success('Question added successfully');
  } catch (error) {
    console.error('Error adding question:', error);
    toast.error('Error adding question: ' + error.message);
  }
};
```

#### 4. **handleEditQuestion()**
```javascript
const handleEditQuestion = (question) => {
  setSelectedQuestion(question);
  setShowEditModal(true);
};
```

#### 5. **handleUpdateQuestion()**
```javascript
const handleUpdateQuestion = async (updatedData) => {
  try {
    const questionRef = doc(db, 'subjects', subject.id, 'questions', selectedQuestion.id);
    await updateDoc(questionRef, {
      ...updatedData,
      updatedAt: new Date()
    });
    
    await fetchQuestions(subject.id);
    setShowEditModal(false);
    setSelectedQuestion(null);
    
    toast.success('Question updated successfully');
  } catch (error) {
    console.error('Error updating question:', error);
    toast.error('Error updating question: ' + error.message);
  }
};
```

#### 6. **handleDeleteQuestion()**
```javascript
const handleDeleteQuestion = async () => {
  try {
    await deleteDoc(doc(db, 'subjects', subject.id, 'questions', selectedQuestion.id));
    await fetchQuestions(subject.id);
    setShowDeleteModal(false);
    setSelectedQuestion(null);
    
    toast.success('Question deleted successfully');
  } catch (error) {
    console.error('Error deleting question:', error);
    toast.error('Error deleting question');
  }
};
```

#### 7. **stripHtml()**
```javascript
const stripHtml = (html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};
```

#### 8. **handleTooltip()**
```javascript
const handleTooltip = (questionId) => {
  setTooltipQuestion(prev => prev === questionId ? null : questionId);
};
```

### UI/UX Features

#### 1. **Subject List Display**
- **Table Format**: Clean, organized table layout
- **Day Indicators**: Color-coded day indicators
- **Status Indicators**: Visual status indicators (active/inactive)
- **Action Buttons**: Edit, view, delete, manage questions

#### 2. **Subject Forms**
- **Add Subject Form**: Simple form with name and day selection
- **Edit Subject Form**: Pre-populated form for updates
- **View Subject Modal**: Read-only detailed view
- **Delete Confirmation**: Safe deletion with confirmation

#### 3. **Question Management Interface**
- **Question List**: Display all questions for a subject
- **Rich Text Editor**: WYSIWYG editor for questions and explanations
- **Image Upload**: Support for images in content
- **Option Management**: Easy option editing and validation

#### 4. **Scheduling Display**
- **Weekly Calendar**: Visual representation of subject scheduling
- **Day Colors**: Color-coded days for easy identification
- **Subject Rotation**: Clear indication of subject rotation

### Data Flow

#### Subject Management Flow:
```
1. Admin accesses Daily Streak Questions tab
2. fetchSubjects() loads subject data
3. Admin creates/edits subjects
4. Day scheduling is configured
5. Subject is saved to Firebase
6. UI updates with new data
```

#### Question Management Flow:
```
1. Admin clicks "Manage Questions" for a subject
2. QuestionManagementScreen loads
3. fetchQuestions() loads questions for subject
4. Admin creates/edits questions
5. Rich content is processed and saved
6. Questions are saved to Firebase subcollection
7. UI updates with new data
```

### Performance Optimizations

#### 1. **Data Loading**
- **Batch Operations**: Efficient batch data loading
- **Subcollection Queries**: Optimized subcollection queries
- **Lazy Loading**: Load questions on demand

#### 2. **Content Processing**
- **Rich Text Optimization**: Efficient rich text processing
- **Image Optimization**: Optimized image handling
- **Validation**: Client-side validation

#### 3. **UI Optimization**
- **Minimal Re-renders**: Efficient state updates
- **Optimized Components**: Optimized component rendering
- **Smooth Animations**: Smooth UI transitions

### Error Handling

#### 1. **Validation Errors**
- **Required Fields**: Validate required form fields
- **Option Validation**: Validate question options
- **Content Validation**: Validate rich content

#### 2. **Database Errors**
- **Connection Issues**: Handle Firebase connection problems
- **Permission Errors**: Handle access permission issues
- **Data Corruption**: Handle corrupted data gracefully

#### 3. **Content Errors**
- **Rich Text Errors**: Handle rich text processing errors
- **Image Upload Errors**: Handle image upload failures
- **Format Errors**: Handle content format issues

### Security Considerations

#### 1. **Access Control**
- **Permission-based Access**: Only authorized admins can manage questions
- **Role Validation**: Verify admin roles before operations
- **Audit Logging**: Log all question management activities

#### 2. **Content Security**
- **Input Sanitization**: Sanitize all input data
- **HTML Security**: Secure HTML content processing
- **Image Security**: Secure image upload and storage

#### 3. **Data Integrity**
- **Validation**: Comprehensive data validation
- **Consistency**: Ensure data consistency
- **Backup**: Consider data backup strategies

### Integration Points

#### With Daily Streak Challenge:
- **Question Scheduling**: Automatic question selection
- **Subject Rotation**: Consistent subject scheduling
- **Performance Tracking**: Track question performance

#### With Student Dashboard:
- **Daily Questions**: Students receive scheduled questions
- **Subject Variety**: Consistent subject rotation
- **Engagement**: Maintain student engagement

#### With Analytics:
- **Question Performance**: Track question success rates
- **Subject Analysis**: Analyze subject performance
- **Trend Analysis**: Performance trend tracking
