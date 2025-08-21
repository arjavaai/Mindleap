import React, { useState } from 'react';
import ScrollAnimation from './ScrollAnimation';

const FeaturedSpeakers = () => {
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
    <section className="py-16 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimation animation="fadeUp">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-blue font-poppins mb-4">
              Meet Our Expert Speakers
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Learn from India's most distinguished professionals across diverse fields
            </p>
          </div>
        </ScrollAnimation>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {speakers.map((speaker, index) => (
            <ScrollAnimation
              key={index}
              animation="fadeUp"
              delay={index * 100}
            >
              <div
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer relative group transform hover:-translate-y-1"
                onMouseEnter={() => setHoveredSpeaker(index)}
                onMouseLeave={() => setHoveredSpeaker(null)}
              >
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gradient-to-r from-vibrant-orange to-yellow-400">
                    <img
                      src={speaker.image}
                      alt={speaker.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="font-semibold text-deep-blue mb-2 text-sm leading-tight">{speaker.name}</h4>
                  <p className="text-vibrant-orange font-medium mb-1 text-xs">{speaker.expertise}</p>
                  <p className="text-gray-500 mb-2 text-xs leading-tight">{speaker.organization}</p>
                  <p className="text-gray-600 text-xs italic">{speaker.topic}</p>
                </div>

                {hoveredSpeaker === index && (
                  <div className="absolute inset-0 bg-gradient-to-r from-vibrant-orange/10 to-yellow-400/10 rounded-xl animate-pulse"></div>
                )}
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedSpeakers;
