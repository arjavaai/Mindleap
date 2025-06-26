import React, { useState } from 'react';
import { Brain, Target } from 'lucide-react';
import ScrollAnimation from '../ScrollAnimation';
import ContactFormModal from '../ContactFormModal';

const ParentsHero = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return <section className="bg-gradient-to-br from-orange-50 via-white to-blue-50 py-20 px-4 md:px-8 lg:px-12 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image - Shows first on mobile, second on desktop */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <ScrollAnimation animation="slideRight" delay={400}>
              <div className="relative">
                {/* Animated Rotating Circle Border - Exact Reference Style */}
                <div className="absolute inset-0 -m-6">
                  <div 
                    className="w-[480px] h-[480px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin-smooth"
                    style={{ animationDuration: '15s' }}
                  >
                    <svg 
                      width="480" 
                      height="480" 
                      viewBox="0 0 480 480" 
                      className="w-full h-full"
                    >
                      <defs>
                        <linearGradient id="orangeCircleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FF7A00" />
                          <stop offset="50%" stopColor="#FFB800" />
                          <stop offset="100%" stopColor="#FF7A00" />
                        </linearGradient>
                      </defs>
                      
                      {/* Main rotating circle - partial stroke like reference */}
                      <circle
                        cx="240"
                        cy="240"
                        r="220"
                        fill="none"
                        stroke="url(#orangeCircleGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="550 100"
                        opacity="0.9"
                      />
                    </svg>
                  </div>
                </div>

                {/* Text along the circle path - "VIEW OUR PORTFOLIO" style */}
                <div className="absolute inset-0 -m-6">
                  <div 
                    className="w-[480px] h-[480px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin-smooth"
                    style={{ animationDuration: '15s' }}
                  >
                    <svg 
                      width="480" 
                      height="480" 
                      viewBox="0 0 480 480" 
                      className="w-full h-full"
                    >
                      <defs>
                        <path 
                          id="textCircle" 
                          d="M 240,40 A 200,200 0 1,1 239.9,40"
                        />
                      </defs>
                      <text className="fill-vibrant-orange text-sm font-semibold tracking-wider" style={{ fontSize: '14px' }}>
                        <textPath href="#textCircle" startOffset="0%">
                          MINDLEAP • THINKING SKILLS • MINDLEAP • THINKING SKILLS • 
                        </textPath>
                      </text>
                    </svg>
                  </div>
                </div>

                {/* Main Image Container - Same ratio as reference */}
                <div className="w-80 h-80 md:w-96 md:h-96 bg-gradient-to-br from-orange-100 to-blue-100 rounded-full flex items-center justify-center shadow-2xl overflow-hidden relative z-10">
                  <img 
                    src="/lovable-uploads/742344bd-96e9-488d-9847-b273a2bd85e9.png" 
                    alt="Father and child together - MindLeap family" 
                    className="w-full h-full object-cover rounded-full" 
                  />
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 bg-white p-3 rounded-full shadow-lg animate-bounce z-20">
                  <Brain className="w-6 h-6 text-vibrant-orange" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-full shadow-lg animate-bounce z-20" style={{
                  animationDelay: '0.5s'
                }}>
                  <Target className="w-6 h-6 text-vibrant-orange" />
                </div>

                {/* Small decorative dots */}
                <div className="absolute top-16 -left-8 w-3 h-3 bg-vibrant-orange rounded-full animate-pulse opacity-60"></div>
                <div className="absolute bottom-16 -right-8 w-4 h-4 bg-yellow-400 rounded-full animate-bounce opacity-70" style={{ animationDelay: '1s' }}></div>
              </div>
            </ScrollAnimation>
          </div>

          {/* Text Content - Shows second on mobile, first on desktop */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <ScrollAnimation animation="fadeUp" delay={100}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-deep-blue font-poppins mb-6 leading-tight">
                You Want the Best for{' '}
                <span className="text-vibrant-orange">Your Child.</span>{' '}
                <span className="text-vibrant-orange">So Do We.</span>
              </h1>
            </ScrollAnimation>

            <ScrollAnimation animation="fadeUp" delay={200}>
              <p className="text-lg md:text-xl text-gray-600 font-poppins mb-8 leading-relaxed">
                Here's how MindLeap helps your child think better, learn better, and grow in confidence — all without extra pressure.
              </p>
            </ScrollAnimation>

            <ScrollAnimation animation="fadeUp" delay={300}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  onClick={() => setIsContactModalOpen(true)}
                  className="bg-vibrant-orange text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  See How It Works
                </button>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        source="Parents Hero - See How It Works Button"
      />
    </section>;
};
export default ParentsHero;