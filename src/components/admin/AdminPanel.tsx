import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, School, LogOut, Brain, Calendar, Bug, MessageSquare, Building, MapPin, Target, Video, Play, Menu, X } from 'lucide-react';
import { auth } from '../../lib/firebase';
import SchoolsTab from './SchoolsTab';
import UsersTab from './UsersTab';
import DailyStreakQuestionsTab from './DailyStreakQuestionsTab';
import DebugTab from './DebugTab';
import ContactQueriesTab from './ContactQueriesTab';
import SchoolRequestsTab from './SchoolRequestsTab';
import StateManagementTab from './StateManagementTab';
import QuizManagementTab from './QuizManagementTab';
import WebinarManagementTab from './WebinarManagementTab';
import WorkshopManagementTab from './WorkshopManagementTab';

const AdminPanel = () => {
  // Persist the selected tab across reloads
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminActiveTab') || 'schools';
    }
    return 'schools';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Effect to handle body scroll
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    // Cleanup function
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isSidebarOpen]);
  
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const tabs = [
    { id: 'schools', label: 'Schools', icon: School },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'states', label: 'States & Districts', icon: MapPin },
    { id: 'quizzes', label: 'Quiz Manage', icon: Target },
    { id: 'webinars', label: 'Live Webinars', icon: Video },
    { id: 'workshops', label: 'Workshops', icon: Play },
    { id: 'contact-queries', label: 'Contact Queries', icon: MessageSquare },
    { id: 'school-requests', label: 'School Requests', icon: Building },
    { id: 'questions', label: 'Streak Scheduler', icon: Calendar },
    { id: 'debug', label: 'Debug Tools', icon: Bug },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    localStorage.setItem('adminActiveTab', tabId);
    setIsSidebarOpen(false); // Always close sidebar on tab selection
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <img src="https://www.mindleap.org.in/lovable-uploads/7f6ab2a8-9863-4f75-ae5a-f2b087639caa.png" alt="MindLeap" className="h-10" />
        </div>
        <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1">
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-orange-100 text-orange-600 border border-orange-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
      <div className="flex">
        {/* Sidebar for larger screens */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-64 bg-white shadow-lg fixed h-full z-40 hidden md:block"
            >
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/50 z-30 md:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-64 bg-white shadow-lg fixed h-full z-40 md:hidden"
              >
                <Sidebar />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
          {/* Header for main content */}
          <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-20 shadow-sm p-4 flex items-center">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-200">
              <Menu className="w-6 h-6 text-gray-800" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 ml-4">Admin Dashboard</h1>
          </header>

          <main className="p-6">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg overflow-hidden"
            >
              {activeTab === 'schools' && <SchoolsTab />}
              {activeTab === 'users' && <UsersTab />}
              {activeTab === 'states' && <StateManagementTab />}
              {activeTab === 'quizzes' && <QuizManagementTab />}
              {activeTab === 'webinars' && <WebinarManagementTab />}
              {activeTab === 'workshops' && <WorkshopManagementTab />}
              {activeTab === 'contact-queries' && <ContactQueriesTab />}
              {activeTab === 'school-requests' && <SchoolRequestsTab />}
              {activeTab === 'questions' && <DailyStreakQuestionsTab />}
              {activeTab === 'debug' && <DebugTab />}
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
