import React from 'react';
import ScrollAnimation from './ScrollAnimation';

const WhyMindLeapVideo = () => {
  return (
    <section className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-vibrant-orange via-orange-300 to-orange-50"></div>
      
      <div className="relative max-w-6xl mx-auto">
        {/* Section Title */}
        <ScrollAnimation animation="fadeUp" delay={100}>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-deep-blue font-poppins mb-4">
              Why MindLeap?
            </h2>
          </div>
        </ScrollAnimation>

        {/* Video Container */}
        <ScrollAnimation animation="fadeUp" delay={300}>
          <div className="relative max-w-4xl mx-auto">
            {/* Video Wrapper with Shadow and Rounded Corners */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 hover:shadow-3xl transition-all duration-500 group">
              {/* Floating Effect Background */}
              <div className="absolute -inset-2 bg-gradient-to-r from-vibrant-orange to-yellow-400 rounded-3xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-500"></div>
              
              {/* Video Container with 16:9 Aspect Ratio */}
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/6mtxHB5FtAM?rel=0&modestbranding=1&showinfo=0"
                  title="Why MindLeap? - Discover Our Approach"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          </div>
        </ScrollAnimation>

        {/* Optional Text Below Video */}
        <ScrollAnimation animation="fadeUp" delay={500}>
          <div className="text-center mt-8">
            <p className="text-lg sm:text-xl text-gray-600 font-poppins max-w-2xl mx-auto leading-relaxed">
              Discover how MindLeap helps students think better, not just memorize!
            </p>
          </div>
        </ScrollAnimation>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-8 h-8 bg-white/20 rounded-full animate-bounce"></div>
        <div className="absolute bottom-10 right-10 w-6 h-6 bg-white/30 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-20 w-4 h-4 bg-yellow-400/40 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/4 left-20 w-10 h-10 bg-deep-blue/10 rounded-full animate-bounce"></div>
      </div>
    </section>
  );
};

export default WhyMindLeapVideo; 