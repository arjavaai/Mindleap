
# MindLeap - Educational Platform

## 🎯 Overview

MindLeap is a comprehensive educational platform designed to enhance student learning through interactive quizzes, daily streak challenges, and gamified learning experiences. Built with React, TypeScript, and Firebase, it provides a complete ecosystem for students, administrators, and schools.

## ✨ Features

### 🎓 Student Features
- **Daily Streak Challenge**: Answer one question daily to maintain learning streaks
- **Interactive Quizzes**: Subject-based quizzes with instant feedback
- **Progress Tracking**: Visual calendar showing daily completion status
- **Gamification**: Points system and badges for achievements
- **Personalized Dashboard**: Track progress, streaks, and performance

### 👨‍💼 Admin Features
- **School Management**: Add, edit, and manage schools with status control
- **Student Management**: Individual and bulk student registration
- **District Management**: Organize schools by districts and states
- **Question Management**: Add questions for daily streak challenges
- **User Analytics**: Monitor student engagement and performance
- **Bulk Operations**: CSV/Excel upload for mass student creation

### 🏫 School Portal
- **Partnership Information**: Learn about MindLeap's educational programs
- **Success Metrics**: View impact and effectiveness data
- **Inquiry Forms**: Contact system for school partnerships

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Shadcn/UI** for component library
- **React Router DOM** for navigation
- **React Query** for data fetching

### Backend & Database
- **Firebase Authentication** for user management
- **Firestore Database** for data storage
- **Firebase Security Rules** for data protection

## 🔥 Firebase Integration

### Environment Variables
The following Firebase configuration variables are integrated:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC7a43eeu9vH4fGeQfUuBpphpW7zuE8dBA",
  authDomain: "test-mindleap.firebaseapp.com",
  projectId: "test-mindleap",
  storageBucket: "test-mindleap.firebasestorage.app",
  messagingSenderId: "402749246470",
  appId: "1:402749246470:web:c3411e9ccde8a419fbc787"
};
```

### Firestore Collections Structure

#### 1. `students` Collection
```javascript
{
  uid: string,
  name: string,
  email: string,
  studentId: string, // Format: StateCode25DDSSSNN (e.g., AP25DDSSSNN)
  schoolCode: string,
  districtCode: string,
  password: string,
  role: 'student',
  createdAt: string,
  questionsAnswered: string[] // Array of answered question IDs
}
```

#### 2. `schools` Collection
```javascript
{
  id: string,
  name: string,
  schoolCode: string, // 3-digit code
  districtCode: string, // 2-digit code
  districtName: string,
  state: string,
  status: 'active' | 'inactive',
  createdAt: string
}
```

#### 3. `districts` Collection
```javascript
{
  id: string,
  name: string,
  districtCode: string, // 2-digit code
  state: string,
  createdAt: string
}
```

#### 4. `subjects` Collection
```javascript
{
  id: string,
  name: string,
  scheduledDay: string, // Day of week (Monday, Tuesday, etc.)
  createdAt: string
}
```

#### 5. `subjects/{subjectId}/questions` Subcollection
```javascript
{
  id: string,
  question: string,
  options: {
    a: string,
    b: string,
    c: string,
    d: string
  },
  correctOption: 'a' | 'b' | 'c' | 'd',
  explanation: string,
  subject: string
}
```

#### 6. `students/{studentId}/dailyStreaks` Subcollection
```javascript
{
  questionId: string,
  subject: string,
  selectedOption: string,
  correctOption: string,
  isCorrect: boolean,
  timeTaken: number, // in seconds
  timestamp: Date,
  explanation: string,
  status: 'correct' | 'wrong' | 'skipped' | 'pending',
  points: number
}
```

### Authentication Methods
- **Email/Password Authentication** for students and admins
- **Role-based Access Control** (student/admin)
- **Protected Routes** with authentication guards

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase project setup

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd mindleap
```

2. **Install dependencies**
```bash
npm install
```

3. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication with Email/Password
   - Create Firestore database
   - Update Firebase configuration in `src/lib/firebase.ts`

4. **Start development server**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
```

## 📊 Student ID Generation System

### Format: `StateCode25DDSSSNN`
- **StateCode**: State code (2-3 letters, e.g., AP, TS, UP)
- **25**: Year 2025 (static)
- **DD**: 2-digit District Code (01-99)
- **SSS**: 3-digit School Code (001-999)
- **NNN**: 3-digit Sequential Student Number (001-999)

### Example: `AP2501001001`
- AP25: Andhra Pradesh 2025
- 01: District Code 01
- 001: School Code 001
- 001: First student in the school

## 🔐 Security Features

### Firestore Security Rules
- Role-based data access
- User-specific data isolation
- Admin-only write permissions for sensitive data
- Read restrictions based on authentication status

### Input Validation
- Client-side form validation
- TypeScript type safety
- Sanitized data handling

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile devices
- Touch interfaces

## 🎨 UI/UX Features

### Design System
- Consistent color palette with orange/blue gradients
- Modern typography using Poppins font
- Smooth animations and transitions
- Accessible components with proper ARIA labels

### Interactive Elements
- Custom cursor effects
- Scroll progress indicators
- Loading states and skeleton screens
- Toast notifications for user feedback

## 📈 Performance Optimizations

- **Code Splitting**: Lazy loading of route components
- **Image Optimization**: Responsive images with proper sizing
- **Bundle Optimization**: Tree shaking and dead code elimination
- **Caching**: React Query for efficient data caching

## 🔧 Development Tools

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Development Features
- Hot Module Replacement (HMR)
- TypeScript strict mode
- ESLint configuration
- Prettier code formatting

## 📚 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin panel components
│   ├── auth/           # Authentication components
│   ├── schools/        # School-related components
│   ├── streak/         # Daily streak components
│   └── ui/             # Base UI components (shadcn/ui)
├── pages/              # Route components
├── lib/                # Utility libraries and configuration
├── utils/              # Helper functions
└── hooks/              # Custom React hooks
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support


## 🔄 Version History

### v1.0.0 (Current)
- Initial release with core features
- Student registration and authentication
- Daily streak challenge system
- Admin panel for school and user management
- Responsive design implementation

---

#   M i n d l e a p  
 