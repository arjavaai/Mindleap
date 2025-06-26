
import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgressButton from '../components/ScrollProgressButton';

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <CustomCursor />
      <ScrollProgressButton />
      <Navbar />
      
      <div className="pt-20 pb-16 px-4 md:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-deep-blue font-poppins mb-8">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 font-poppins mb-6 text-lg">
              Last updated: January 2025
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                Information We Collect
              </h2>
              <p className="text-gray-600 font-poppins mb-4">
                MindLeap collects limited information necessary to provide our educational services:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-poppins space-y-2 ml-4">
                <li>Student name and class (8th, 9th, or 10th)</li>
                <li>Parent email address for progress updates</li>
                <li>Parent phone number for WhatsApp communications (with consent)</li>
                <li>Quiz scores and learning progress data</li>
                <li>Platform usage statistics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                How We Use Your Information
              </h2>
              <p className="text-gray-600 font-poppins mb-4">
                We use collected information solely for:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-poppins space-y-2 ml-4">
                <li>Providing personalized learning experiences</li>
                <li>Sending monthly progress reports to parents</li>
                <li>Platform updates and educational announcements</li>
                <li>Customer support and technical assistance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                Data Protection
              </h2>
              <p className="text-gray-600 font-poppins mb-4">
                <strong>We never share or sell your personal information.</strong> Parent contact details and student data are kept strictly confidential and used only for internal educational purposes.
              </p>
              <p className="text-gray-600 font-poppins mb-4">
                Our platform uses industry-standard security measures to protect your data from unauthorized access, disclosure, or misuse.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                WhatsApp Communications
              </h2>
              <p className="text-gray-600 font-poppins mb-4">
                By providing your WhatsApp number, you consent to receive:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-poppins space-y-2 ml-4">
                <li>Monthly progress updates</li>
                <li>Important platform announcements</li>
                <li>Educational tips and motivation</li>
              </ul>
              <p className="text-gray-600 font-poppins mt-4">
                You can opt out of WhatsApp communications at any time by contacting us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                Contact Us
              </h2>
              <p className="text-gray-600 font-poppins">
                For any privacy-related questions or concerns, please contact us at{' '}
                <a href="mailto:support@mindleap.org.in" className="text-vibrant-orange hover:underline">
                  support@mindleap.org.in
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
