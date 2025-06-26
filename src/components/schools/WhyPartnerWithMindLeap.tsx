
import React from 'react';
import { Award, Users, BarChart3, Badge } from 'lucide-react';
import ScrollAnimation from '../ScrollAnimation';

const WhyPartnerWithMindLeap = () => {
  const benefits = [
    {
      icon: Award,
      title: "Boost Student Confidence",
      description: "Through daily challenges and quizzes that build self-esteem and academic confidence"
    },
    {
      icon: Users,
      title: "Promote 21st-Century Thinking",
      description: "Aligned with NEP focus on logic & critical reasoning skills for modern education"
    },
    {
      icon: BarChart3,
      title: "Access to Progress Reports",
      description: "Monthly analytics sent to help schools identify student strengths and growth areas"
    },
    {
      icon: Badge,
      title: "Recognized Achievements",
      description: "Your school's students featured in our leaderboard and newsletters for excellence"
    }
  ];

  return (
    <section className="py-16 px-4 md:px-8 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation animation="fadeUp" delay={100}>
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-deep-blue font-poppins mb-6">
              A Win-Win for{' '}
              <span className="text-vibrant-orange">Schools & Students</span>
            </h2>
            <div className="w-24 h-1 bg-vibrant-orange mx-auto rounded-full"></div>
          </div>
        </ScrollAnimation>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <ScrollAnimation key={index} animation="fadeUp" delay={200 + index * 100}>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group hover:-translate-y-2">
                <div className="w-16 h-16 bg-deep-blue rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-deep-blue font-poppins mb-4">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 font-poppins leading-relaxed text-sm">
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

export default WhyPartnerWithMindLeap;
