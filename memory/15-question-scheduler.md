# Question Scheduler

## Overview
The Question Scheduler provides a comprehensive weekly calendar view of daily streak questions. Administrators can see which subject's question is scheduled for each day, along with basic performance metrics including total attempts and correct answers. Clicking on a day allows viewing detailed question information and analytics.

## Implementation Details

### File Location
- **Main Component**: `src/components/admin/QuestionSchedulerTab.tsx`
- **Access**: Available to administrators with 'questions' permission
- **Integration**: Part of the Admin Dashboard

### Key Features

#### 1. **Weekly Calendar View**
- **Calendar Interface**: Visual weekly calendar display
- **Day Information**: Shows scheduled subject for each day
- **Performance Metrics**: Displays basic performance data
- **Navigation**: Browse previous/next weeks

#### 2. **Question Details**
- **Question Information**: Full question content and options
- **Correct Answer**: Shows correct answer and explanation
- **Performance Analytics**: Detailed performance metrics
- **Success Rate**: Calculated success rate for each question

#### 3. **Performance Tracking**
- **Total Attempts**: Number of students who attempted the question
- **Correct Answers**: Number of correct answers
- **Success Rate**: Percentage of correct answers
- **Visual Indicators**: Color-coded performance indicators

#### 4. **Date Navigation**
- **Week Navigation**: Navigate between weeks
- **Current Week**: Highlight current week
- **Date Selection**: Easy date selection and navigation

### Database Connections

#### Firebase Collections Used:

1. **`dailyQuestions`** - Daily question scheduling data
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

2. **`subjects/{subjectId}/questions`** - Question details
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
     createdAt: timestamp
   }
   ```

3. **`subjects`** - Subject information
   ```javascript
   {
     id: "subjectId",
     name: "Mathematics",
     scheduledDay: "Monday",
     isActive: true
   }
   ```

### Component Architecture

#### Main Components:

1. **QuestionSchedulerTab Component**
   - Main container for question scheduling
   - Manages state and data operations
   - Handles calendar navigation

2. **Calendar Components**:
   - `WeeklyCalendar`: Visual calendar display
   - `DayCell`: Individual day display
   - `QuestionDetailModal`: Detailed question view

#### State Management:
```javascript
const [weeklyQuestions, setWeeklyQuestions] = useState([]);
const [selectedQuestion, setSelectedQuestion] = useState(null);
const [questionDetail, setQuestionDetail] = useState(null);
const [currentWeek, setCurrentWeek] = useState(new Date());
const [showDetailModal, setShowDetailModal] = useState(false);
const [loading, setLoading] = useState(false);
```

### Key Functions

#### 1. **fetchWeeklyQuestions()**
```javascript
const fetchWeeklyQuestions = async (weekStart) => {
  setLoading(true);
  try {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    // Get all daily questions for the week
    const dailyQuestionsQuery = query(
      collection(db, 'dailyQuestions'),
      where('createdAt', '>=', weekStart),
      where('createdAt', '<=', weekEnd)
    );
    const dailyQuestionsSnapshot = await getDocs(dailyQuestionsQuery);
    
    const dailyQuestions = dailyQuestionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Create a map for easy lookup
    const questionsMap = new Map();
    dailyQuestions.forEach(question => {
      questionsMap.set(question.id, question);
    });
    
    setWeeklyQuestions(questionsMap);
  } catch (error) {
    console.error('Error fetching weekly questions:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 2. **fetchQuestionDetail()**
```javascript
const fetchQuestionDetail = async (questionId, subjectId) => {
  try {
    // Get question details
    const questionDoc = await getDoc(doc(db, 'subjects', subjectId, 'questions', questionId));
    if (questionDoc.exists()) {
      const questionData = questionDoc.data();
      
      // Get subject details
      const subjectDoc = await getDoc(doc(db, 'subjects', subjectId));
      const subjectData = subjectDoc.exists() ? subjectDoc.data() : {};
      
      const detail = {
        ...questionData,
        subjectName: subjectData.name,
        subjectId: subjectId
      };
      
      setQuestionDetail(detail);
      setShowDetailModal(true);
    }
  } catch (error) {
    console.error('Error fetching question detail:', error);
    toast.error('Error fetching question details');
  }
};
```

#### 3. **handleDayClick()**
```javascript
const handleDayClick = async (date) => {
  const dateString = format(date, 'yyyy-MM-dd');
  const dailyQuestion = weeklyQuestions.get(dateString);
  
  if (dailyQuestion) {
    setSelectedQuestion(dailyQuestion);
    await fetchQuestionDetail(dailyQuestion.questionId, dailyQuestion.subjectId);
  } else {
    toast.info('No question scheduled for this day');
  }
};
```

#### 4. **navigateWeek()**
```javascript
const navigateWeek = (direction) => {
  const newWeek = new Date(currentWeek);
  newWeek.setDate(newWeek.getDate() + (direction * 7));
  setCurrentWeek(newWeek);
  fetchWeeklyQuestions(newWeek);
};
```

#### 5. **getDayInfo()**
```javascript
const getDayInfo = (date) => {
  const dateString = format(date, 'yyyy-MM-dd');
  const dailyQuestion = weeklyQuestions.get(dateString);
  const isToday = isSameDay(date, new Date());
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  
  return {
    dateString,
    dailyQuestion,
    isToday,
    isWeekend
  };
};
```

#### 6. **getSuccessRate()**
```javascript
const getSuccessRate = (totalAttempts, correctAttempts) => {
  if (totalAttempts === 0) return 0;
  return Math.round((correctAttempts / totalAttempts) * 100);
};
```

#### 7. **getSuccessColor()**
```javascript
const getSuccessColor = (successRate) => {
  if (successRate >= 80) return 'text-green-600';
  if (successRate >= 60) return 'text-yellow-600';
  if (successRate >= 40) return 'text-orange-600';
  return 'text-red-600';
};
```

### UI/UX Features

#### 1. **Calendar Display**
- **Weekly View**: Clear weekly calendar layout
- **Day Cells**: Individual day cells with information
- **Today Highlighting**: Current day highlighting
- **Weekend Styling**: Different styling for weekends

#### 2. **Question Information**
- **Subject Display**: Shows scheduled subject for each day
- **Performance Metrics**: Displays attempts and success rate
- **Visual Indicators**: Color-coded performance indicators
- **Click Interaction**: Click to view detailed information

#### 3. **Navigation Controls**
- **Week Navigation**: Previous/next week buttons
- **Current Week**: Easy return to current week
- **Date Display**: Clear week date range display

#### 4. **Question Detail Modal**
- **Full Question**: Complete question content and options
- **Correct Answer**: Highlighted correct answer
- **Explanation**: Detailed explanation
- **Performance Analytics**: Comprehensive performance metrics

### Data Flow

#### Question Scheduler Flow:
```
1. Admin accesses Question Scheduler tab
2. fetchWeeklyQuestions() loads current week data
3. Calendar displays weekly question schedule
4. Admin clicks on a day
5. handleDayClick() processes the click
6. fetchQuestionDetail() loads question details
7. Question detail modal displays information
```

#### Week Navigation Flow:
```
1. Admin clicks previous/next week button
2. navigateWeek() updates current week
3. fetchWeeklyQuestions() loads new week data
4. Calendar updates with new week information
5. UI refreshes with new data
```

### Performance Optimizations

#### 1. **Data Loading**
- **Week-based Loading**: Load only current week data
- **Efficient Queries**: Optimized database queries
- **Caching**: Cached question details

#### 2. **Calendar Rendering**
- **Efficient Rendering**: Optimized calendar rendering
- **Minimal Re-renders**: Efficient state updates
- **Smooth Navigation**: Smooth week navigation

#### 3. **Modal Performance**
- **Lazy Loading**: Load question details on demand
- **Efficient Display**: Optimized modal rendering
- **Quick Navigation**: Fast modal open/close

### Error Handling

#### 1. **Data Errors**
- **Missing Questions**: Handle days without questions
- **Invalid Data**: Handle corrupted question data
- **Network Issues**: Handle connection problems

#### 2. **Navigation Errors**
- **Invalid Dates**: Handle invalid date navigation
- **Week Boundaries**: Handle week boundary issues
- **Date Formatting**: Handle date formatting errors

#### 3. **User Feedback**
- **Loading States**: Visual loading indicators
- **Error Messages**: Clear error notifications
- **Success Feedback**: Confirmation messages

### Security Considerations

#### 1. **Access Control**
- **Permission-based Access**: Only authorized admins can view scheduler
- **Role Validation**: Verify admin roles before access
- **Audit Logging**: Log scheduler access

#### 2. **Data Protection**
- **Question Security**: Protect question content
- **Performance Data**: Secure performance metrics
- **Access Control**: Control data access

#### 3. **Content Security**
- **Question Content**: Secure question display
- **Explanation Content**: Secure explanation display
- **Data Integrity**: Ensure data consistency

### Integration Points

#### With Daily Streak Questions:
- **Question Management**: Access to question details
- **Subject Information**: Subject scheduling data
- **Performance Tracking**: Question performance metrics

#### With Daily Streak Challenge:
- **Question Scheduling**: Automatic question selection
- **Performance Data**: Real-time performance tracking
- **Student Engagement**: Track student participation

#### With Analytics:
- **Performance Metrics**: Question performance analysis
- **Success Rates**: Success rate tracking
- **Trend Analysis**: Performance trend analysis

### Analytics and Insights

#### 1. **Performance Metrics**
- **Success Rates**: Question success rate tracking
- **Attempt Counts**: Student participation tracking
- **Performance Trends**: Performance over time

#### 2. **Question Analysis**
- **Question Effectiveness**: Question performance analysis
- **Subject Performance**: Subject-wise performance
- **Difficulty Assessment**: Question difficulty analysis

#### 3. **Scheduling Insights**
- **Optimal Scheduling**: Best scheduling practices
- **Performance Patterns**: Performance pattern analysis
- **Engagement Tracking**: Student engagement tracking
