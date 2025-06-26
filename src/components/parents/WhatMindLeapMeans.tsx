import React from 'react';
import { Brain, Flame, BarChart3, Target } from 'lucide-react';
import ScrollAnimation from '../ScrollAnimation';
const WhatMindLeapMeans = () => {
  const benefits = [{
    icon: Brain,
    title: "Logic development without textbooks",
    description: "Interactive reasoning challenges that make learning fun, not stressful"
  }, {
    icon: Flame,
    title: "Motivation through streaks, not fear",
    description: "Daily challenges that build confidence and excitement for learning"
  }, {
    icon: BarChart3,
    title: "Progress reports sent to you every month",
    description: "Clear insights into your child's growth and areas of improvement"
  }, {
    icon: Target,
    title: "Confidence, focus, and decision-making — for life",
    description: "Skills that go beyond academics and help in every aspect of life"
  }];
  return <section className="py-20 px-4 md:px-8 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation animation="fadeUp" delay={100}>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-deep-blue font-poppins mb-6">
              A Smarter Way to Support Their{' '}
              <span className="text-vibrant-orange">Future</span>
            </h2>
            <div className="w-24 h-1 bg-vibrant-orange mx-auto mb-6 rounded-full"></div>
          </div>
        </ScrollAnimation>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => <ScrollAnimation key={index} animation="fadeUp" delay={200 + index * 100}>
              <div className="bg-gradient-to-br from-blue-50 to-orange-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center group hover:-translate-y-2">
                <div className="w-16 h-16 bg-vibrant-orange rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-deep-blue font-poppins mb-4">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 font-poppins leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </ScrollAnimation>)}
        </div>

        <ScrollAnimation animation="fadeUp" delay={600}>
          <div className="text-center mt-16">
            <p className="text-lg text-gray-600 font-poppins max-w-3xl mx-auto">
              Join thousands of parents who have already chosen MindLeap to give their children the thinking skills advantage that lasts a lifetime.
            </p>
          </div>
        </ScrollAnimation>
      </div>
    </section>;
};
export default WhatMindLeapMeans;
