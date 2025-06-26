
import React from 'react';
import { Users, Calendar, Target, Gift } from 'lucide-react';
import ScrollAnimation from './ScrollAnimation';

const WhyAreWeUnique = () => {
  const features = [
    {
      id: 1,
      icon: <Users className="w-8 h-8 text-white" />,
      bgColor: "bg-yellow-400",
      title: "Parent Seminars",
      description: "Monthly parent seminars to address real teenage concerns"
    },
    {
      id: 2,
      icon: <Calendar className="w-8 h-8 text-white" />,
      bgColor: "bg-pink-400", 
      title: "7-Day Streak Cycle",
      description: "Features a unique 7-day streak cycle"
    },
    {
      id: 3,
      icon: <Target className="w-8 h-8 text-white" />,
      bgColor: "bg-teal-400",
      title: "Holistic Development", 
      description: "Focused on holistic development going beyond marks"
    },
    {
      id: 4,
      icon: <Gift className="w-8 h-8 text-white" />,
      bgColor: "bg-red-400",
      title: "Monetary Rewards",
      description: "Exciting monetary rewards for their efforts"
    }
  ];

  return (
    <section className="bg-white py-16 px-6 md:px-20">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading with Animated Line */}
        <ScrollAnimation animation="fadeUp" className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-deep-blue font-poppins mb-6">
            Why Are We Unique?
          </h2>
          
          {/* Animated Multi-Colored Line */}
          <div className="relative mx-auto w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="absolute inset-0 animate-slide-in-right bg-gradient-to-r from-yellow-400 via-pink-400 via-teal-400 to-red-400 rounded-full"></div>
          </div>
        </ScrollAnimation>

        {/* 4 Feature Cards */}
        <div className="flex flex-col md:flex-row justify-between gap-10">
          {features.map((feature, index) => (
            <ScrollAnimation 
              key={feature.id}
              animation={index % 2 === 0 ? 'slideLeft' : 'slideRight'}
              delay={index * 200}
            >
              <div className="flex flex-col items-center text-center space-y-4 hover:scale-105 transition-all duration-300">
                {/* Colored Icon Box */}
                <div className={`${feature.bgColor} w-16 h-16 rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse`}>
                  {feature.icon}
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold text-deep-blue font-poppins">
                  {feature.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-600 font-poppins leading-relaxed max-w-48">
                  {feature.description}
                </p>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyAreWeUnique;
