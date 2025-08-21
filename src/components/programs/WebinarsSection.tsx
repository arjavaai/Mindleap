import React, { useState } from 'react';
import { Calendar, Users, Clock } from 'lucide-react';
import ScrollAnimation from '../ScrollAnimation';

const WebinarsSection = () => {
  const [hoveredSpeaker, setHoveredSpeaker] = useState<number | null>(null);
  
  const speakers = [
    {
      name: "V.V (JD) Lakshmi Narayana [IPS]",
      topic: "Leadership Skills & Youth Empowerment",
      expertise: "CBI Ex-JD / RTD. ADGP",
      organization: "Founder: JD Foundation",
      image: "/Speakers List/1.jpeg"
    },
    {
      name: "Gampa Nageshwer Rao",
      topic: "Child Psychology & Development",
      expertise: "Child Psychologist",
      organization: "Founder: IMPACT Foundation",
      image: "/Speakers List/2.jpeg"
    },
    {
      name: "Dr. Kalyan Chakravarthy [MBBS MD]",
      topic: "Positive Parenting Guidance",
      expertise: "Parenting Counsellor",
      organization: "MBBS · MD · MRCPsych (UK)",
      image: "/Speakers List/3.jpg"
    },
    {
      name: "Yandamoori Veerendranath [CA]",
      topic: "Personality Development",
      expertise: "Novelist & Inspirational Speaker",
      organization: "Founder: SARASWATHI Vidya Peetam",
      image: "/Speakers List/4.jpeg"
    },
    {
      name: "Bala Latha [Dy. Director of Defence]",
      topic: "Civil Services Mentorship",
      expertise: "Educationist & Mentor",
      organization: "Founder: CSB IAS Academy",
      image: "/Speakers List/5.jpg"
    },
    {
      name: "Dr. Jayaprakash Narayana [IAS, MBBS]",
      topic: "Public Leadership",
      expertise: "Educationist & Social Reformer",
      organization: "Founder: Lok Satta Party",
      image: "/Speakers List/6.jpg"
    },
    {
      name: "Pradeep KV [Int'l Soft Skills Trainer]",
      topic: "Soft Skills Training",
      expertise: "Motivational Speaker & Educationist",
      organization: "Founder: Prasaram Learning Initiatives",
      image: "/Speakers List/7.jpeg"
    },
    {
      name: "Ramaa Raavi [Sanskrit Scholar & Writer]",
      topic: "Morality-Based Folktales, Youth Guidance & Parenting",
      expertise: "Cultural Educator & Narrator",
      organization: "Cultural Expert",
      image: "/Speakers List/8.jpg"
    },
    {
      name: "Ram Jaladurgam",
      topic: "Leadership Performance Coach",
      expertise: "Leadership & Visualization Coaching",
      organization: "Founder: Minds & Dots Consulting",
      image: "/Speakers List/9.avif"
    },
    {
      name: "Dr. Tejaswini Manogna [MBBS, MD]",
      topic: "Youth Empowerment & Guidance",
      expertise: "Pediatrician & Motivational Speaker",
      organization: "Miss India & Best NCC Cadet in India",
      image: "/Speakers List/10.jpeg"
    },
    {
      name: "Venu Kalyan",
      topic: "Personality Development & Soft Skills",
      expertise: "Soft Skills Trainer & Life Coach",
      organization: "Founder: Unik Life Skills",
      image: "/Speakers List/11.jpg"
    },
    {
      name: "Sravan Varanasi",
      topic: "Memory Power & Concentration Skills",
      expertise: "Brain Coach & Brain Gym Trainer",
      organization: "Enhancing Student Learning",
      image: "/Speakers List/12.jpeg"
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-6 md:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimation animation="fadeUp">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-blue font-poppins mb-4">
              Power Talks from India's Best Youth Speakers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Monthly webinars covering confidence, communication, creativity, and mindset - available live or on-demand.
            </p>
          </div>
        </ScrollAnimation>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
          {/* Video Player Mockup */}
          <ScrollAnimation animation="slideLeft">
            <div className="bg-black rounded-2xl overflow-hidden shadow-xl">
              <div className="aspect-video bg-gradient-to-br from-deep-blue to-vibrant-orange flex items-center justify-center relative">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto backdrop-blur-sm">
                    <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1"></div>
                  </div>
                  <p className="text-lg font-semibold">First Parent Webinar: Build a Strong Bond</p>
                  <p className="text-sm opacity-90">Going Live on Sep 17 by Dr Kalyan Chakravarthy</p>
                </div>
                
                {/* Live indicator */}
                <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                  UPCOMING
                </div>
              </div>
              
              <div className="p-4 bg-gray-900 text-white">
                <h3 className="font-semibold mb-1">Strengths, Weaknesses, and Habits</h3>
                <p className="text-sm text-gray-300">
                </p>
              </div>
            </div>
          </ScrollAnimation>

          {/* Features */}
          <ScrollAnimation animation="slideRight">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-deep-blue mb-2">Monthly Sessions</h3>
                  <p className="text-gray-600">One power-packed session every month with India's top youth development experts.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-deep-blue mb-2">Student & Parent Editions</h3>
                  <p className="text-gray-600">Separate sessions tailored for students and parents to maximize family growth.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-deep-blue mb-2">Always Available</h3>
                  <p className="text-gray-600">Missed a session? No worries! Watch replays anytime, anywhere on your schedule.</p>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>

        {/* Speaker Showcase */}
        <ScrollAnimation animation="fadeUp" delay={300}>
          <div className="bg-white rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-deep-blue text-center mb-8">Featured Speakers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {speakers.map((speaker, index) => (
                <div
                  key={index}
                  className="text-center p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 cursor-pointer relative"
                  onMouseEnter={() => setHoveredSpeaker(index)}
                  onMouseLeave={() => setHoveredSpeaker(null)}
                >
                  <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden">
                    <img
                      src={speaker.image}
                      alt={speaker.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="font-semibold text-deep-blue mb-1 text-sm">{speaker.name}</h4>
                  <p className="text-vibrant-orange font-medium mb-1 text-xs">{speaker.expertise}</p>
                  <p className="text-gray-500 mb-1 text-xs">{speaker.organization}</p>
                  <p className="text-gray-600 text-xs">{speaker.topic}</p>

                  {hoveredSpeaker === index && (
                    <div className="absolute inset-0 bg-vibrant-orange/10 rounded-xl border-2 border-vibrant-orange/20 animate-pulse"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};

export default WebinarsSection;
