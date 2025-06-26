import React from 'react';
import { Calendar, Medal, MessageCircle } from 'lucide-react';
import ScrollAnimation from '../ScrollAnimation';
const HowToSupport = () => {
  const supportSteps = [{
    icon: Calendar,
    title: "Stay informed",
    subtitle: "Read monthly reports shared on WhatsApp or email",
    description: "Get detailed insights into your child's progress, strengths, and areas for improvement.",
    bgColor: "from-blue-100 to-blue-50"
  }, {
    icon: MessageCircle,
    title: "Encourage consistency",
    subtitle: "Motivate them to do their daily challenge",
    description: "A simple daily routine that takes just 10-15 minutes but builds lasting thinking skills.",
    bgColor: "from-green-100 to-green-50"
  }, {
    icon: Medal,
    title: "Celebrate wins",
    subtitle: "Appreciate badge unlocks and quiz results",
    description: "Acknowledge their achievements and watch their confidence soar with every milestone.",
    bgColor: "from-orange-100 to-orange-50"
  }];
  return <section className="py-20 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation animation="fadeUp" delay={100}>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-deep-blue font-poppins mb-6">
              How Can You Help at{' '}
              <span className="text-vibrant-orange">Home?</span>
            </h2>
            <div className="w-24 h-1 bg-vibrant-orange mx-auto mb-6 rounded-full"></div>
            <p className="text-lg text-gray-600 font-poppins max-w-2xl mx-auto">
              Supporting your child's growth is easier than you think. Here are three simple ways to make a big difference.
            </p>
          </div>
        </ScrollAnimation>

        <div className="grid md:grid-cols-3 gap-8">
          {supportSteps.map((step, index) => <ScrollAnimation key={index} animation="fadeUp" delay={200 + index * 150}>
              <div className={`bg-gradient-to-br ${step.bgColor} p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-2`}>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-6 h-6 text-vibrant-orange" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-deep-blue font-poppins">
                      {step.title}
                    </h3>
                  </div>
                </div>
                
                <h4 className="text-lg font-semibold text-deep-blue font-poppins mb-4">
                  {step.subtitle}
                </h4>
                
                <p className="text-gray-600 font-poppins leading-relaxed">
                  {step.description}
                </p>
              </div>
            </ScrollAnimation>)}
        </div>

        <ScrollAnimation animation="fadeUp" delay={650}>
          <div className="mt-16 text-center">
            
          </div>
        </ScrollAnimation>
      </div>
    </section>;
};
export default HowToSupport;