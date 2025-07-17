# MindLeap Component Catalog

## 📚 Overview

This catalog documents all reusable UI components in the MindLeap platform. Components are organized by category and include descriptions, props, and usage examples.

## 🎨 Component Categories

### 1. Base UI Components (`/components/ui/`)

#### **Button**
- **Location**: `components/ui/button.tsx`
- **Description**: Versatile button component with multiple variants
- **Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- **Sizes**: `default`, `sm`, `lg`, `icon`
- **Usage**: CTAs, form submissions, navigation actions

#### **Card**
- **Location**: `components/ui/card.tsx`
- **Description**: Container component for grouped content
- **Sub-components**: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Usage**: Feature showcases, information displays, form containers

#### **Badge**
- **Location**: `components/ui/badge.tsx`
- **Description**: Small label component for status indicators
- **Variants**: `default`, `secondary`, `destructive`, `outline`
- **Usage**: Tags, status indicators, counts

#### **Dialog/Modal**
- **Location**: `components/ui/dialog.tsx`
- **Description**: Accessible modal dialog component
- **Sub-components**: `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`
- **Usage**: Forms, confirmations, detailed views

#### **Input**
- **Location**: `components/ui/input.tsx`
- **Description**: Text input field with consistent styling
- **Types**: text, email, password, number, etc.
- **Usage**: Forms, search fields, data entry

#### **Select**
- **Location**: `components/ui/select.tsx`
- **Description**: Dropdown selection component
- **Sub-components**: `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue`
- **Usage**: Option selection, filters, form fields

#### **Tooltip**
- **Location**: `components/ui/tooltip.tsx`
- **Description**: Contextual information on hover
- **Sub-components**: `TooltipProvider`, `TooltipTrigger`, `TooltipContent`
- **Usage**: Help text, additional information, hover details

#### **ShieldProgressBar**
- **Location**: `components/ui/ShieldProgressBar.tsx`
- **Description**: Custom progress bar showing student shield progression
- **Props**: `totalPoints` (number)
- **Features**: Animated progress, shield icons, milestone indicators
- **Usage**: Student dashboard, profile displays

### 2. Layout Components

#### **StudentHeader**
- **Location**: `components/StudentHeader.tsx`
- **Description**: Unified header for all student-facing pages
- **Props**: 
  - `showBackButton` (boolean)
  - `backTo` (string)
  - `backLabel` (string)
- **Features**: 
  - Logo with navigation
  - Points and streak display
  - Profile tooltip with student details
  - Responsive design
- **Usage**: All student dashboard pages

### 3. Authentication Components (`/components/auth/`)

#### **LoginForm**
- **Location**: `components/auth/LoginForm.tsx`
- **Description**: Student/Admin login form with Firebase auth
- **Features**: Email/password input, role selection, error handling
- **Usage**: Authentication page

#### **SignupForm**
- **Location**: `components/auth/SignupForm.tsx`
- **Description**: New user registration form
- **Features**: Multi-step registration, validation, Firebase integration
- **Usage**: Registration flow

### 4. Admin Components (`/components/admin/`)

#### **SchoolsTab**
- **Location**: `components/admin/SchoolsTab.tsx`
- **Description**: School management interface
- **Features**: CRUD operations, search/filter, bulk actions
- **Usage**: Admin panel school management

#### **UsersTab**
- **Location**: `components/admin/UsersTab.tsx`
- **Description**: Student management interface
- **Features**: 
  - Student list with pagination
  - Add/edit/delete operations
  - Bulk CSV upload
  - Profile enrichment
- **Usage**: Admin panel user management

#### **StateManagementTab**
- **Location**: `components/admin/StateManagementTab.tsx`
- **Description**: Geographic hierarchy management
- **Features**: State and district management, code assignment
- **Usage**: Admin panel location management

#### **QuizManagementTab**
- **Location**: `components/admin/QuizManagementTab.tsx`
- **Description**: Quiz creation and management
- **Features**: Question creation, quiz configuration, targeting options
- **Usage**: Admin panel content management

#### **BulkUploadModal**
- **Location**: `components/admin/BulkUploadModal.tsx`
- **Description**: CSV/Excel file upload for bulk student creation
- **Features**: File validation, preview, error handling
- **Usage**: Mass student registration

### 5. Streak Components (`/components/streak/`)

#### **DailyQuestionModal**
- **Location**: `components/streak/DailyQuestionModal.tsx`
- **Description**: Modal for daily streak questions
- **Features**: 
  - Question display with options
  - Timer functionality
  - Answer feedback
  - Points calculation
- **Usage**: Daily streak challenge

#### **StreakCalendar**
- **Location**: `components/streak/StreakCalendar.tsx`
- **Description**: Visual calendar showing streak history
- **Features**: 
  - Monthly view
  - Color-coded dates (correct/wrong/pending)
  - Streak statistics
  - Interactive navigation
- **Usage**: Daily streak page, student progress tracking

### 6. School Components (`/components/schools/`)

#### **PartnershipSection**
- **Location**: `components/schools/PartnershipSection.tsx`
- **Description**: School partnership information display
- **Features**: Benefits showcase, CTA buttons, animated cards
- **Usage**: Landing page school section

#### **SchoolContactForm**
- **Location**: `components/schools/SchoolContactForm.tsx`
- **Description**: Multi-field contact form for schools
- **Features**: Validation, Firebase submission, success feedback
- **Usage**: School inquiry submissions

### 7. Quiz Components

#### **QuizCard**
- **Description**: Individual quiz display card
- **Features**: 
  - Quiz metadata display
  - Completion status
  - Interactive hover effects
  - Action buttons
- **Usage**: Quiz selection page

#### **QuizQuestion**
- **Description**: Question display during quiz
- **Features**: 
  - Option selection
  - Timer display
  - Progress indicator
  - Answer submission
- **Usage**: Active quiz taking

#### **QuizResults**
- **Description**: Quiz completion results display
- **Features**: 
  - Score visualization
  - Answer review
  - Performance analytics
  - Share options
- **Usage**: Post-quiz feedback

### 8. Dashboard Components

#### **DashboardCard**
- **Description**: Feature card for dashboard sections
- **Features**: 
  - Icon display
  - Title and description
  - Hover animations
  - Click navigation
- **Usage**: Student dashboard grid

#### **StatsCard**
- **Description**: Statistical information display
- **Features**: 
  - Animated numbers
  - Icon integration
  - Gradient backgrounds
- **Usage**: Performance metrics display

### 9. Animation Components

#### **AnimatedBackground**
- **Description**: Particle animation background
- **Features**: 
  - Floating particles
  - Gradient overlays
  - Performance optimized
- **Usage**: Landing page, auth pages

#### **LoadingSpinner**
- **Description**: Loading state indicator
- **Features**: 
  - Animated rotation
  - Size variants
  - Custom colors
- **Usage**: Data fetching states

## 🎯 Design System

### Colors
- **Primary**: Purple/Pink gradients (`from-purple-500 to-pink-500`)
- **Secondary**: Blue/Indigo gradients (`from-blue-500 to-indigo-500`)
- **Success**: Green (`from-green-500 to-emerald-600`)
- **Warning**: Orange (`from-orange-400 to-red-500`)
- **Neutral**: Gray scale (`gray-50` to `gray-900`)

### Typography
- **Font Family**: 'Poppins' (primary), system fonts (fallback)
- **Headings**: Bold weight, responsive sizing
- **Body**: Regular weight, optimized line height

### Spacing
- **Base Unit**: 4px (Tailwind's spacing scale)
- **Common Spacings**: `space-y-4`, `gap-6`, `p-4`, `m-8`

### Shadows
- **Card Shadow**: `shadow-lg hover:shadow-xl`
- **Button Shadow**: `shadow-md hover:shadow-lg`
- **Modal Shadow**: `shadow-2xl`

### Border Radius
- **Small**: `rounded-lg` (8px)
- **Medium**: `rounded-xl` (12px)
- **Large**: `rounded-2xl` (16px)
- **Full**: `rounded-full` (9999px)

## 🔧 Component Best Practices

1. **Accessibility**: All interactive components include proper ARIA labels
2. **Responsiveness**: Mobile-first design with responsive breakpoints
3. **Performance**: Lazy loading for heavy components
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Reusability**: Props-based customization without internal modifications

## 📝 Usage Guidelines

1. **Import from correct paths**: Use absolute imports with `@/components`
2. **Follow naming conventions**: PascalCase for components, camelCase for props
3. **Maintain consistency**: Use existing variants before creating new ones
4. **Document changes**: Update this catalog when adding new components

---

*This catalog is a living document. Please update it when adding or modifying components.*
