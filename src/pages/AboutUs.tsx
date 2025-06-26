import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgressButton from '../components/ScrollProgressButton';
import ScrollAnimation from '../components/ScrollAnimation';
import ContactFormModal from '../components/ContactFormModal';
import { Trophy, Rocket, Calendar, Brain, Target, BookOpen, Users, Award, Star, Quote, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePageAnimations } from '../hooks/usePageAnimations';

const AboutUs = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // Initialize page animations
  const { triggerAnimation } = usePageAnimations({
    enableScrollAnimations: true,
    enablePageLoadAnimations: true,
    reducedMotionRespect: true
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Trigger initial page load animations
    setTimeout(() => {
      triggerAnimation('.animate-on-load', 'animate-fade-in');
    }, 100);
  }, [triggerAnimation]);

  const coreValues = [
    {
      icon: Calendar,
      title: "Consistency Over Intensity",
      description: "Small daily efforts compound into extraordinary results"
    },
    {
      icon: Brain,
      title: "Thinking Before Memorizing",
      description: "We prioritize understanding and reasoning over rote learning"
    },
    {
      icon: Star,
      title: "Growth Through Small Wins",
      description: "Every achievement, no matter how small, builds confidence"
    },
    {
      icon: Target,
      title: "Learning With Purpose",
      description: "Every lesson connects to real-world applications"
    }
  ];

  const founder = {
    name: "DR.K.T.S SRINIVAS",
    title: "Founder & CEO",
    organization: "MindLeap",
    image: "/lovable-uploads/780d9fd9-c18e-4e87-9f4b-8bcab6f78a1c.png",
    testimonial: "Every child has the potential to think critically and solve problems creatively. MindLeap was born from my belief that with the right daily practice and guidance, we can unlock this potential in every young mind. Our mission is simple: transform how children think, learn, and approach challenges."
  };

  return (
    <div className="font-poppins min-h-screen">
      <CustomCursor />
      <ScrollProgressButton />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-light-orange via-white to-blue-50 py-16 px-6 overflow-hidden animate-on-load">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-vibrant-orange rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-deep-blue rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <ScrollAnimation animation="fadeUp">
            <h1 className="text-5xl md:text-7xl font-bold text-deep-blue mb-6 leading-tight">
              Empowering the <span className="text-vibrant-orange">Thinkers</span> of Tomorrow
            </h1>
          </ScrollAnimation>
          
          <ScrollAnimation animation="fadeUp" delay={200}>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
              We're not here to create toppers. We're here to shape <span className="text-deep-blue font-semibold">thinkers</span>.
            </p>
          </ScrollAnimation>
          

        </div>
      </section>

      {/* Origin Story */}
      <section className="py-16 px-6 bg-white animate-on-load">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollAnimation animation="slideLeft">
              <div>
                <h2 className="text-4xl font-bold text-deep-blue mb-8">Where It All Began</h2>
                <div className="space-y-6">
                  <p className="text-lg text-gray-700 leading-relaxed">In today's education system, students excel at memorizing formulas but struggle with real-world problems requiring logical thinking. We noticed a critical gap.</p>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    MindLeap was born from understanding that true success comes from daily thinking habits, logical reasoning, and confidence to tackle any challenge.
                  </p>
                </div>
              </div>
            </ScrollAnimation>
            
            <ScrollAnimation animation="slideRight">
              <Card className="bg-gradient-to-br from-deep-blue to-teal-custom text-white p-8 border-none shadow-2xl">
                <CardContent className="p-0">
                  <div className="text-center mb-6">
                    <Brain className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-xl font-bold">The MindLeap Journey</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Identified the thinking gap in education",
                      "Designed daily thinking challenges",
                      "Built a community of young thinkers"
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <ChevronRight className="w-4 h-4 text-vibrant-orange flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Expert Testimonials */}
      <section className="py-16 px-6 bg-gray-50 animate-on-load">
        <div className="max-w-6xl mx-auto">
          <ScrollAnimation animation="fadeUp">
            <h2 className="text-4xl font-bold text-deep-blue text-center mb-12">What Our Founder Says</h2>
          </ScrollAnimation>
          
          <div className="flex justify-center">
            <div className="max-w-5xl w-full">
              <ScrollAnimation animation="fadeUp">
                <Card className="shadow-xl border-none overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row min-h-[300px]">
                      {/* Founder Info - Left 30% */}
                      <div className="w-full md:w-[30%] bg-gradient-to-br from-deep-blue to-teal-custom p-8 text-white flex flex-col justify-center items-center text-center">
                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 overflow-hidden">
                          <img 
                            src={founder.image} 
                            alt={founder.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="font-bold text-xl mb-2">{founder.name}</h4>
                        <p className="text-base opacity-90 mb-1">{founder.title}</p>
                        <p className="text-sm opacity-75">{founder.organization}</p>
                      </div>
                      
                      {/* Quote - Right 70% */}
                      <div className="w-full md:w-[70%] p-8 bg-white flex items-center relative">
                        <div className="w-full">
                          <Quote className="w-12 h-12 text-vibrant-orange/30 mb-4" />
                          <blockquote className="text-gray-700 leading-relaxed italic text-lg">
                            "{founder.testimonial}"
                          </blockquote>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollAnimation>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-6 bg-gradient-to-br from-deep-blue to-teal-custom text-white animate-on-load">
        <div className="max-w-6xl mx-auto">
          <ScrollAnimation animation="fadeUp">
            <h2 className="text-4xl font-bold text-center mb-12">Our Mission & Vision</h2>
          </ScrollAnimation>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <ScrollAnimation animation="slideLeft">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <Target className="w-10 h-10 text-vibrant-orange mr-4" />
                    <h3 className="text-2xl font-bold">Mission</h3>
                  </div>
                  <p className="text-lg leading-relaxed">To build daily thinking habits in young students that foster confidence and academic independence through structured logical challenges.</p>
                </CardContent>
              </Card>
            </ScrollAnimation>
            
            <ScrollAnimation animation="slideRight">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <Rocket className="w-10 h-10 text-vibrant-orange mr-4" />
                    <h3 className="text-2xl font-bold">Vision</h3>
                  </div>
                  <p className="text-lg leading-relaxed">To empower 1 million students across India with logic-based thinking by 2030, making it a part of everyday learning</p>
                </CardContent>
              </Card>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 px-6 bg-white animate-on-load">
        <div className="max-w-6xl mx-auto">
          <ScrollAnimation animation="fadeUp">
            <h2 className="text-4xl font-bold text-deep-blue text-center mb-12">Our Core Values</h2>
          </ScrollAnimation>
          
          <div className="grid md:grid-cols-2 gap-8">
            {coreValues.map((value, index) => (
              <ScrollAnimation key={index} animation="fadeUp" delay={index * 100}>
                <Card className="group hover:shadow-xl transition-all duration-300 border-orange-100 hover:border-vibrant-orange/30">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-vibrant-orange/10 rounded-xl flex items-center justify-center group-hover:bg-vibrant-orange/20 transition-colors">
                        <value.icon className="w-6 h-6 text-vibrant-orange" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-deep-blue mb-2">{value.title}</h3>
                        <p className="text-gray-700 leading-relaxed">{value.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-deep-blue via-teal-custom to-deep-blue text-white animate-on-load">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollAnimation animation="fadeUp">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Ready to join the MindLeap movement?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              If you believe education should go beyond textbooks, let's shape the thinkers of tomorrow together.
            </p>
          </ScrollAnimation>
          
          <ScrollAnimation animation="scale" delay={200}>
            <Button 
              onClick={() => setIsContactModalOpen(true)}
              className="bg-vibrant-orange hover:bg-vibrant-orange/90 text-white px-8 py-4 rounded-full font-semibold text-lg glow-on-hover transform hover:scale-105 transition-all duration-300"
            >
              Get Started Today
            </Button>
          </ScrollAnimation>
        </div>
      </section>

      <Footer />
      
      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        source="About Us - Get Started Today Button"
      />
    </div>
  );
};

export default AboutUs;
