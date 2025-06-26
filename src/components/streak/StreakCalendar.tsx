import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { CheckCircle, XCircle, Clock, Star, Flame } from 'lucide-react';

interface DailyStreakRecord {
  questionId: string;
  subject: string;
  status: 'correct' | 'wrong' | 'skipped' | 'pending';
  selectedOption?: string;
  correctOption: string;
  explanation: string;
  timeTaken?: number;
  timestamp: Date;
  points: number;
}

interface StreakCalendarProps {
  records: Record<string, DailyStreakRecord>;
}

const StreakCalendar: React.FC<StreakCalendarProps> = ({ records }) => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayStatus = (day: Date) => {
    const dayString = format(day, 'yyyy-MM-dd');
    const record = records[dayString];
    
    if (isToday(day) && !record) return 'today-pending';
    if (!record) return 'not-answered';
    return record.status;
  };

  const getDayColor = (status: string) => {
    switch (status) {
      case 'correct': return 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg';
      case 'wrong': return 'bg-gradient-to-br from-red-400 to-pink-500 text-white shadow-lg';
      case 'skipped': return 'bg-gradient-to-br from-gray-400 to-gray-500 text-white shadow-lg';
      case 'today-pending': return 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-xl ring-4 ring-blue-200 animate-pulse';
      default: return 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 hover:from-gray-200 hover:to-gray-300';
    }
  };

  const getDayIcon = (status: string) => {
    switch (status) {
      case 'correct': return <CheckCircle className="w-3 h-3" />;
      case 'wrong': return <XCircle className="w-3 h-3" />;
      case 'skipped': return <Clock className="w-3 h-3" />;
      case 'today-pending': return <Star className="w-3 h-3" />;
      default: return null;
    }
  };

  const getTooltipContent = (day: Date, status: string) => {
    const dayString = format(day, 'yyyy-MM-dd');
    const record = records[dayString];
    
    if (isToday(day) && !record) {
      return "Today's challenge is waiting for you! 🚀";
    }
    
    if (!record) {
      return `${format(day, 'MMM d')} - No challenge attempted`;
    }
    
    const statusText = {
      correct: '✅ Correct Answer',
      wrong: '❌ Wrong Answer', 
      skipped: '⏭️ Skipped'
    }[record.status] || 'Unknown';
    
    return `${format(day, 'MMM d')} - ${record.subject}\n${statusText} (+${record.points} points)`;
  };

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02
      }
    }
  };

  const dayVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 20
      }
    }
  };

  return (
    <div className="w-full">
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {format(today, 'MMMM yyyy')}
          </h3>
          <motion.div
            className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-yellow-100 px-3 py-1 rounded-full"
            animate={{
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-semibold text-orange-800">
              {Object.values(records).filter(r => r.status === 'correct').length} correct
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Calendar Grid */}
      <motion.div 
        className="grid grid-cols-7 gap-2"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Weekday Headers */}
        {weekdays.map((day, index) => (
          <motion.div 
            key={day} 
            className="text-center text-sm font-bold text-gray-600 py-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {day}
          </motion.div>
        ))}

        {/* Empty cells for days before month start */}
        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
          <div key={index} className="aspect-square" />
        ))}

        {/* Calendar Days */}
        {days.map((day, index) => {
          const dayString = format(day, 'yyyy-MM-dd');
          const record = records[dayString];
          const status = getDayStatus(day);
          const isCurrentDay = isToday(day);
          
          return (
            <motion.div
              key={dayString}
              variants={dayVariants}
              className="relative group"
            >
              <motion.div
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-bold
                  transition-all duration-300 cursor-pointer relative overflow-hidden
                  ${getDayColor(status)}
                `}
                whileHover={{ 
                  scale: 1.1,
                  rotate: isCurrentDay ? [0, -2, 2, 0] : 0,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                }}
                whileTap={{ scale: 0.95 }}
                title={getTooltipContent(day, status)}
              >
                {/* Animated background for special days */}
                {isCurrentDay && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-20"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                
                {/* Sparkle effect for correct answers */}
                {status === 'correct' && (
                  <motion.div
                    className="absolute top-1 right-1"
                    animate={{
                      scale: [1, 1.3, 1],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Star className="w-2 h-2 text-yellow-300" />
                  </motion.div>
                )}

                <div className="flex flex-col items-center z-10">
                  <motion.span 
                    className="text-lg font-bold"
                    animate={isCurrentDay ? {
                      scale: [1, 1.1, 1]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {format(day, 'd')}
                  </motion.span>
                  
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {getDayIcon(status)}
                  </motion.div>
                </div>

                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-pre-line z-20">
                  {getTooltipContent(day, status)}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Enhanced Legend */}
      <motion.div 
        className="mt-8 grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div 
          className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-green-800">Correct</span>
            <p className="text-xs text-green-600">+200 points</p>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-pink-500 rounded-lg flex items-center justify-center">
            <XCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-red-800">Wrong</span>
            <p className="text-xs text-red-600">0 points</p>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center ring-2 ring-blue-200">
            <Star className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-blue-800">Today</span>
            <p className="text-xs text-blue-600">Pending challenge</p>
          </div>
        </motion.div>

        <motion.div 
          className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-300"></div>
          <div>
            <span className="font-semibold text-gray-700">Not Answered</span>
            <p className="text-xs text-gray-500">No attempt</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        className="mt-6 p-4 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 rounded-2xl border border-purple-200"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <motion.p 
              className="text-2xl font-bold text-green-600"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {Object.values(records).filter(r => r.status === 'correct').length}
            </motion.p>
            <p className="text-sm text-green-700 font-medium">Correct</p>
          </div>
          <div>
            <motion.p 
              className="text-2xl font-bold text-yellow-600"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              {Object.values(records).reduce((total, record) => total + record.points, 0)}
            </motion.p>
            <p className="text-sm text-yellow-700 font-medium">Total Points</p>
          </div>
          <div>
            <motion.p 
              className="text-2xl font-bold text-purple-600"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              {Object.keys(records).length}
            </motion.p>
            <p className="text-sm text-purple-700 font-medium">Days Active</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default StreakCalendar;
