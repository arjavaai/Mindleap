import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import ScrollAnimation from '../ScrollAnimation';
import { db } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const SchoolInquiryForm = () => {
  const [formData, setFormData] = useState({
    schoolName: '',
    city: '',
    contactPerson: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'schoolRequests'), {
        schoolName: formData.schoolName,
        city: formData.city,
        contactPerson: formData.contactPerson,
        phone: formData.phone,
        email: formData.email,
        message: formData.message,
        timestamp: new Date(),
        status: 'new'
      });

      setIsSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          schoolName: '',
          city: '',
          contactPerson: '',
          phone: '',
          email: '',
          message: ''
        });
        setIsSubmitted(false);
        setIsSubmitting(false);
      }, 3000);

    } catch (error) {
      console.error('Error submitting school inquiry:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-4xl mx-auto">
        <ScrollAnimation animation="fadeUp" delay={100}>
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-deep-blue font-poppins mb-6">
              Want to Bring MindLeap to{' '}
              <span className="text-vibrant-orange">Your School?</span>
            </h2>
            <p className="text-xl text-gray-600 font-poppins">
              Join our partner schools and transform your students' learning experience
            </p>
          </div>
        </ScrollAnimation>

        <ScrollAnimation animation="fadeUp" delay={200}>
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="schoolName" className="block text-sm font-semibold text-deep-blue font-poppins mb-2">
                    School Name *
                  </label>
                  <input
                    type="text"
                    id="schoolName"
                    name="schoolName"
                    value={formData.schoolName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vibrant-orange focus:border-transparent outline-none transition-all duration-300"
                    placeholder="Enter your school name"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-deep-blue font-poppins mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vibrant-orange focus:border-transparent outline-none transition-all duration-300"
                    placeholder="Enter your city"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-semibold text-deep-blue font-poppins mb-2">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vibrant-orange focus:border-transparent outline-none transition-all duration-300"
                    placeholder="Enter contact person name"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-deep-blue font-poppins mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vibrant-orange focus:border-transparent outline-none transition-all duration-300"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-deep-blue font-poppins mb-2">
                  Email ID *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vibrant-orange focus:border-transparent outline-none transition-all duration-300"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-deep-blue font-poppins mb-2">
                  Message/Comments
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-vibrant-orange focus:border-transparent outline-none transition-all duration-300 resize-none"
                  placeholder="Tell us more about your requirements or any questions..."
                ></textarea>
              </div>

              <div className="text-center">
                {isSubmitted ? (
                  <div className="inline-flex items-center gap-2 text-green-600 font-bold text-lg">
                    <CheckCircle className="w-6 h-6" />
                    Request Submitted Successfully!
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-vibrant-orange text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 inline-flex items-center gap-2 glow-on-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Request a Call Back
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};

export default SchoolInquiryForm;
