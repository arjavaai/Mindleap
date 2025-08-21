import React, { useState } from 'react';
import ScrollAnimation from './ScrollAnimation';

const FeaturedSpeakers = () => {
  const [hoveredSpeaker, setHoveredSpeaker] = useState<number | null>(null);

  const speakers = [
    {
      name: "V.V (JD) Lakshmi Narayana",
      topic: "Leadership & Public Service",
      expertise: "IPS Officer",
      organization: "Indian Police Service",
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
      name: "Dr. Kalyan Chakravarthy",
      topic: "Health & Wellness",
      expertise: "MBBS MD",
      organization: "Medical Professional",
      image: "/Speakers List/3.jpg"
    },
    {
      name: "Yandamoori Veerendranath",
      topic: "Financial Literacy & Investment",
      expertise: "CA (Chartered Accountant)",
      organization: "Financial Expert",
      image: "/Speakers List/4.jpeg"
    },
    {
      name: "Bala Latha",
      topic: "Defense & Strategy",
      expertise: "Dy. Director of Defence",
      organization: "Defense Department",
      image: "/Speakers List/5.jpg"
    },
    {
      name: "Dr. Jayaprakash Narayana",
      topic: "Public Administration & Health",
      expertise: "IAS, MBBS",
      organization: "Indian Administrative Service",
      image: "/Speakers List/6.jpg"
    },
    {
      name: "Pradeep KV",
      topic: "Soft Skills & Communication",
      expertise: "Int'l Soft Skills Trainer",
      organization: "Soft Skills Expert",
      image: "/Speakers List/7.jpeg"
    },
    {
      name: "Ramaa Raavi",
      topic: "Sanskrit Literature & Culture",
      expertise: "Sanskrit Scholar & Writer",
      organization: "Cultural Expert",
      image: "/Speakers List/8.jpg"
    },
    {
      name: "Ram Jaladurgam",
      topic: "Technology & Innovation",
      expertise: "Tech Expert",
      organization: "Technology Professional",
      image: "/Speakers List/9.avif"
    },
    {
      name: "Dr. Tejaswini Manogna",
      topic: "Healthcare & Medicine",
      expertise: "MBBS, MD",
      organization: "Medical Professional",
      image: "/Speakers List/10.jpeg"
    },
    {
      name: "Venu Kalyan",
      topic: "Business & Entrepreneurship",
      expertise: "Business Expert",
      organization: "Entrepreneur",
      image: "/Speakers List/11.jpg"
    },
    {
      name: "Sravan Varanasi",
      topic: "Technology & Digital Innovation",
      expertise: "Tech Innovator",
      organization: "Digital Expert",
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
