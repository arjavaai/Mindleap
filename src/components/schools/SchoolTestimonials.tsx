import React from 'react';
import ScrollAnimation from '../ScrollAnimation';

const SchoolTestimonials = () => {
  const testimonials = [
    {
      name: "Dr. Priya Sharma",
      position: "Principal",
      school: "Sunrise International School",
      quote: "We are eagerly waiting for this program to start! The concept of building logical thinking and cognitive skills through daily challenges sounds exactly what our students need. I'm confident this will be a transformative experience once it launches.",
      avatar: "👩‍🏫"
    }
  ];

  return (
    <section className="py-16 px-4 md:px-8 lg:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <ScrollAnimation animation="fadeUp" delay={100}>
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-deep-blue font-poppins mb-6">
              Educators Are{' '}
              <span className="text-vibrant-orange">Excited</span>
            </h2>
            <p className="text-xl text-gray-600 font-poppins">
              School leaders showing interest in joining MindLeap
            </p>
          </div>
        </ScrollAnimation>

        <div className="flex justify-center">
          {testimonials.map((testimonial, index) => (
            <ScrollAnimation key={index} animation="fadeUp" delay={200}>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100 max-w-2xl">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-2xl mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-deep-blue font-poppins">{testimonial.name}</h4>
                    <p className="text-sm text-blue-600 font-medium">{testimonial.position}</p>
                    <p className="text-sm text-gray-600">{testimonial.school}</p>
                  </div>
                </div>
                <blockquote className="text-gray-700 font-poppins italic leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
              </div>
            </ScrollAnimation>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SchoolTestimonials;
