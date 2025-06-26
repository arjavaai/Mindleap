import React, { useState } from 'react';
import { Clipboard, Calendar, Trophy, ArrowRight, Play, CheckCircle, ChevronDown } from 'lucide-react';
import ScrollAnimation from './ScrollAnimation';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const steps = [{
    id: 1,
    number: "01",
    icon: <Clipboard className="w-8 h-8" />,
    title: "Sign In",
    description: "Sign in your MindLeap account to access daily challenges, webinars & rewards.",
    details: "Quick registration process with instant access to your personalized dashboard",
    color: "from-blue-500 to-blue-600"
  }, {
    id: 2,
    number: "02",
    icon: <Calendar className="w-8 h-8" />,
    title: "Daily & Monthly Tasks",
    description: "Complete logic challenges, attend webinars, and take monthly quizzes to build skills.",
    details: "Structured learning path with progressive difficulty and real-time feedback",
    color: "from-vibrant-orange to-yellow-500"
  }, {
    id: 3,
    number: "03",
    icon: <Trophy className="w-8 h-8" />,
    title: "Track & Grow",
    description: "Earn badges (Bronze to Platinum), unlock certificates, and get monthly growth reports.",
    details: "Comprehensive analytics and achievement system to track your progress",
    color: "from-purple-500 to-pink-500"
  }];

  const handleCardHover = (stepId: number) => {
    setHoveredCard(stepId);
    setActiveStep(stepId);
  };

  const handleCardLeave = () => {
    setHoveredCard(null);
  };

  const toggleCardExpansion = (stepId: number) => {
    setExpandedCards(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const isCardActive = (stepId: number) => {
    return activeStep === stepId || expandedCards.includes(stepId);
  };

  const isCardHovered = (stepId: number) => {
    return hoveredCard === stepId;
  };

  const getCardStyles = (step: any) => {
    const isActive = isCardActive(step.id);
    const isHovered = isCardHovered(step.id);
    const isHighlighted = isActive || isHovered;

    return {
      card: `group relative cursor-pointer transition-all duration-500 transform ${
        isHighlighted
          ? 'ring-2 ring-vibrant-orange shadow-2xl scale-105' 
          : 'hover:shadow-xl hover:scale-102'
      }`,
      badge: `w-16 h-16 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg transition-all duration-500 ${
        isHighlighted ? 'animate-bounce scale-110' : 'group-hover:animate-bounce'
      }`,
      icon: `bg-white rounded-full p-3 shadow-lg transition-transform duration-300 ${
        isHighlighted ? 'scale-110' : 'group-hover:scale-110'
      }`,
      title: `text-2xl font-bold font-poppins transition-colors duration-300 ${
        isHighlighted ? 'text-vibrant-orange' : 'text-deep-blue group-hover:text-vibrant-orange'
      }`,
      details: `overflow-hidden transition-all duration-500 ${
        isHighlighted ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
      }`,
      checkCircle: `w-6 h-6 transition-all duration-300 ${
        isHighlighted ? 'text-green-500 scale-100' : 'text-gray-300 scale-75'
      }`,
      border: `absolute inset-0 rounded-xl border-2 transition-all duration-500 ${
        isHovered
          ? 'border-blue-500 opacity-50'
          : 'border-transparent opacity-0'
      }`
    };
  };

  return (
    <section className="bg-gradient-to-br from-gray-50 via-orange-50 to-blue-50 py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <ScrollAnimation animation="fadeUp" delay={100}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm mb-4">
              <Play className="w-4 h-4 text-vibrant-orange" />
              <span className="text-sm font-medium text-gray-600">How It Works</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-deep-blue font-poppins mb-6">
              3 Simple Steps to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-vibrant-orange to-yellow-500">
                Success
              </span>
            </h2>
            <p className="text-xl text-gray-600 font-poppins max-w-3xl mx-auto leading-relaxed">
              From registration to rewards - discover how MindLeap transforms learning into an engaging journey
            </p>
          </div>
        </ScrollAnimation>

        {/* Interactive Steps */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => {
            const cardStyles = getCardStyles(step);
            
            return (
              <ScrollAnimation key={step.id} animation="fadeUp" delay={200 + index * 150}>
                <Card 
                  className={cardStyles.card}
                  onMouseEnter={() => handleCardHover(step.id)}
                  onMouseLeave={handleCardLeave}
                  onClick={() => toggleCardExpansion(step.id)}
                >
                  <CardContent className="p-8">
                    {/* Step Number Badge */}
                    <div className="relative mb-6">
                      <div className={cardStyles.badge}>
                        <span className="text-xl font-bold text-white font-poppins">
                          {step.number}
                        </span>
                      </div>
                      
                      {/* Icon with background */}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                        <div className={cardStyles.icon}>
                          <div className="text-vibrant-orange">
                            {step.icon}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content - Stable text that doesn't flicker */}
                    <div className="text-center space-y-4 pt-4">
                      <h3 className={cardStyles.title}>
                        {step.title}
                      </h3>
                      <p className="text-gray-600 font-poppins leading-relaxed">
                        {step.description}
                      </p>
                      
                      {/* Details section - always present in DOM to prevent layout shift */}
                      <div className={cardStyles.details}>
                        <div className="pt-3 border-t border-gray-100 mt-4">
                          <p className="text-sm text-gray-500 italic">
                            {step.details}
                          </p>
                        </div>
                      </div>

                      {/* Progress indicator */}
                      <div className="flex justify-center pt-4">
                        <CheckCircle className={cardStyles.checkCircle} />
                      </div>

                      {/* Indicators - positioned absolutely to prevent layout shifts */}
                      <div className="relative h-6 flex justify-center">
                        {/* Hover indicator - only show during manual hover */}
                        {isCardHovered(step.id) ? (
                          <div className="absolute inset-0 flex justify-center items-center">
                            <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                          </div>
                        ) : (
                          /* Tap me indicator for unhovered cards */
                          <div className="absolute inset-0 flex justify-center items-center">
                            <div className="text-xs text-gray-400 font-medium animate-pulse">
                              👆 Tap me
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>

                  {/* Connecting Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-vibrant-orange to-transparent z-10"></div>
                  )}

                  {/* Enhanced pulsing border for active/auto-animating cards */}
                  <div className={cardStyles.border}></div>
                </Card>
              </ScrollAnimation>
            );
          })}
        </div>

        {/* Progress Bar */}
        <ScrollAnimation animation="fadeUp" delay={600}>
          <div className="flex justify-center mb-12">
            <div className="flex items-center space-x-4 bg-white rounded-full px-6 py-3 shadow-lg">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div 
                    className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                      isCardActive(step.id) || isCardHovered(step.id) 
                        ? 'bg-vibrant-orange scale-125' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`} 
                    onClick={() => {
                      setActiveStep(step.id);
                    }} 
                  />
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 ml-4 transition-all duration-300 ${
                      activeStep > step.id ? 'bg-vibrant-orange' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimation>

        {/* Enhanced CTA Section */}
        <div></div>
      </div>
    </section>
  );
};

export default HowItWorks;
