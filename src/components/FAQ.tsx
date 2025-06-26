import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, Sparkles, CheckCircle, ArrowRight, Clock, BookOpen, Target, Monitor, Users, DollarSign, Trophy, BarChart, Lightbulb, GraduationCap } from 'lucide-react';
import ContactFormModal from './ContactFormModal';

const FAQ = () => {
  const [openItem, setOpenItem] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const faqItems = [
    {
      id: "item-1",
      question: "Is my child being overburdened by another program?",
      answer: "MindLeap takes just 10 minutes a day and 1 hour a month. No homework or textbooks — it supports school learning, not adds to stress!",
      icon: Clock
    },
    {
      id: "item-2",
      question: "Will this improve academic performance?",
      answer: "Yes! It enhances logic, observation, attention, and confidence — core skills that improve overall academic outcomes.",
      icon: BookOpen
    },
    {
      id: "item-3",
      question: "What exactly does my child do in this program?",
      answer: "Daily logic challenges, monthly webinars, exciting quizzes, and occasional workshops — all designed for brain skill-building!",
      icon: Target
    },
    {
      id: "item-4",
      question: "Is this online or offline?",
      answer: "It's a hybrid! Daily activities and webinars are online. Workshops and quiz events are offline for real interaction!",
      icon: Monitor
    },
    {
      id: "item-5",
      question: "Do I need to guide my child daily?",
      answer: "Not required! It's self-guided and kid-friendly. Parents can join optional monthly webinars for involvement.",
      icon: Users
    },
    {
      id: "item-6",
      question: "What is the fee and what's included?",
      answer: "Just ₹500/year! Includes daily challenges, monthly webinars, quizzes, workshops, prizes, and certificates. Amazing value!",
      icon: DollarSign
    },
    {
      id: "item-7",
      question: "Is it only for top-performing students?",
      answer: "No! It's for all students — average, struggling, or advanced. The goal is growth in confidence and smart thinking!",
      icon: Trophy
    },
    {
      id: "item-8",
      question: "Can I track my child's progress?",
      answer: "Yes! Parents receive WhatsApp updates with monthly reports, quiz scores, and streak progress. Stay connected!",
      icon: BarChart
    },
    {
      id: "item-9",
      question: "How is this different from tuition or coaching?",
      answer: "It focuses on practical skills: reasoning, communication, decision-making — not textbook repetition. Real-world skills!",
      icon: Lightbulb
    },
    {
      id: "item-10",
      question: "Are schools or teachers involved?",
      answer: "Yes! MindLeap works with schools to encourage participation and support student growth. Team effort!",
      icon: GraduationCap
    }
  ];

  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-6 md:px-24 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-vibrant-orange rounded-full animate-pulse cursor-pointer"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-deep-blue rounded-full animate-pulse cursor-pointer" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-400 rounded-full animate-pulse cursor-pointer" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Enhanced Section Heading */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-lg mb-6 hover:scale-105 transition-transform duration-300 cursor-pointer">
            <HelpCircle className="w-5 h-5 text-vibrant-orange animate-bounce" />
            <span className="text-deep-blue font-semibold font-poppins">Got Questions?</span>
            <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-deep-blue font-poppins mb-4 hover:text-vibrant-orange transition-colors duration-500 cursor-default">
            Frequently Asked Questions
          </h2>
          
          <p className="text-gray-600 font-poppins max-w-2xl mx-auto cursor-default">
            Everything you need to know about MindLeap! Still have questions? We're here to help!
          </p>
        </div>

        {/* Enhanced FAQ Accordion */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map((item, index) => (
              <AccordionItem 
                key={item.id} 
                value={item.id} 
                className="bg-white border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl hover:border-vibrant-orange transition-all duration-300 px-6 py-2 group overflow-hidden relative cursor-pointer"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-50 to-yellow-50 opacity-0 group-hover:opacity-50 transition-opacity duration-300 rounded-xl"></div>
                
                <AccordionTrigger 
                  className="text-left text-base md:text-lg font-semibold text-deep-blue font-poppins hover:no-underline hover:text-vibrant-orange transition-colors duration-300 py-4 relative z-10 group-hover:scale-102 cursor-pointer"
                  onClick={() => setOpenItem(openItem === item.id ? null : item.id)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-6 h-6 text-vibrant-orange group-hover:animate-bounce cursor-pointer" />
                    <span className="flex-1">{item.question}</span>
                    <ArrowRight className={`w-5 h-5 transition-transform duration-300 cursor-pointer ${openItem === item.id ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="text-gray-700 font-poppins text-sm md:text-base leading-relaxed pb-4 relative z-10">
                  <div className="flex items-start gap-3 mt-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5 animate-pulse cursor-pointer" />
                    <span className="cursor-default">{item.answer}</span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '1s' }}>
          <div className="bg-white rounded-2xl p-8 shadow-xl hover:scale-105 transition-transform duration-300 cursor-pointer">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-vibrant-orange to-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white animate-spin" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-deep-blue font-poppins mb-4 cursor-default">
              Ready to Start Your Journey?
            </h3>
            <p className="text-gray-600 font-poppins mb-6 cursor-default">
              Join thousands of students already boosting their brain power!
            </p>
            <button 
              onClick={() => setIsContactModalOpen(true)}
              className="bg-gradient-to-r from-vibrant-orange to-yellow-400 text-white px-8 py-3 rounded-full font-bold font-poppins hover:scale-110 hover:shadow-xl transition-all duration-300 relative overflow-hidden group cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-spin" />
                Get Started Now!
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-vibrant-orange opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Contact Form Modal */}
      <ContactFormModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        source="FAQ - Get Started Now Button"
      />
    </section>
  );
};

export default FAQ;
