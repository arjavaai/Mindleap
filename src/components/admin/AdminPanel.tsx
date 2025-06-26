import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, School, LogOut, Brain, Calendar, Bug, MessageSquare, Building, MapPin, Target, Video } from 'lucide-react';
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

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('schools');

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
    { id: 'quizzes', label: 'Quiz Management', icon: Target },
    { id: 'webinars', label: 'Live Webinars', icon: Video },
    { id: 'contact-queries', label: 'Contact Queries', icon: MessageSquare },
    { id: 'school-requests', label: 'School Requests', icon: Building },
    { id: 'questions', label: 'Streak Scheduler', icon: Calendar },
    { id: 'debug', label: 'Debug Tools', icon: Bug },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-purple-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 font-poppins">
                  Mind<span className="text-orange-500">Leap</span>
                </h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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
          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg"
          >
            {activeTab === 'schools' && <SchoolsTab />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'states' && <StateManagementTab />}
            {activeTab === 'quizzes' && <QuizManagementTab />}
            {activeTab === 'webinars' && <WebinarManagementTab />}
            {activeTab === 'contact-queries' && <ContactQueriesTab />}
            {activeTab === 'school-requests' && <SchoolRequestsTab />}
            {activeTab === 'questions' && <DailyStreakQuestionsTab />}
            {activeTab === 'debug' && <DebugTab />}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
