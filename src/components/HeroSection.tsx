import React, { useState, useEffect, useRef } from 'react';
import { Play, Star, Users, Trophy, Sparkles, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';
import 'swiper/css/effect-fade';

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const swiperRef = useRef<SwiperType | null>(null);

  const carouselImages = [
    '/corousal/mindleap1.png',
    '/corousal/mindleap2.png', 
    '/corousal/mindleap3.png',
    '/corousal/mindleap4.png',
    '/corousal/mindleap5.png'
  ];

  const floatingElements = [
    {
      icon: Star,
      delay: "0s",
      size: "w-6 h-6 md:w-8 md:h-8",
      color: "text-yellow-400"
    },
    {
      icon: Zap,
      delay: "1s", 
      size: "w-4 h-4 md:w-6 md:h-6",
      color: "text-vibrant-orange"
    },
    {
      icon: Trophy,
      delay: "2s",
      size: "w-5 h-5 md:w-7 md:h-7", 
      color: "text-yellow-500"
    },
    {
      icon: Sparkles,
      delay: "0.5s",
      size: "w-4 h-4 md:w-5 md:h-5",
      color: "text-pink-400"
    }
  ];

  const handleSlideChange = (swiper: SwiperType) => {
    setCurrentSlide(swiper.activeIndex);
  };

  const handleInteraction = () => {
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10 seconds
  };

  const nextSlide = () => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
      handleInteraction();
    }
  };

  const prevSlide = () => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
      handleInteraction();
    }
  };

  const goToSlide = (index: number) => {
    if (swiperRef.current) {
      swiperRef.current.slideTo(index);
      handleInteraction();
    }
  };

  const handleStartJourney = () => {
    const aboutSection = document.getElementById('about-mindleap');
    if (aboutSection) {
      aboutSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <section className="bg-gradient-to-br from-light-orange via-orange-50 to-yellow-50 min-h-screen flex items-center relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map((element, index) => (
          <div 
            key={index} 
            className={`absolute animate-bounce ${element.size} ${element.color} cursor-pointer hidden sm:block`}
            style={{
              top: `${20 + index * 15}%`,
              left: `${10 + index * 20}%`,
              animationDelay: element.delay,
              animationDuration: '3s'
            }}
          >
            <element.icon className="w-full h-full" />
          </div>
        ))}
        
        {/* Geometric Shapes */}
        <div className="absolute top-20 left-2 sm:left-10 w-16 h-16 sm:w-32 sm:h-32 bg-vibrant-orange rounded-full opacity-10 animate-pulse cursor-pointer"></div>
        <div 
          className="absolute bottom-20 right-2 sm:right-10 w-24 h-24 sm:w-48 sm:h-48 bg-deep-blue rounded-full opacity-5 animate-bounce cursor-pointer" 
          style={{ animationDuration: '4s' }}
        ></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 sm:w-24 sm:h-24 bg-gradient-to-r from-vibrant-orange to-yellow-400 rounded-full opacity-20 animate-ping cursor-pointer"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-3 sm:py-6 relative z-10 w-full overflow-hidden">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Swiper Carousel Section - Slides in from right */}
          <div className="relative order-1 lg:order-2 w-full animate-slide-in-right overflow-hidden">
            <div className="relative mx-auto flex justify-center">
              {/* Main Carousel Container */}
              <div className="relative group w-full max-w-sm sm:max-w-md lg:max-w-lg">
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  spaceBetween={0}
                  slidesPerView={1}
                  autoplay={{
                    delay: 4500,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: true,
                  }}
                  speed={700}
                  loop={true}
                  onSwiper={(swiper) => {
                    swiperRef.current = swiper;
                  }}
                  onSlideChange={handleSlideChange}
                  onTouchStart={handleInteraction}
                  className="w-full aspect-square rounded-3xl shadow-2xl bg-white overflow-hidden"
                >
                  {carouselImages.map((image, index) => (
                    <SwiperSlide key={index}>
                      <div className="relative w-full h-full">
                        <img
                          src={image}
                          alt={`MindLeap learning experience ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Gradient Overlay for better contrast */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none"></div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Custom Navigation Arrows */}
                <button
                  onClick={prevSlide}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-deep-blue rounded-full p-2 sm:p-3 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl opacity-0 group-hover:opacity-100 z-10"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                <button
                  onClick={nextSlide}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-deep-blue rounded-full p-2 sm:p-3 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl opacity-0 group-hover:opacity-100 z-10"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Custom Slide Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {carouselImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                        index === currentSlide 
                          ? 'bg-vibrant-orange scale-125 shadow-lg' 
                          : 'bg-white/60 hover:bg-white/80 hover:scale-110'
                      }`}
                    />
                  ))}
                </div>

                {/* Auto-play indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <div className={`w-2 h-2 rounded-full ${isAutoPlaying ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                </div>

                {/* Swipe Hint for Mobile */}
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 sm:hidden">
                  <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    Swipe to navigate
                  </div>
                </div>
              </div>

              {/* Enhanced Floating Elements around carousel */}
              <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-vibrant-orange to-yellow-400 rounded-full opacity-30 animate-bounce group-hover:animate-pulse cursor-pointer hidden sm:block"></div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-deep-blue to-teal-custom rounded-full opacity-30 animate-pulse group-hover:animate-bounce cursor-pointer hidden sm:block"></div>
              <div className="absolute top-1/2 -left-8 w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full opacity-40 animate-ping cursor-pointer hidden sm:block"></div>
              
              {/* Fun Floating Icons */}
              <div 
                className="absolute top-10 right-10 animate-bounce cursor-pointer hidden sm:block" 
                style={{ animationDelay: '1s' }}
              >
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500" />
              </div>
              <div 
                className="absolute bottom-10 right-20 animate-bounce cursor-pointer hidden sm:block" 
                style={{ animationDelay: '2s' }}
              >
                <Star className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Text Content - Slides in from left */}
          <div className="space-y-6 sm:space-y-8 text-center lg:text-left order-2 lg:order-1 w-full animate-slide-in-left overflow-hidden">
            {/* Fun Badge */}
            <div className="inline-flex items-center gap-2 bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg animate-fade-in hover:scale-105 transition-transform duration-300 cursor-pointer">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-vibrant-orange animate-spin" />
              <span className="text-deep-blue font-semibold font-poppins text-sm sm:text-base">Make Learning Fun!</span>
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 animate-pulse" />
            </div>

            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-deep-blue font-poppins leading-tight animate-fade-in hover:scale-105 transition-transform duration-500 cursor-default">
                Boost Your Child's Brain Power — 
                <span className="block text-vibrant-orange animate-pulse cursor-pointer mt-2">In Just 10 Minutes a Day!</span>
              </h1>
              
              <p 
                className="text-sm sm:text-base md:text-lg text-deep-blue opacity-80 font-poppins leading-relaxed max-w-lg mx-auto lg:mx-0 animate-fade-in cursor-default" 
                style={{ animationDelay: '0.3s' }}
              >
                Daily puzzles, monthly webinars, fun quizzes — all at just ₹500/year.
              </p>
            </div>

            {/* Interactive Button */}
            <div 
              className="flex justify-center lg:justify-start animate-fade-in" 
              style={{ animationDelay: '0.6s' }}
            >
              <button 
                onClick={handleStartJourney}
                className="group bg-gradient-to-r from-vibrant-orange to-yellow-400 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-bold font-poppins hover:scale-105 hover:shadow-2xl transition-all duration-300 relative overflow-hidden cursor-pointer"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 group-hover:animate-bounce" />
                  Start Your Journey
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-vibrant-orange opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
