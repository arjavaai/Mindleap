import React, { useState } from 'react';
import { GraduationCap, Award } from 'lucide-react';
import ScrollAnimation from '../ScrollAnimation';
import ContactFormModal from '../ContactFormModal';

const SchoolsHero = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return <section className="py-16 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-indigo-200/30 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <ScrollAnimation animation="fadeUp" delay={100}>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full mb-6 border border-blue-200">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <span className="text-blue-600 font-semibold">For Educational Institutions</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-deep-blue font-poppins mb-6 leading-tight">
                Empowering Schools to Nurture{' '}
                <span className="text-vibrant-orange">Smarter Students</span>
              </h1>
              
              <p className="text-xl text-gray-600 font-poppins mb-8 leading-relaxed">
                MindLeap helps your students build logical thinking, confidence, and focus — all within a self-driven, 100% online platform that complements your existing curriculum.
              </p>
              
              <button 
                onClick={() => setIsContactModalOpen(true)}
                className="bg-vibrant-orange text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 glow-on-hover"
              >
                Become a Partner School
              </button>
            </div>
          </ScrollAnimation>

          {/* Right Visual */}
          <ScrollAnimation animation="fadeUp" delay={200}>
            <div className="relative">
              <div className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-deep-blue font-poppins mb-2">School</h3>
                  <p className="text-gray-600">
                </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-xl text-center">
                    <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-green-700">Student Achievements</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl text-center">
                    <div className="text-2xl mb-2">📊</div>
                    <p className="text-sm font-semibold text-blue-700">Progress Reports</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl text-center">
                    <div className="text-2xl mb-2">🏆</div>
                    <p className="text-sm font-semibold text-orange-700">Recognition</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl text-center">
                    <div className="text-2xl mb-2">🧠</div>
                    <p className="text-sm font-semibold text-purple-700">Skill Building</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        source="Schools Hero - Become a Partner School Button"
      />
    </section>;
};
export default SchoolsHero;