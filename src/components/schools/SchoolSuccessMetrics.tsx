
import React from 'react';
import ScrollAnimation from '../ScrollAnimation';

const SchoolSuccessMetrics = () => {
  const metrics = [{
    number: "100+",
    label: "Schools Engaged",
    icon: "🏫"
  }, {
    number: "3,000+",
    label: "Students Consistently Active",
    icon: "👨‍🎓"
  }, {
    number: "20%+",
    label: "Average Improvement in Quiz Scores",
    icon: "📈"
  }, {
    number: "95%",
    label: "Parent Satisfaction",
    icon: "😊"
  }];

  return (
    <section className="py-20 px-4 md:px-8 lg:px-12 bg-white">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimation animation="fadeUp" delay={100}>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-deep-blue font-poppins mb-6">
              Proven{' '}
              <span className="text-vibrant-orange">Impact</span>
            </h2>
            <div className="w-24 h-1 bg-vibrant-orange mx-auto mb-6 rounded-full"></div>
            <p className="text-lg text-gray-600 font-poppins max-w-2xl mx-auto">
              Real results from schools that have partnered with MindLeap.
            </p>
          </div>
        </ScrollAnimation>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <ScrollAnimation key={index} animation="fadeUp" delay={200 + index * 100}>
              <div className="text-center bg-gradient-to-br from-blue-50 to-orange-50 p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="text-6xl mb-4">{metric.icon}</div>
                <div className="text-4xl font-bold text-deep-blue font-poppins mb-2">
                  {metric.number}
                </div>
                <p className="text-gray-600 font-poppins font-medium">
                  {metric.label}
                </p>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SchoolSuccessMetrics;
