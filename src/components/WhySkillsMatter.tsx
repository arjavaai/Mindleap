import React, { useEffect, useState } from 'react';
import { Brain, BarChart3, Puzzle, BookOpen, Sparkles, Zap, Target, TrendingUp } from 'lucide-react';
import ScrollAnimation from './ScrollAnimation';
const WhySkillsMatter = () => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const cards = [{
    icon: <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-vibrant-orange" />,
    title: "CRITICAL THINKING",
    description: "Higher education & career demand strong analytical skills",
    bgGradient: "from-orange-400 to-red-500",
    hoverColor: "hover:bg-orange-50",
    activeColor: "bg-orange-50"
  }, {
    icon: <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />,
    title: "PISA SCORE",
    description: "India stood at 73 out of 74 world countries in tests for reasoning & critical analysis",
    bgGradient: "from-purple-400 to-pink-500",
    hoverColor: "hover:bg-purple-50",
    activeColor: "bg-purple-50"
  }, {
    icon: <Puzzle className="w-8 h-8 sm:w-10 sm:h-10 text-teal-custom" />,
    title: "COMPLEX PROBLEMS",
    description: "Academic & real-world challenges require strong reasoning",
    bgGradient: "from-teal-400 to-blue-500",
    hoverColor: "hover:bg-teal-50",
    activeColor: "bg-teal-50"
  }, {
    icon: <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />,
    title: "CURRICULUM GAPS",
    description: "Current school system lacks focus on practical skill building",
    bgGradient: "from-green-400 to-emerald-500",
    hoverColor: "hover:bg-green-50",
    activeColor: "bg-green-50"
  }];
  const floatingIcons = [{
    icon: Sparkles,
    delay: "0s",
    position: "top-6 left-4 sm:left-8"
  }, {
    icon: Zap,
    delay: "1s",
    position: "top-12 right-4 sm:right-12"
  }, {
    icon: Target,
    delay: "2s",
    position: "bottom-12 left-4 sm:left-12"
  }, {
    icon: TrendingUp,
    delay: "3s",
    position: "bottom-6 right-4 sm:right-8"
  }];

  // Auto-animate cards every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCardIndex(prevIndex => (prevIndex + 1) % cards.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [cards.length]);
  return <section className="bg-gradient-to-br from-blue-50 via-white to-orange-50 py-8 sm:py-12 px-4 sm:px-6 md:px-12 relative overflow-hidden">
      {/* Floating Background Icons - Smaller and more subtle */}
      {floatingIcons.map((item, index) => <div key={index} className={`absolute ${item.position} opacity-5 animate-bounce cursor-pointer hidden sm:block`} style={{
      animationDelay: item.delay,
      animationDuration: '4s'
    }}>
          <item.icon className="w-8 h-8 sm:w-12 sm:h-12 text-vibrant-orange" />
        </div>)}

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Compact Heading */}
        <ScrollAnimation animation="fadeUp" className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md mb-3 hover:scale-105 transition-transform duration-300 cursor-pointer">
            <Sparkles className="w-4 h-4 text-vibrant-orange animate-spin" />
            <span className="text-deep-blue font-semibold font-poppins text-sm">Why Skills Matter?</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-deep-blue font-poppins hover:text-vibrant-orange transition-colors duration-500 cursor-default">
            Why Analytical & Logical Skills Matter
          </h2>
          
          {/* Smaller Progress Bar */}
          <div className="w-32 sm:w-48 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 overflow-hidden cursor-pointer">
            <div className="h-full bg-gradient-to-r from-vibrant-orange to-yellow-400 rounded-full animate-slide-in-right"></div>
          </div>
        </ScrollAnimation>

        {/* More Compact Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {cards.map((card, index) => <ScrollAnimation key={card.title} animation="scale" delay={index * 100}>
              <div className={`group p-4 sm:p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border-2 border-transparent cursor-pointer relative overflow-hidden h-full ${
                activeCardIndex === index 
                  ? `scale-105 shadow-lg ${card.activeColor}` 
                  : `bg-white ${card.hoverColor}`
              }`}>
                {/* Hover Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-r ${card.bgGradient} transition-opacity duration-500 rounded-xl ${activeCardIndex === index ? 'opacity-5' : 'opacity-0 group-hover:opacity-5'}`}></div>
                
                <div className="flex flex-col items-center text-center space-y-3 relative z-10 h-full">
                  <div className="relative cursor-pointer">
                    <div className={`transition-all duration-300 ${activeCardIndex === index ? 'animate-bounce' : 'group-hover:animate-bounce'}`}>
                      {card.icon}
                    </div>
                    {/* Sparkle effect on hover/active */}
                    <div className={`absolute -top-1 -right-1 transition-opacity duration-300 ${activeCardIndex === index ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />
                    </div>
                  </div>
                  
                  <h3 className={`text-sm sm:text-base font-bold font-poppins transition-colors duration-300 cursor-pointer ${activeCardIndex === index ? 'text-vibrant-orange' : 'text-deep-blue group-hover:text-vibrant-orange'}`}>
                    {card.title}
                  </h3>
                  
                  <p className={`text-xs sm:text-sm font-poppins leading-relaxed transition-colors duration-300 cursor-default flex-grow ${activeCardIndex === index ? 'text-gray-700' : 'text-gray-600 group-hover:text-gray-700'}`}>
                    {card.description}
                  </p>
                </div>
              </div>
            </ScrollAnimation>)}
        </div>

        {/* Integrated Stats Section - More Compact */}
        <ScrollAnimation animation="fadeUp" delay={200}>
          <div className="bg-gradient-to-r from-deep-blue to-vibrant-orange rounded-2xl p-6 shadow-xl">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="group cursor-pointer">
                <div className="text-2xl sm:text-3xl font-bold text-white font-poppins group-hover:scale-110 transition-transform duration-300">10 Min </div>
                <div className="text-xs sm:text-sm text-white opacity-80 font-poppins group-hover:opacity-100 transition-opacity">Daily Practice</div>
              </div>
              
              <div className="group cursor-pointer border-x border-white border-opacity-20">
                <div className="text-2xl sm:text-3xl font-bold text-white font-poppins group-hover:scale-110 transition-transform duration-300">₹500</div>
                <div className="text-xs sm:text-sm text-white opacity-80 font-poppins group-hover:opacity-100 transition-opacity">Annual Cost</div>
              </div>
              
              <div className="group cursor-pointer">
                <div className="text-2xl sm:text-3xl font-bold text-white font-poppins group-hover:scale-110 transition-transform duration-300">1 Lakh</div>
                <div className="text-xs sm:text-sm text-white opacity-80 font-poppins group-hover:opacity-100 transition-opacity">Quiz Price</div>
              </div>
            </div>
          </div>
        </ScrollAnimation>

        {/* Call-to-Action Text - More Compact */}
        <ScrollAnimation animation="fadeUp" delay={400}>
          <div className="text-center mt-6">
            <p className="text-sm sm:text-base text-deep-blue font-poppins leading-relaxed max-w-2xl mx-auto opacity-80">
              Transform your child's analytical thinking with our proven methodology
            </p>
          </div>
        </ScrollAnimation>
      </div>
    </section>;
};
export default WhySkillsMatter;