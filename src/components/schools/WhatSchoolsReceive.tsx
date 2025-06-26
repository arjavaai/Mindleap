import React from 'react';
import { FileText, Award, Users, Badge, Lightbulb } from 'lucide-react';
import ScrollAnimation from '../ScrollAnimation';

const WhatSchoolsReceive = () => {
  const benefits = [
    {
      icon: FileText,
      title: "Student Data Access",
      description: "Comprehensive quiz and streak data for all enrolled students"
    },
    {
      icon: FileText,
      title: "Monthly Digital Reports",
      description: "Detailed school performance analytics and insights"
    },
    {
      icon: Users,
      title: "Teacher Speaker Sessions",
      description: "Opportunity to nominate teachers for educational workshops"
    },
    {
      icon: Award,
      title: "Social Media Recognition",
      description: "Featured in MindLeap's social media and leaderboard"
    },
    {
      icon: Lightbulb,
      title: "Priority Access",
      description: "First access to pilot new content modules and features"
    }
  ];

  return (
    <section className="py-16 px-4 md:px-8 lg:px-12 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation animation="fadeUp" delay={100}>
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-deep-blue font-poppins mb-6">
              What Schools{' '}
              <span className="text-vibrant-orange">Receive</span>
            </h2>
            <p className="text-xl text-gray-600 font-poppins max-w-3xl mx-auto">
              Comprehensive support and benefits for partner schools
            </p>
          </div>
        </ScrollAnimation>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <ScrollAnimation key={index} animation="fadeUp" delay={200 + index * 100}>
              <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-1">
                <div className="w-14 h-14 bg-vibrant-orange rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-deep-blue font-poppins mb-4">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 font-poppins leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatSchoolsReceive;
