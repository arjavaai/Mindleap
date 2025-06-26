
import React, { useState, useEffect } from 'react';
import { Award, Speaker, School, CheckSquare } from 'lucide-react';
import ScrollAnimation from './ScrollAnimation';

const FourPillars = () => {
  const [hoveredPillar, setHoveredPillar] = useState<number | null>(null);
  const [activePillar, setActivePillar] = useState(0);

  const pillars = [
    {
      id: 1,
      title: "PILLAR 1",
      subtitle: "Daily Streak",
      icon: <CheckSquare className="w-16 h-16" />,
      color: "from-purple-500 to-pink-500",
      bgPattern: "🎯",
      points: [
        "Daily challenge to boost thinking",
        "Track & earn badges",
        "Monthly reports",
        "Rewards for top streaks"
      ]
    },
    {
      id: 2,
      title: "PILLAR 2", 
      subtitle: "Quiz Competition",
      icon: <Award className="w-16 h-16" />,
      color: "from-blue-500 to-cyan-500",
      bgPattern: "🏆",
      points: [
        "School → District → State levels",
        "Live finals & prize pool",
        "Pure reasoning challenges",
        "₹1 lakh prize money"
      ]
    },
    {
      id: 3,
      title: "PILLAR 3",
      subtitle: "Webinars",
      icon: <Speaker className="w-16 h-16" />,
      color: "from-green-500 to-emerald-500",
      bgPattern: "🎤",
      points: [
        "1 new topic every month",
        "National speakers",
        "Parent + student sessions",
        "Interactive format"
      ]
    },
    {
      id: 4,
      title: "PILLAR 4",
      subtitle: "Workshop",
      icon: <School className="w-16 h-16" />,
      color: "from-orange-500 to-red-500",
      bgPattern: "🎓",
      points: [
        "1-Day live event",
        "Personality & confidence building",
        "Social skills & speaking",
        "Real-world readiness"
      ]
    }
  ];

  // Auto-animate pillars every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePillar((prevIndex) => (prevIndex + 1) % pillars.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [pillars.length]);

  return (
    <section className="bg-gradient-to-br from-light-orange via-white to-blue-50 py-24 px-6 md:px-20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-vibrant-orange/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-deep-blue/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-teal-custom/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Heading */}
        <ScrollAnimation animation="fadeUp" className="text-center mb-20">
          <div className="inline-block p-2 bg-white/50 backdrop-blur-sm rounded-full mb-6">
            <div className="text-6xl animate-bounce">🚀</div>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-deep-blue font-poppins mb-4">
            The 4 Pillars of the
          </h2>
          <h3 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-vibrant-orange to-deep-blue bg-clip-text text-transparent">
            MindLeap Journey
          </h3>
          <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">
            Four powerful foundations designed to transform how students think, learn, and grow
          </p>
        </ScrollAnimation>

        {/* Interactive Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {pillars.map((pillar, index) => (
            <ScrollAnimation 
              key={pillar.id}
              animation="scale"
              delay={index * 200}
            >
              <div 
                className={`relative group cursor-pointer transition-all duration-500 ${
                  hoveredPillar === pillar.id || activePillar === index ? 'scale-110 z-20' : 'scale-100'
                }`}
                onMouseEnter={() => setHoveredPillar(pillar.id)}
                onMouseLeave={() => setHoveredPillar(null)}
              >
                {/* Card */}
                <div className={`relative bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-white/20 ${
                  hoveredPillar === pillar.id || activePillar === index ? 'ring-4 ring-vibrant-orange/30' : ''
                }`}>
                  
                  {/* Background Pattern */}
                  <div className={`absolute top-4 right-4 text-4xl transition-opacity ${
                    activePillar === index ? 'opacity-20' : 'opacity-10 group-hover:opacity-20'
                  }`}>
                    {pillar.bgPattern}
                  </div>
                  
                  {/* Gradient Background on Hover/Active */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${pillar.color} transition-opacity duration-500 rounded-3xl ${
                    activePillar === index ? 'opacity-10' : 'opacity-0 group-hover:opacity-10'
                  }`}></div>
                  
                  {/* Icon with Animated Border */}
                  <div className="relative mb-6">
                    <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${pillar.color} rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-300 ${
                      activePillar === index ? 'scale-110' : 'group-hover:scale-110'
                    }`}>
                      {pillar.icon}
                    </div>
                    {(hoveredPillar === pillar.id || activePillar === index) && (
                      <div className="absolute -inset-2 bg-gradient-to-br from-vibrant-orange to-deep-blue rounded-3xl opacity-30 animate-pulse"></div>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-sm font-bold text-gray-500 font-poppins mb-2 tracking-wider">
                    {pillar.title}
                  </h3>
                  
                  {/* Subtitle */}
                  <h4 className={`text-2xl font-bold font-poppins mb-6 transition-colors ${
                    activePillar === index ? 'text-vibrant-orange' : 'text-deep-blue group-hover:text-vibrant-orange'
                  }`}>
                    {pillar.subtitle}
                  </h4>
                  
                  {/* Points */}
                  <ul className="space-y-3">
                    {pillar.points.map((point, pointIndex) => (
                      <li key={pointIndex} className={`text-sm font-poppins flex items-start transition-colors ${
                        activePillar === index ? 'text-gray-700' : 'text-gray-600 group-hover:text-gray-700'
                      }`}>
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${pillar.color} mr-3 mt-2 flex-shrink-0 transition-transform ${
                          activePillar === index ? 'scale-125' : 'group-hover:scale-125'
                        }`}></div>
                        <span className={`transition-transform duration-300 ${
                          activePillar === index ? 'translate-x-1' : 'group-hover:translate-x-1'
                        }`}>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollAnimation>
          ))}
        </div>

        {/* Interactive Connection Line */}
        <ScrollAnimation animation="slideRight" delay={800}>
          <div className="flex justify-center items-center mb-16 relative">
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-8 bg-white/60 backdrop-blur-lg p-3 sm:p-4 md:p-6 rounded-full shadow-lg">
              {[1, 2, 3, 4].map((num, index) => (
                <div key={num} className="flex items-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-vibrant-orange to-deep-blue rounded-full flex items-center justify-center text-white font-bold shadow-lg hover:scale-125 transition-all duration-300 cursor-pointer text-xs sm:text-sm md:text-base ${
                    hoveredPillar === num || activePillar === index ? 'scale-125 ring-4 ring-vibrant-orange/30' : ''
                  }`}>
                    {num}
                  </div>
                  {index < 3 && (
                    <div className="w-4 sm:w-8 md:w-16 h-1 bg-gradient-to-r from-vibrant-orange to-deep-blue rounded-full opacity-60"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimation>

        {/* Enhanced CTA */}
        <ScrollAnimation animation="fadeUp" delay={1000}>
          <div className="text-center bg-white/60 backdrop-blur-lg rounded-3xl p-8 shadow-xl">
            <div className="text-4xl mb-4">✨</div>
            <p className="text-xl text-deep-blue font-poppins leading-relaxed max-w-4xl mx-auto font-semibold">
              Every MindLeap journey begins with these 4 powerful pillars — designed to build 
              <span className="text-vibrant-orange"> confident, capable thinkers</span>.
            </p>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};

export default FourPillars;
