import React, { useState } from 'react';
import { MessageSquare, Target, Users, Trophy, Sparkles, Heart, Zap, Star, ArrowRight } from 'lucide-react';
import ContactFormModal from './ContactFormModal';

const JoinTheMovement = () => {
  const [hoveredCard, setHoveredCard] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return (
    <section className="bg-gradient-to-br from-deep-blue via-blue-900 to-blue-800 py-20 px-4 md:px-8 lg:px-12 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-40 h-40 bg-vibrant-orange rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-32 h-32 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-cyan-400 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-6 border border-white/20">
            <Sparkles className="w-5 h-5 text-vibrant-orange" />
            <span className="text-white font-semibold">Special Offer</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white font-poppins mb-4">
            JOIN THE
            <span className="block text-vibrant-orange">MOVEMENT</span>
          </h2>
          
          <div className="w-24 h-1 bg-gradient-to-r from-vibrant-orange to-yellow-400 mx-auto mb-6 rounded-full"></div>
          
          <p className="text-blue-100 text-lg font-poppins max-w-2xl mx-auto">
            Transform your cognitive abilities for less than the cost of a weekend outing
          </p>
        </div>

        {/* Pricing Card - Cleaner Design */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-vibrant-orange/20 to-transparent rounded-full"></div>
          
          <div className="text-center relative z-10">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-vibrant-orange to-yellow-400 text-white px-8 py-6 rounded-2xl shadow-2xl">
                <div className="text-4xl font-bold font-poppins">₹500</div>
                <div className="text-sm font-medium opacity-90">Per year</div>
              </div>
            </div>
            
            <p className="text-blue-100 text-lg font-poppins mb-8 max-w-2xl mx-auto">
              A strategic investment in your child's cognitive agility and future leadership
            </p>
            
            <button 
              onClick={() => setIsContactModalOpen(true)}
              className="bg-gradient-to-r from-vibrant-orange to-yellow-400 text-white px-8 py-3 rounded-full text-lg font-semibold font-poppins hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto group"
            >
              Enroll Now - Start Your Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Bottom Stats - Minimalist */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[{
            value: "10 Min",
            label: "Daily Time",
            icon: "⏰"
          }, {
            value: "1 Hour",
            label: "Monthly Event",
            icon: "📅"
          }, {
            value: "No Stress",
            label: "Learning Style",
            icon: "😊"
          }, {
            value: "Real Growth",
            label: "Guaranteed",
            icon: "🚀"
          }].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-xl font-bold text-white font-poppins">{stat.value}</div>
              <div className="text-blue-200 text-sm font-poppins">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        source="Join The Movement - Enroll Now Button"
      />
    </section>
  );
};

export default JoinTheMovement;
