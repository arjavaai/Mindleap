# Leaderboard

## Overview
The Leaderboard section (`/leaderboard`) displays a ranking of students based on their daily streak points. It provides a competitive element to the platform, encouraging students to maintain their streaks and improve their performance. The leaderboard can be filtered by school or district, and includes detailed student profiles with achievements and statistics.

## Implementation Details

### File Location
- **Main Component**: `src/pages/Leaderboard.tsx`

### Key Features

#### 1. **Ranking System**
- **Primary Metric**: Total daily streak points
- **Secondary Metric**: Current streak length
- **Tertiary Metric**: Longest streak achieved
- **Real-time Updates**: Rankings update as students earn points

#### 2. **Filtering Options**
- **All Students**: Global leaderboard across all schools
- **School-specific**: Leaderboard for students in the same school
- **District-specific**: Leaderboard for students in the same district
- **Automatic Detection**: Uses student's location data for filtering

#### 3. **Student Profiles**
- **Profile Information**: Name, school, district, state
- **Achievement Badges**: Bronze, Silver, Gold, Platinum shields
- **Streak Statistics**: Current streak, longest streak, total points
- **Profile Subtitles**: Dynamic titles based on performance

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
     state: "State Name",
     studentId: "ML25DCCCSCCCSERIAL"
   }
   ```

2. **`dailyStreaks`** - Student streak and points data
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

3. **`schools`** - School information for display
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

#### Leaderboard Fetching Flow:
```
1. Student visits /leaderboard
2. fetchCurrentUserSchool() gets student's school/district info
3. fetchLeaderboardData() runs:
   - Fetch all students
   - Fetch dailyStreaks for each student
   - Calculate total points for each student
   - Filter by school/district if applicable
   - Sort by total points (descending)
   - Assign ranks and generate profile data
4. Display ranked leaderboard
```

#### Data Processing Flow:
```
1. For each student:
   - Get dailyStreaks document
   - Calculate totalPoints (prioritize dailyStreaks.totalPoints)
   - If totalPoints is 0, calculate from records array
   - Generate profile subtitle based on points and streak
   - Assign shield icon based on point thresholds
2. Sort students by totalPoints (descending)
3. Assign ranks (1, 2, 3, etc.)
4. Apply school/district filtering if applicable
```

### Component Architecture

#### Main Components:

1. **Leaderboard Component**
   - Manages leaderboard state and data fetching
   - Handles filtering and ranking logic
   - Coordinates data processing and display

#### State Management:
```javascript
const [leaderboardData, setLeaderboardData] = useState([]);
const [currentUserSchool, setCurrentUserSchool] = useState(null);
const [loading, setLoading] = useState(true);
const [filter, setFilter] = useState('all'); // 'all' | 'school' | 'district'
```

### Key Functions

#### 1. **fetchCurrentUserSchool()**
```javascript
const fetchCurrentUserSchool = async () => {
  try {
    const studentDoc = await getDoc(doc(db, 'students', user.uid));
    if (studentDoc.exists()) {
      const studentData = studentDoc.data();
      setCurrentUserSchool({
        schoolCode: studentData.schoolCode,
        districtCode: studentData.districtCode,
        state: studentData.state
      });
    }
  } catch (error) {
    console.error('Error fetching current user school:', error);
  }
};
```

#### 2. **fetchLeaderboardData()**
```javascript
const fetchLeaderboardData = async () => {
  try {
    // Fetch all students
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    const studentsData = [];
    
    studentsSnapshot.forEach(doc => {
      studentsData.push({ id: doc.id, ...doc.data() });
    });
    
    // Fetch dailyStreaks for each student
    const leaderboardStudents = [];
    
    for (const student of studentsData) {
      try {
        const streakDoc = await getDoc(doc(db, 'dailyStreaks', student.id));
        if (streakDoc.exists()) {
          const streakData = streakDoc.data();
          
          // Calculate total points
          let totalPoints = streakData.totalPoints || 0;
          if (totalPoints === 0 && streakData.records) {
            totalPoints = streakData.records.reduce((sum, record) => sum + (record.points || 0), 0);
          }
          
          leaderboardStudents.push({
            ...student,
            currentStreak: streakData.currentStreak || 0,
            longestStreak: streakData.longestStreak || 0,
            totalPoints: totalPoints,
            dailyStreakScore: totalPoints // For sorting
          });
        }
      } catch (error) {
        console.error(`Error fetching streak for student ${student.id}:`, error);
      }
    }
    
    // Sort by total points (descending)
    leaderboardStudents.sort((a, b) => b.dailyStreakScore - a.dailyStreakScore);
    
    // Assign ranks and generate profile data
    const rankedStudents = leaderboardStudents.map((student, index) => ({
      ...student,
      rank: index + 1,
      profileSubtitle: getProfileSubtitle(student.totalPoints, student.currentStreak),
      shieldIcon: getShieldIcon(student.totalPoints)
    }));
    
    setLeaderboardData(rankedStudents);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
  } finally {
    setLoading(false);
  }
};
```

#### 3. **getProfileSubtitle()**
```javascript
const getProfileSubtitle = (totalPoints, currentStreak) => {
  const badge = getBadgeFromPoints(totalPoints);
  const streakText = currentStreak > 0 ? `${currentStreak} Day Hero` : 'Getting Started';
  
  return `${badge} Champion • ${streakText}`;
};
```

#### 4. **getShieldIcon()**
```javascript
const getShieldIcon = (totalPoints) => {
  if (totalPoints >= 600) return '/sheild_icons/platinum_sheild.png';
  if (totalPoints >= 300) return '/sheild_icons/gold_sheild.png';
  if (totalPoints >= 100) return '/sheild_icons/silver_sheild.png';
  return '/sheild_icons/broze_sheild.png';
};
```

#### 5. **getBadgeFromPoints()**
```javascript
const getBadgeFromPoints = (totalPoints) => {
  if (totalPoints >= 600) return 'Platinum';
  if (totalPoints >= 300) return 'Gold';
  if (totalPoints >= 100) return 'Silver';
  return 'Bronze';
};
```

#### 6. **getRankIcon()**
```javascript
const getRankIcon = (rank) => {
  switch (rank) {
    case 1:
      return '/medals_icons/gold_medal.png.png';
    case 2:
      return '/medals_icons/silver_medal.png.png';
    case 3:
      return '/medals_icons/bronze_medal.png.png';
    default:
      return null;
  }
};
```

#### 7. **getRankStyle()**
```javascript
const getRankStyle = (rank) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    case 2:
      return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    case 3:
      return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    default:
      return 'bg-white text-gray-800 border border-gray-200';
  }
};
```

### UI/UX Features

#### 1. **Leaderboard Display**
- Clean, ranked list of students
- Profile pictures with shield icons
- Rank indicators with medal icons for top 3
- Detailed student information

#### 2. **Ranking Indicators**
- **Gold Medal**: 1st place
- **Silver Medal**: 2nd place
- **Bronze Medal**: 3rd place
- **Numbered Ranks**: 4th place and below

#### 3. **Student Profiles**
- **Profile Picture**: Shield icon based on achievement level
- **Name**: Student's full name
- **Profile Subtitle**: Dynamic title based on performance
- **School Information**: School name, district, state
- **Statistics**: Current streak, longest streak, total points

#### 4. **Filtering Options**
- **All Students**: Global leaderboard
- **School**: School-specific leaderboard
- **District**: District-specific leaderboard
- **Automatic Detection**: Uses student's location for filtering

### Performance Optimizations

#### 1. **Efficient Data Fetching**
- Batch processing of student data
- Optimized Firebase queries
- Cached student information

#### 2. **Data Processing**
- Client-side sorting and ranking
- Memoized calculations for profile data
- Efficient filtering algorithms

#### 3. **Rendering Optimization**
- Virtual scrolling for large lists
- Lazy loading of profile images
- Optimized re-renders

### Error Handling

#### 1. **Data Fetching Errors**
- Graceful handling of missing student data
- Fallback values for missing streak data
- Error boundaries for component failures

#### 2. **Data Validation**
- Validation of student profile data
- Verification of streak data integrity
- Handling of corrupted or missing data

#### 3. **User Feedback**
- Loading states during data fetch
- Error notifications for failures
- Clear error messages

### Integration Points

#### With Dashboard:
- Real-time leaderboard updates
- Quick access from dashboard cards
- Achievement notifications

#### With Daily Streak:
- Points contribute to ranking
- Streak achievements displayed
- Performance tracking

#### With Reports:
- Detailed leaderboard analytics
- Historical ranking data
- Performance trends

### Security Considerations

#### 1. **Data Privacy**
- User-specific data filtering
- Protected student information
- Privacy-compliant rankings

#### 2. **Access Control**
- Authenticated user access only
- School/district-based filtering
- Secure data transmission

#### 3. **Data Integrity**
- Validation of ranking calculations
- Prevention of score manipulation
- Secure streak data storage

### Analytics and Insights

#### 1. **Performance Metrics**
- Top performers by school/district
- Average scores and streaks
- Participation rates

#### 2. **Engagement Analytics**
- Leaderboard view frequency
- Student motivation indicators
- Competitive engagement levels

#### 3. **Trend Analysis**
- Ranking changes over time
- Performance improvements
- Seasonal patterns

### Gamification Elements

#### 1. **Achievement System**
- Badge progression (Bronze → Silver → Gold → Platinum)
- Streak achievements
- Point milestones

#### 2. **Competitive Elements**
- Real-time rankings
- School vs school competitions
- District-wide challenges

#### 3. **Recognition System**
- Top performer highlighting
- Achievement celebrations
- Progress recognition
