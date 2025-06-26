import React from 'react';
import { Target, Puzzle, TrendingUp, ArrowRight } from 'lucide-react';
import ScrollAnimation from './ScrollAnimation';
import { Button } from './ui/button';
const AboutMindLeap = () => {
  const highlights = [{
    icon: Target,
    title: "Daily Logic Challenges",
    description: "Sharpen the mind with targeted puzzles"
  }, {
    icon: Puzzle,
    title: "Gamified Streaks & Quizzes",
    description: "Build habits through engaging gameplay"
  }, {
    icon: TrendingUp,
    title: "Progress Reports & Rewards",
    description: "Motivate consistency with clear tracking"
  }];
  return <section className="bg-white py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8">
            <ScrollAnimation animation="slideLeft" delay={100}>
              <div className="space-y-6">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-deep-blue font-poppins leading-tight">
                  Shaping Thinkers, 
                  <span className="block text-vibrant-orange">Not Just Toppers</span>
                </h2>
                
                <p className="text-lg sm:text-xl text-gray-600 font-poppins leading-relaxed">
                  MindLeap is a student development movement designed for Classes 8, 9, and 10. 
                  We help young minds grow logical thinking, boost confidence, and build academic 
                  independence — in just 10 minutes a day.
                </p>
              </div>
            </ScrollAnimation>

            {/* Highlight Blocks */}
            <div className="space-y-6">
              {highlights.map((highlight, index) => <ScrollAnimation key={index} animation="slideLeft" delay={200 + index * 100}>
                  <div className="group flex items-start gap-4 p-4 rounded-xl hover:bg-orange-50 transition-all duration-300 hover:scale-105 cursor-pointer">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-vibrant-orange to-yellow-400 rounded-full flex items-center justify-center group-hover:animate-pulse">
                      <highlight.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-deep-blue font-poppins mb-2 group-hover:text-vibrant-orange transition-colors">
                        {highlight.title}
                      </h3>
                      <p className="text-gray-600 font-poppins">
                        {highlight.description}
                      </p>
                    </div>
                  </div>
                </ScrollAnimation>)}
            </div>

            {/* CTA Button */}
            <ScrollAnimation animation="slideLeft" delay={500}>
              <div className="pt-4">
                
              </div>
            </ScrollAnimation>
          </div>

          {/* Right Column - Visual/Animation */}
          <div className="order-first lg:order-last">
            <ScrollAnimation animation="slideRight" delay={300}>
              <div className="relative group cursor-pointer">
                {/* Student with Glowing Brain Image */}
                <img src="/lovable-uploads/5b208d56-33a2-439a-9eb9-8f719a095c64.png" alt="Student with glowing brain - MindLeap learning concept" className="w-full h-96 sm:h-[500px] lg:h-[600px] object-contain group-hover:scale-105 transition-transform duration-500" />
                
                {/* Floating Elements */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-vibrant-orange rounded-full opacity-60 animate-bounce"></div>
                <div className="absolute bottom-8 left-4 w-6 h-6 bg-deep-blue rounded-full opacity-40 animate-pulse"></div>
                <div className="absolute top-1/2 left-8 w-4 h-4 bg-yellow-400 rounded-full opacity-50 animate-ping"></div>
                
                {/* Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-vibrant-orange to-yellow-400 rounded-full opacity-20 animate-bounce group-hover:animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-r from-deep-blue to-teal-custom rounded-full opacity-30 animate-pulse group-hover:animate-bounce"></div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </div>
    </section>;
};
export default AboutMindLeap;