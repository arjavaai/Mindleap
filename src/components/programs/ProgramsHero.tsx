
import React from 'react';
import { Brain, Puzzle, Target } from 'lucide-react';
import ScrollAnimation from '../ScrollAnimation';

const ProgramsHero = () => {
  return (
    <section className="relative pt-24 pb-16 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden">
      {/* Floating Icons */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-12 h-12 text-vibrant-orange/20 animate-bounce">
          <Brain className="w-full h-full" />
        </div>
        <div className="absolute top-32 right-16 w-10 h-10 text-deep-blue/20 animate-pulse">
          <Puzzle className="w-full h-full" />
        </div>
        <div className="absolute bottom-20 left-1/4 w-8 h-8 text-teal-custom/20 animate-bounce" style={{animationDelay: '1s'}}>
          <Target className="w-full h-full" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <ScrollAnimation animation="fadeUp">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-vibrant-orange rounded-full mb-6">
            <Brain className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-deep-blue font-poppins mb-6">
            Smart Habits. Logical Thinking.{' '}
            <span className="text-vibrant-orange">Real Growth.</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Explore the tools we use to shape 21st-century learners through daily challenges, 
            interactive webinars, and gamified learning experiences.
          </p>
        </ScrollAnimation>

        {/* Visual Elements */}
        <ScrollAnimation animation="scale" delay={400}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {[
              { icon: '🧩', label: 'Daily Challenges' },
              { icon: '🏆', label: 'Competitions' },
              { icon: '🎤', label: 'Webinars' },
              { icon: '🎖️', label: 'Rewards' }
            ].map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-sm font-medium text-deep-blue">{item.label}</p>
              </div>
            ))}
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};

export default ProgramsHero;
