import React, { useState } from 'react';
import { Flame, Trophy, Award, Star, Crown, Zap, Target, Gift } from 'lucide-react';
import ScrollAnimation from './ScrollAnimation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './ui/carousel';

// Mock data for leaderboard
const leaderboardData = {
  '8': [{
    name: 'Arjun Patel',
    class: '8-A',
    streak: 22,
    badge: 'Platinum',
    rank: 1
  }, {
    name: 'Priya Sharma',
    class: '8-B',
    streak: 18,
    badge: 'Gold',
    rank: 2
  }, {
    name: 'Karan Singh',
    class: '8-C',
    streak: 16,
    badge: 'Gold',
    rank: 3
  }],
  '9': [{
    name: 'Aarav Kumar',
    class: '9-A',
    streak: 20,
    badge: 'Platinum',
    rank: 1
  }, {
    name: 'Riya Sen',
    class: '9-B',
    streak: 17,
    badge: 'Gold',
    rank: 2
  }, {
    name: 'Sahil Mehta',
    class: '9-C',
    streak: 15,
    badge: 'Silver',
    rank: 3
  }],
  '10': [{
    name: 'Sneha Gupta',
    class: '10-A',
    streak: 25,
    badge: 'Platinum',
    rank: 1
  }, {
    name: 'Rohit Verma',
    class: '10-B',
    streak: 19,
    badge: 'Gold',
    rank: 2
  }, {
    name: 'Ananya Joshi',
    class: '10-C',
    streak: 14,
    badge: 'Silver',
    rank: 3
  }]
};

const getMedalImage = (badge: string) => {
  switch (badge) {
    case 'Platinum':
      return <img src="/medals_icons/platinium_medal.png.png" alt="Platinum Medal" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />;
    case 'Gold':
      return <img src="/medals_icons/gold_medal.png.png" alt="Gold Medal" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />;
    case 'Silver':
      return <img src="/medals_icons/silver_medal.png.png" alt="Silver Medal" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />;
    case 'Bronze':
      return <img src="/medals_icons/bronze_medal.png.png" alt="Bronze Medal" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />;
    default:
      return <Star className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />;
  }
};

const getShieldImage = (badge: string) => {
  switch (badge) {
    case 'Platinum':
      return '/sheild_icons/platinum_sheild.png';
    case 'Gold':
      return '/sheild_icons/gold_sheild.png';
    case 'Silver':
      return '/sheild_icons/silver_sheild.png';
    case 'Bronze':
      return '/sheild_icons/broze_sheild.png';
    default:
      return '/sheild_icons/broze_sheild.png';
  }
};

const badges = [{
  name: 'Bronze',
  days: 5,
  icon: <img src="/medals_icons/bronze_medal.png.png" alt="Bronze Medal" className="w-12 h-12 object-contain" />,
  color: 'bg-amber-600',
  requirement: '5 days'
}, {
  name: 'Silver',
  days: 10,
  icon: <img src="/medals_icons/silver_medal.png.png" alt="Silver Medal" className="w-12 h-12 object-contain" />,
  color: 'bg-gray-400',
  requirement: '10 days'
}, {
  name: 'Gold',
  days: 15,
  icon: <img src="/medals_icons/gold_medal.png.png" alt="Gold Medal" className="w-12 h-12 object-contain" />,
  color: 'bg-yellow-500',
  requirement: '15 days'
}, {
  name: 'Platinum',
  days: 20,
  icon: <img src="/medals_icons/platinium_medal.png.png" alt="Platinum Medal" className="w-12 h-12 object-contain" />,
  color: 'bg-purple-600',
  requirement: '20+ days'
}];

const testimonials = [{
  quote: "I used to hate reasoning, but now I top the leaderboard thanks to MindLeap!",
  name: "Rachit",
  class: "Class 8",
  avatar: <Target className="w-8 h-8 text-blue-600" />
}, {
  quote: "My daughter eagerly waits to keep her streak alive every day!",
  name: "Parent of Class 9 student",
  class: "Parent",
  avatar: <Crown className="w-8 h-8 text-purple-600" />
}, {
  quote: "The badges keep me motivated to solve problems every single day!",
  name: "Kavya",
  class: "Class 10",
  avatar: <Zap className="w-8 h-8 text-orange-600" />
}];

const TopPerformers = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto-rotate testimonials
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-12 sm:py-20 px-4 sm:px-6 md:px-24 overflow-hidden relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-200/30 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-blue-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-indigo-200/30 rounded-full blur-xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Title */}
        <ScrollAnimation animation="fadeUp" delay={100}>
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
              <Trophy className="w-4 h-4" />
              Weekly Champions
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-deep-blue font-poppins mb-4 px-2">
              Top Minds of the Week
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 font-poppins px-2 flex items-center justify-center gap-2">
              See who's ruling the leaderboard in Classes 8, 9 & 10! 
              <Flame className="w-5 h-5 text-orange-500" />
            </p>
          </div>
        </ScrollAnimation>

        {/* Leaderboard Section */}
        <ScrollAnimation animation="fadeUp" delay={200}>
          <div className="mb-12 sm:mb-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-white/50">
              <Tabs defaultValue="8" className="w-full">
                <TabsList className="grid w-full max-w-sm sm:max-w-md mx-auto grid-cols-3 mb-6 sm:mb-8 bg-gradient-to-r from-purple-100 to-blue-100 p-1 rounded-xl">
                  <TabsTrigger value="8" className="text-xs sm:text-sm font-semibold px-2 sm:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg">
                    Class 8
                  </TabsTrigger>
                  <TabsTrigger value="9" className="text-xs sm:text-sm font-semibold px-2 sm:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg">
                    Class 9
                  </TabsTrigger>
                  <TabsTrigger value="10" className="text-xs sm:text-sm font-semibold px-2 sm:px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg">
                    Class 10
                  </TabsTrigger>
                </TabsList>

                {Object.entries(leaderboardData).map(([classNum, students]) => (
                  <TabsContent key={classNum} value={classNum}>
                    <div className="grid gap-3 sm:gap-4 md:gap-6">
                      {students.map((student, index) => (
                        <ScrollAnimation key={student.name} animation="slideLeft" delay={300 + index * 100}>
                          <Card className="bg-gradient-to-r from-white/90 to-white/70 backdrop-blur-sm border-2 border-white/50 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] mx-2 sm:mx-0 hover:border-purple-300/50">
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                  <div className="flex items-center gap-3 flex-shrink-0">
                                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12">
                                      {getMedalImage(student.badge)}
                                    </div>
                                    <span className="text-lg sm:text-2xl font-bold text-deep-blue">
                                      #{student.rank}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="text-lg sm:text-xl font-bold text-deep-blue font-poppins truncate">
                                      {student.name}
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-600 font-poppins">{student.class}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                                  <div className="flex items-center gap-2">
                                    <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 animate-pulse" />
                                    <span className="text-lg sm:text-xl font-bold text-deep-blue whitespace-nowrap">
                                      {student.streak} Days
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14">
                                    <img 
                                      src={getShieldImage(student.badge)} 
                                      alt={`${student.badge} Shield`} 
                                      className="w-12 h-12 sm:w-14 sm:h-14 object-contain" 
                                    />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </ScrollAnimation>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </ScrollAnimation>

        {/* Badge Journey Section */}
        <ScrollAnimation animation="fadeUp" delay={400}>
          <div className="mb-12 sm:mb-16">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 sm:p-8 border border-blue-200/50">
              <div className="text-center mb-8 sm:mb-10 px-2">
                <h3 className="text-2xl sm:text-3xl font-bold text-deep-blue font-poppins mb-4">
                  Unlock Your MindLeap Badge Journey
                </h3>
                <p className="text-base sm:text-lg text-gray-600 font-poppins flex items-center justify-center gap-2">
                  Keep your streak alive and earn amazing badges! 
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </p>
              </div>

              <div className="px-4 sm:px-0">
                <Carousel className="w-full max-w-5xl mx-auto">
                  <CarouselContent className="-ml-2 sm:-ml-4">
                    {badges.map((badge, index) => (
                      <CarouselItem key={badge.name} className="pl-2 sm:pl-4 basis-4/5 sm:basis-1/2 lg:basis-1/4">
                        <ScrollAnimation animation="scale" delay={500 + index * 100}>
                          <Card className="bg-white/90 backdrop-blur-sm border-2 border-white/60 hover:shadow-2xl transition-all duration-300 group hover:scale-105 h-full hover:border-purple-300/50">
                            <CardHeader className="text-center pb-2">
                              <div className="flex justify-center items-center mb-3 w-16 h-16 mx-auto">
                                {badge.icon}
                              </div>
                              <CardTitle className="text-lg sm:text-xl font-bold text-deep-blue font-poppins">
                                {badge.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="text-center">
                              <div className={`inline-block px-3 sm:px-4 py-2 rounded-full text-white font-semibold ${badge.color} mb-2 text-sm sm:text-base shadow-lg`}>
                                {badge.requirement}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 font-poppins">
                                Complete {badge.days} consecutive days to unlock!
                              </p>
                            </CardContent>
                          </Card>
                        </ScrollAnimation>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="hidden sm:flex bg-white/80 hover:bg-white border-purple-200 hover:border-purple-300" />
                  <CarouselNext className="hidden sm:flex bg-white/80 hover:bg-white border-purple-200 hover:border-purple-300" />
                </Carousel>
              </div>
            </div>
          </div>
        </ScrollAnimation>

        {/* Student Testimonial */}
        <ScrollAnimation animation="fadeUp" delay={600}>
          <div></div>
        </ScrollAnimation>
      </div>
    </section>
  );
};

export default TopPerformers;
