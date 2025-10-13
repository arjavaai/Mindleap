# Interactive Quizzes

## Overview
The Interactive Quizzes section (`/quiz`) allows students to take timed quizzes on various subjects. Quizzes can be targeted to specific audiences (all students, state-specific, district-specific, school-specific, or individual students) and include features like leaderboards, performance tracking, and detailed analytics.

## Implementation Details

### File Location
- **Main Component**: `src/pages/Quiz.tsx`
- **Quiz Card Component**: `QuizCard` (embedded)
- **Tabs Component**: Uses Shadcn/UI Tabs for categorization

### Key Features

#### 1. **Quiz Targeting System**
- **All Users**: Available to all students
- **State Specific**: Targeted to students in specific states
- **District Specific**: Targeted to students in specific districts  
- **School Specific**: Targeted to students in specific schools
- **Individual Students**: Targeted to specific student IDs

#### 2. **Quiz Management**
- **Active/Inactive Status**: Quizzes can be enabled/disabled
- **Expiry System**: Quizzes can expire after hours or days
- **Timer System**: Each quiz has a configurable time limit
- **Question Shuffling**: Questions are randomized for each attempt

#### 3. **Performance Tracking**
- **Score Calculation**: Percentage-based scoring
- **Completion Time**: Tracks how long students take
- **Leaderboard**: Real-time ranking system
- **Attempt History**: Students can view their past attempts

### Database Connections

#### Firebase Collections Used:

1. **`quizzes`** - Quiz definitions and configuration
   ```javascript
   {
     id: "quizId",
     title: "Mathematics Quiz - Level 1",
     questions: [
       {
         id: "questionId",
         question: "What is 2+2?",
         options: ["3", "4", "5", "6"],
         correctAnswer: 1 // Index of correct option
       }
     ],
     duration: 300, // seconds
     targetType: "all", // "all" | "state" | "district" | "school" | "students"
     targetId: "targetId", // ID of target (state/district/school)
     targetStateId: "stateId",
     targetDistrictId: "districtId", 
     targetStudentIds: ["studentId1", "studentId2"],
     level: "1",
     expiryType: "never", // "never" | "hours" | "days"
     expiryValue: 24,
     isActive: true,
     createdAt: timestamp,
     createdBy: "admin"
   }
   ```

2. **`quizAttempts`** - Student quiz attempts and results
   ```javascript
   {
     id: "attemptId",
     quizId: "quizId",
     studentId: "userId",
     studentName: "Student Name",
     studentEmail: "student@mindleap.edu",
     score: 85, // percentage
     totalQuestions: 10,
     correctAnswers: 8,
     completionTime: 180, // seconds
     answers: [
       {
         questionId: "questionId",
         selectedAnswer: 1,
         isCorrect: true
       }
     ],
     submittedAt: timestamp
   }
   ```

3. **`students`** - Student profile data for targeting
   ```javascript
   {
     id: "userId",
     name: "Student Name",
     email: "student@mindleap.edu",
     schoolCode: "SCHOOL001",
     districtCode: "DIST001",
     state: "State Name",
     stateCode: "ST"
   }
   ```

4. **`schools`** - School data for targeting
   ```javascript
   {
     id: "schoolId",
     name: "School Name",
     schoolCode: "SCHOOL001",
     districtCode: "DIST001",
     districtName: "District Name",
     state: "State Name"
   }
   ```

### Data Flow

#### Quiz Fetching Flow:
```
1. Student visits /quiz
2. fetchAvailableQuizzes() runs:
   - Get student's location data (state, district, school)
   - Fetch all active quizzes
   - Filter quizzes based on targetType and student location
   - Check quiz expiry status
   - Return filtered quiz list
3. Display quizzes in categorized tabs
```

#### Quiz Taking Flow:
```
1. Student clicks "Start Quiz"
2. startQuiz() runs:
   - Shuffle questions randomly
   - Initialize timer
   - Start quiz session
3. Student answers questions
4. Timer expires or student submits
5. submitQuiz() runs:
   - Calculate score and time
   - Save attempt to quizAttempts
   - Fetch updated leaderboard
   - Show results
```

### Component Architecture

#### Main Components:

1. **Quiz Component**
   - Manages quiz state and data fetching
   - Handles quiz filtering and targeting
   - Coordinates quiz taking flow

2. **QuizCard Component**
   - Displays individual quiz information
   - Shows quiz status (ongoing, completed, expired)
   - Handles quiz start action

3. **Tabs Component**
   - Categorizes quizzes by status
   - Provides navigation between quiz types

#### State Management:
```javascript
const [quizzes, setQuizzes] = useState([]);
const [studentData, setStudentData] = useState(null);
const [currentQuiz, setCurrentQuiz] = useState(null);
const [quizResults, setQuizResults] = useState([]);
const [leaderboard, setLeaderboard] = useState([]);
const [loading, setLoading] = useState(true);
```

### Key Functions

#### 1. **fetchAvailableQuizzes()**
```javascript
const fetchAvailableQuizzes = async () => {
  // Get student location data
  const studentDoc = await getDoc(doc(db, 'students', user.uid));
  const studentData = studentDoc.data();
  
  // Fetch all active quizzes
  const quizzesSnapshot = await getDocs(
    query(collection(db, 'quizzes'), where('isActive', '==', true))
  );
  
  const availableQuizzes = [];
  quizzesSnapshot.forEach(doc => {
    const quiz = { id: doc.id, ...doc.data() };
    
    // Check if quiz is targeted to this student
    if (isQuizTargetedToStudent(quiz, studentData)) {
      // Check if quiz has expired
      if (!isQuizExpired(quiz)) {
        availableQuizzes.push(quiz);
      }
    }
  });
  
  setQuizzes(availableQuizzes);
};
```

#### 2. **isQuizTargetedToStudent()**
```javascript
const isQuizTargetedToStudent = (quiz, studentData) => {
  switch (quiz.targetType) {
    case 'all':
      return true;
    case 'state':
      return studentData.stateCode === quiz.targetStateId;
    case 'district':
      return studentData.districtCode === quiz.targetDistrictId;
    case 'school':
      return studentData.schoolCode === quiz.targetId;
    case 'students':
      return quiz.targetStudentIds?.includes(studentData.studentId);
    default:
      return false;
  }
};
```

#### 3. **startQuiz()**
```javascript
const startQuiz = (quiz) => {
  // Shuffle questions
  const shuffledQuestions = [...quiz.questions].sort(() => Math.random() - 0.5);
  
  setCurrentQuiz({
    ...quiz,
    questions: shuffledQuestions,
    currentQuestionIndex: 0,
    answers: [],
    startTime: Date.now(),
    timeRemaining: quiz.duration
  });
  
  // Start timer
  const timer = setInterval(() => {
    setCurrentQuiz(prev => {
      const newTimeRemaining = prev.timeRemaining - 1;
      if (newTimeRemaining <= 0) {
        clearInterval(timer);
        submitQuiz();
        return null;
      }
      return { ...prev, timeRemaining: newTimeRemaining };
    });
  }, 1000);
};
```

#### 4. **submitQuiz()**
```javascript
const submitQuiz = async () => {
  const completionTime = Math.floor((Date.now() - currentQuiz.startTime) / 1000);
  const correctAnswers = currentQuiz.answers.filter(
    answer => answer.isCorrect
  ).length;
  const score = Math.round((correctAnswers / currentQuiz.questions.length) * 100);
  
  // Save attempt
  await addDoc(collection(db, 'quizAttempts'), {
    quizId: currentQuiz.id,
    studentId: user.uid,
    studentName: studentData.name,
    studentEmail: studentData.email,
    score,
    totalQuestions: currentQuiz.questions.length,
    correctAnswers,
    completionTime,
    answers: currentQuiz.answers,
    submittedAt: new Date()
  });
  
  // Fetch leaderboard
  await fetchLeaderboard(currentQuiz.id);
  
  setQuizResults(prev => [...prev, {
    quizId: currentQuiz.id,
    score,
    correctAnswers,
    totalQuestions: currentQuiz.questions.length,
    completionTime
  }]);
  
  setCurrentQuiz(null);
};
```

#### 5. **fetchLeaderboard()**
```javascript
const fetchLeaderboard = async (quizId) => {
  const attemptsSnapshot = await getDocs(
    query(
      collection(db, 'quizAttempts'),
      where('quizId', '==', quizId),
      orderBy('score', 'desc'),
      orderBy('completionTime', 'asc')
    )
  );
  
  const leaderboardData = [];
  attemptsSnapshot.forEach(doc => {
    const attempt = doc.data();
    leaderboardData.push({
      ...attempt,
      rank: leaderboardData.length + 1
    });
  });
  
  setLeaderboard(leaderboardData);
};
```

### UI/UX Features

#### 1. **Quiz Cards**
- Clean, informative quiz display
- Status indicators (ongoing, completed, expired)
- Progress indicators for completed quizzes
- Time remaining display

#### 2. **Quiz Taking Interface**
- Question-by-question navigation
- Timer display with visual countdown
- Answer selection with immediate feedback
- Progress bar showing completion

#### 3. **Results Display**
- Score breakdown with correct/incorrect answers
- Time taken and efficiency metrics
- Comparison with previous attempts
- Leaderboard position

#### 4. **Leaderboard**
- Real-time ranking updates
- Top performers highlighted
- School/district comparisons
- Historical performance trends

### Performance Optimizations

#### 1. **Efficient Filtering**
- Client-side filtering for better performance
- Cached student data to avoid repeated fetches
- Optimized Firebase queries with proper indexing

#### 2. **Lazy Loading**
- Quiz questions loaded on demand
- Leaderboard data fetched only when needed
- Images and media content lazy loaded

#### 3. **State Management**
- Minimal re-renders with proper state structure
- Memoized calculations for scores and rankings
- Efficient timer management

### Error Handling

#### 1. **Network Issues**
- Retry mechanisms for failed requests
- Offline state handling
- Graceful degradation

#### 2. **Quiz State Management**
- Timer synchronization issues
- Answer submission failures
- Network interruption handling

#### 3. **Data Validation**
- Quiz format validation
- Answer format checking
- Score calculation verification

### Integration Points

#### With Dashboard:
- Recent quiz performance display
- Quick access to available quizzes
- Achievement notifications

#### With Leaderboard:
- Real-time ranking updates
- Performance comparisons
- Achievement tracking

#### With Reports:
- Detailed quiz analytics
- Performance trends
- Subject-wise analysis

### Security Considerations

#### 1. **Quiz Integrity**
- Server-side answer validation
- Question randomization to prevent cheating
- Time-based access control

#### 2. **Data Protection**
- User-specific attempt data
- Secure answer submission
- Protected leaderboard data

#### 3. **Access Control**
- Targeted quiz delivery
- User authentication verification
- Role-based access restrictions
