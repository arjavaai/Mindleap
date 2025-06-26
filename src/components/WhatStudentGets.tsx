
import React from 'react';
import { BarChart3, Gift, Award, Trophy } from 'lucide-react';
import ScrollAnimation from './ScrollAnimation';

const WhatStudentGets = () => {
  const features = [
    {
      id: 1,
      icon: <BarChart3 className="w-8 h-8 text-white" />,
      title: "Individual Analysis",
      description: "Detailed reports on strengths & weakness every month for growth",
      color: "from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700"
    },
    {
      id: 2,
      icon: <Gift className="w-8 h-8 text-white" />,
      title: "Reward Access",
      description: "Monetary rewards & workshop passes for Platinum badge holders, quiz rewards",
      color: "from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700"
    },
    {
      id: 3,
      icon: <Award className="w-8 h-8 text-white" />,
      title: "Skill Badges",
      description: "Digital recognition for consistency & effort: Bronze, Silver, Gold, Platinum",
      color: "from-orange-500 to-orange-600",
      hoverColor: "hover:from-orange-600 hover:to-orange-700"
    },
    {
      id: 4,
      icon: <Trophy className="w-8 h-8 text-white" />,
      title: "School Championships",
      description: "Chance to represent school tournaments / live events",
      color: "from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700"
    }
  ];

  return (
    <section className="bg-gradient-to-br from-gray-50 via-white to-gray-100 py-20 px-6 md:px-24 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-gradient-to-tr from-blue-200 to-purple-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Heading */}
        <ScrollAnimation animation="fadeUp" className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 font-poppins mb-4">
            What a Student Gets?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-yellow-400 mx-auto rounded-full"></div>
          <p className="text-gray-600 mt-6 text-lg max-w-2xl mx-auto">
            Unlock your potential with our comprehensive reward and recognition system
          </p>
        </ScrollAnimation>

        {/* Desktop Layout - Enhanced Grid */}
        <div className="hidden md:block">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <ScrollAnimation key={feature.id} animation="scale" delay={index * 150}>
                <div className="group relative">
                  {/* Card */}
                  <div className={`
                    relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl 
                    transition-all duration-500 transform hover:-translate-y-2 
                    border border-gray-100 overflow-hidden h-full
                  `}>
                    {/* Background gradient overlay */}
                    <div className={`
                      absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 
                      group-hover:opacity-5 transition-opacity duration-500
                    `}></div>
                    
                    {/* Icon container */}
                    <div className={`
                      w-16 h-16 bg-gradient-to-br ${feature.color} ${feature.hoverColor}
                      rounded-xl flex items-center justify-center mb-6 
                      shadow-lg group-hover:scale-110 transition-transform duration-300
                    `}>
                      {feature.icon}
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-800 font-poppins mb-3 group-hover:text-gray-900 transition-colors">
                      {feature.title}
                    </h3>
                    
                    <p className="text-gray-600 font-poppins leading-relaxed text-sm group-hover:text-gray-700 transition-colors">
                      {feature.description}
                    </p>

                    {/* Hover indicator */}
                    <div className={`
                      absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color} 
                      transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left
                    `}></div>
                  </div>

                  {/* Connection line for desktop */}
                  {index < features.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-orange-300 to-yellow-300 transform -translate-y-1/2 z-0"></div>
                  )}
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>

        {/* Mobile Layout - Enhanced Cards */}
        <div className="md:hidden space-y-6">
          {features.map((feature, index) => (
            <ScrollAnimation key={feature.id} animation="fadeUp" delay={index * 100}>
              <div className="group">
                {/* Card */}
                <div className={`
                  relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl 
                  transition-all duration-300 border border-gray-100 overflow-hidden
                `}>
                  {/* Background gradient overlay */}
                  <div className={`
                    absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 
                    group-hover:opacity-5 transition-opacity duration-300
                  `}></div>
                  
                  <div className="relative flex items-start space-x-4">
                    {/* Icon container */}
                    <div className={`
                      w-14 h-14 bg-gradient-to-br ${feature.color} ${feature.hoverColor}
                      rounded-xl flex items-center justify-center flex-shrink-0
                      shadow-md group-hover:scale-105 transition-transform duration-300
                    `}>
                      {React.cloneElement(feature.icon, {
                        className: "w-7 h-7 text-white"
                      })}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 font-poppins mb-2 group-hover:text-gray-900 transition-colors">
                        {feature.title}
                      </h3>
                      
                      <p className="text-gray-600 font-poppins leading-relaxed text-sm group-hover:text-gray-700 transition-colors">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Hover indicator */}
                  <div className={`
                    absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${feature.color} 
                    transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left
                  `}></div>
                </div>

                {/* Connection line for mobile */}
                {index < features.length - 1 && (
                  <div className="flex justify-center py-3">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-orange-300 to-yellow-300 rounded-full"></div>
                  </div>
                )}
              </div>
            </ScrollAnimation>
          ))}
        </div>

        {/* Bottom CTA section */}
        <ScrollAnimation animation="fadeUp" delay={600} className="text-center mt-16">
          <div></div>
        </ScrollAnimation>
      </div>
    </section>
  );
};

export default WhatStudentGets;
