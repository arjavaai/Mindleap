# Daily Streak Challenge

## Overview
The Daily Streak Challenge (`/daily-streak`) is a gamified learning system that presents students with one question per day based on a rotating subject schedule. Students earn points for correct answers and maintain streaks for consistent participation.

## Implementation Details

### File Location
- **Main Component**: `src/pages/DailyStreak.tsx`
- **Calendar Component**: `StreakCalendar` (embedded)
- **Modal Component**: `DailyQuestionModal` (embedded)

### Key Features

#### 1. **Subject Scheduling System**
- **Monday**: Mathematics
- **Tuesday**: Science  
- **Wednesday**: English
- **Thursday**: Social Studies
- **Friday**: General Knowledge
- **Weekend**: No questions (rest days)

#### 2. **Question Selection Logic**
- `getScheduledQuestionForToday()`: Ensures all students get the same question for a given day
- `scheduleQuestionForToday()`: Selects a question, avoiding recent repeats
- Questions are stored in `dailyQuestions` collection with date as document ID

#### 3. **Scoring System**
- **Current Day**: 10 points for correct answer
- **Missed Day (Current Week)**: 5 points for correct answer
- **Missed Day (Previous Week)**: 2 points for correct answer
- **Wrong Answer**: 0 points

#### 4. **Streak Tracking**
- **Current Streak**: Consecutive days with correct answers
- **Longest Streak**: Best performance record
- **Total Points**: Cumulative score from all attempts

### Database Connections

#### Firebase Collections Used:

1. **`subjects`** - Subject definitions and scheduling
   ```javascript
   {
     id: "subjectId",
     name: "Mathematics",
     scheduledDay: "Monday",
     questions: [...] // Subcollection
   }
   ```

2. **`dailyQuestions`** - Daily question assignments
   ```javascript
   {
     id: "2024-01-15", // Date as ID
     questionId: "questionId",
     subject: "Mathematics",
     subjectId: "subjectId",
     scheduledDay: "Monday",
     totalAttempts: 0,
     correctAttempts: 0
   }
   ```

3. **`dailyStreaks`** - Student streak records
   ```javascript
   {
     id: "userId",
     currentStreak: 5,
     longestStreak: 12,
     totalPoints: 150,
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

4. **`students`** - Student profile data
   ```javascript
   {
     id: "userId",
     name: "Student Name",
     schoolCode: "SCHOOL001",
     districtCode: "DIST001",
     state: "State Name"
   }
   ```

### Data Flow

#### Question Scheduling Flow:
```
1. Student visits /daily-streak
2. Check if question exists for today in dailyQuestions
3. If not, scheduleQuestionForToday() runs:
   - Fetch subject for today's day
   - Get available questions from subject
   - Avoid questions used in last 7 days
   - Create dailyQuestions document
4. Display question to student
```

#### Answer Submission Flow:
```
1. Student submits answer
2. handleAnswerSubmit() processes:
   - Calculate points based on timing
   - Update dailyStreaks record
   - Update dailyQuestions statistics
   - Update student total points
3. Show result and update UI
```

### Component Architecture

#### Main Components:

1. **DailyStreak Component**
   - Manages overall state and data fetching
   - Handles question scheduling logic
   - Coordinates between sub-components

2. **StreakCalendar Component**
   - Displays monthly calendar view
   - Shows streak status for each day
   - Visual indicators for correct/incorrect answers

3. **DailyQuestionModal Component**
   - Presents the daily question
   - Handles answer submission
   - Shows immediate feedback

#### State Management:
```javascript
const [student, setStudent] = useState(null);
const [dailyStreak, setDailyStreak] = useState(null);
const [todayQuestion, setTodayQuestion] = useState(null);
const [subjects, setSubjects] = useState([]);
const [loading, setLoading] = useState(true);
```

### Key Functions

#### 1. **getScheduledQuestionForToday()**
```javascript
const getScheduledQuestionForToday = async () => {
  const today = new Date().toISOString().split('T')[0];
  const todayDoc = await getDoc(doc(db, 'dailyQuestions', today));
  
  if (todayDoc.exists()) {
    return todayDoc.data();
  } else {
    return await scheduleQuestionForToday();
  }
};
```

#### 2. **scheduleQuestionForToday()**
```javascript
const scheduleQuestionForToday = async () => {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const subject = subjects.find(s => s.scheduledDay === dayName);
  
  // Get recent questions to avoid repeats
  const recentQuestions = await getRecentQuestions(7);
  
  // Select random question not in recent list
  const availableQuestions = subject.questions.filter(
    q => !recentQuestions.includes(q.id)
  );
  
  const selectedQuestion = availableQuestions[
    Math.floor(Math.random() * availableQuestions.length)
  ];
  
  // Save to dailyQuestions collection
  await setDoc(doc(db, 'dailyQuestions', today.toISOString().split('T')[0]), {
    questionId: selectedQuestion.id,
    subject: subject.name,
    subjectId: subject.id,
    scheduledDay: dayName,
    totalAttempts: 0,
    correctAttempts: 0,
    createdAt: new Date()
  });
  
  return { ...selectedQuestion, subject: subject.name };
};
```

#### 3. **handleAnswerSubmit()**
```javascript
const handleAnswerSubmit = async (selectedAnswer) => {
  const isCorrect = selectedAnswer === todayQuestion.correctOption;
  const points = calculatePoints(isCorrect, today);
  
  // Update dailyStreaks
  await updateDoc(doc(db, 'dailyStreaks', user.uid), {
    currentStreak: isCorrect ? dailyStreak.currentStreak + 1 : 0,
    totalPoints: dailyStreak.totalPoints + points,
    records: [...dailyStreak.records, {
      date: new Date().toISOString().split('T')[0],
      questionId: todayQuestion.id,
      isCorrect,
      points,
      subject: todayQuestion.subject
    }]
  });
  
  // Update dailyQuestions statistics
  await updateDoc(doc(db, 'dailyQuestions', new Date().toISOString().split('T')[0]), {
    totalAttempts: increment(1),
    correctAttempts: isCorrect ? increment(1) : increment(0)
  });
};
```

### UI/UX Features

#### 1. **Streak Calendar**
- Monthly view with color-coded days
- Green: Correct answer
- Red: Incorrect answer  
- Gray: No attempt
- Gold: Current day

#### 2. **Question Display**
- Clean, readable question format
- Multiple choice options (A, B, C, D)
- Immediate feedback on answer selection
- Explanation shown after submission

#### 3. **Progress Indicators**
- Current streak counter
- Total points display
- Badge progression visualization
- Weekly/monthly statistics

### Performance Optimizations

#### 1. **Caching Strategy**
- Questions cached for the day
- Subject data cached on component mount
- Streak data cached with real-time updates

#### 2. **Efficient Queries**
- Single document reads for daily questions
- Batch updates for streak records
- Optimized Firebase queries with proper indexing

#### 3. **Lazy Loading**
- Calendar component loads on demand
- Question modal loads only when needed
- Images and heavy content lazy loaded

### Error Handling

#### 1. **Network Issues**
- Retry mechanisms for failed requests
- Offline state handling
- Graceful degradation

#### 2. **Data Validation**
- Question format validation
- Answer format checking
- Streak data integrity

#### 3. **User Feedback**
- Loading states during operations
- Success/error notifications
- Clear error messages

### Integration Points

#### With Dashboard:
- Real-time streak updates
- Badge progression sync
- Quick access from dashboard cards

#### With Leaderboard:
- Points contribute to ranking
- Streak achievements displayed
- Performance comparisons

#### With Reports:
- Detailed streak analytics
- Subject-wise performance
- Historical data for reports

### Security Considerations

#### 1. **Data Validation**
- Server-side answer validation
- Question integrity checks
- Streak manipulation prevention

#### 2. **Access Control**
- User-specific streak data
- Secure question delivery
- Protected answer submission

#### 3. **Rate Limiting**
- One question per day per student
- Answer submission limits
- Abuse prevention mechanisms
