import React, { useState } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import ScrollAnimation from '../ScrollAnimation';
import ContactFormModal from '../ContactFormModal';

const ProgramsCTA = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return <section className="py-16 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-deep-blue to-vibrant-orange relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 bg-white/10 rounded-full animate-pulse" style={{
        animationDelay: '1s'
      }}></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/5 rounded-full animate-pulse" style={{
        animationDelay: '2s'
      }}></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <ScrollAnimation animation="fadeUp">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6 backdrop-blur-sm">
            <Zap className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white font-poppins mb-6">
            Ready to build a powerful mind in just{' '}
            <span className="text-yellow-300">10 minutes a day?</span>
          </h2>
          
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already transforming their thinking abilities with MindLeap's proven system.
          </p>
        </ScrollAnimation>

        <ScrollAnimation animation="scale" delay={400}>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button 
              onClick={() => setIsContactModalOpen(true)}
              className="bg-white text-deep-blue hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-2 glow-on-hover"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </ScrollAnimation>

        <ScrollAnimation animation="fadeUp" delay={600}>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[{
            icon: '🎯',
            text: 'Daily 10-min challenges'
          }, {
            icon: '��',
            text: 'Gamified learning'
          }, {
            icon: '💰',
            text: 'Real rewards'
          }].map((item, index) => <div key={index} className="flex items-center justify-center space-x-3 text-white/90">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium">{item.text}</span>
              </div>)}
          </div>
        </ScrollAnimation>
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        source="Programs CTA - Start Your Journey Button"
      />
    </section>;
};
export default ProgramsCTA;