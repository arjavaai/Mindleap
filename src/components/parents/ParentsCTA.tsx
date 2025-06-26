import React, { useState } from 'react';
import { Trophy, Heart, Shield, Zap } from 'lucide-react';
import ScrollAnimation from '../ScrollAnimation';
import ContactFormModal from '../ContactFormModal';

const ParentsCTA = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSource, setContactSource] = useState('');

  const features = [{
    icon: Trophy,
    text: "Proven Results"
  }, {
    icon: Heart,
    text: "Child-Friendly"
  }, {
    icon: Shield,
    text: "Safe Learning"
  }, {
    icon: Zap,
    text: "Quick Progress"
  }];

  const handleEnrollClick = () => {
    setContactSource('Parents CTA - Enroll Your Child Button');
    setIsContactModalOpen(true);
  };

  const handleCallNowClick = () => {
    setContactSource('Parents CTA - Call Now Button');
    setIsContactModalOpen(true);
  };

  return (
    <section className="py-20 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-10 w-32 h-32 bg-orange-200/30 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-yellow-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-red-200/30 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <ScrollAnimation animation="fadeUp" delay={100}>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-orange-100 px-6 py-3 rounded-full mb-6 border border-orange-200">
              <Trophy className="w-5 h-5 text-orange-600" />
              <span className="text-orange-600 font-semibold">Join the Best</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-deep-blue font-poppins mb-6">
              Join Thousands of Parents Supporting{' '}
              <span className="text-vibrant-orange">Smarter Growth</span>
            </h2>
            
            <p className="text-xl text-gray-600 font-poppins max-w-3xl mx-auto mb-8">
              Give your child the thinking skills advantage that lasts a lifetime. Start their journey to confident problem-solving today.
            </p>

            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-gray-200">
                  <feature.icon className="w-4 h-4 text-vibrant-orange" />
                  <span className="text-deep-blue font-semibold text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimation>

        {/* Main content */}
        <ScrollAnimation animation="fadeUp" delay={200}>
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl border border-gray-100">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left side - Pricing */}
              <div className="text-center md:text-left">
                <div className="mb-6">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-2xl md:text-3xl font-bold text-deep-blue font-poppins mb-4">
                    Complete Thinking Skills Program
                  </h3>
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                    <span className="text-4xl font-bold text-vibrant-orange">₹500</span>
                    <span className="text-xl text-gray-600">/year</span>
                  </div>
                  <p className="text-gray-600 font-poppins">
                    Less than ₹1.50 per day for your child's cognitive development
                  </p>
                </div>

                {/* What's included */}
                <div className="space-y-3 mb-8">
                  {["Daily reasoning challenges", "Monthly progress reports", "Live webinars & workshops", "Badge system & streaks", "Parent support community", "Expert guidance"].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 justify-center md:justify-start">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-700 font-poppins">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right side - CTA */}
              <div className="text-center">
                <div className="bg-gradient-to-br from-vibrant-orange to-red-500 p-8 rounded-2xl text-white">
                  <h4 className="text-2xl font-bold font-poppins mb-4">
                    Ready to Start?
                  </h4>
                  <p className="text-orange-100 mb-6">
                    Join 10,000+ families who chose MindLeap for their children's growth
                  </p>
                  
                  <button 
                    onClick={handleEnrollClick}
                    className="w-full bg-white text-vibrant-orange px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 mb-4"
                  >
                    Enroll Your Child for ₹500/Year
                  </button>
                  
                  <div className="text-sm text-orange-100">
                    <p>Unlock your child's potential.</p>
                    <p>Invest in their future today.</p>
                    <p>Limited spots available!</p>
                  </div>
                </div>

                {/* Secondary actions */}
                <div className="mt-6 space-y-3">
                  <button 
                    onClick={handleCallNowClick}
                    className="w-full border-2 border-deep-blue text-deep-blue px-6 py-3 rounded-xl font-semibold hover:bg-deep-blue hover:text-white transition-all duration-300"
                  >
                    Get Started Today
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimation>
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        source={contactSource}
      />
    </section>
  );
};

export default ParentsCTA;
