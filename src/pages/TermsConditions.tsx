
import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgressButton from '../components/ScrollProgressButton';

const TermsConditions = () => {
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
            Terms & Conditions
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 font-poppins mb-6 text-lg">
              Last updated: January 2025
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                Account Usage Terms
              </h2>
              <ul className="list-disc list-inside text-gray-600 font-poppins space-y-2 ml-4">
                <li><strong>One Student = One Account:</strong> Each MindLeap account is intended for use by a single student only</li>
                <li>Account sharing or multiple users per account is strictly prohibited</li>
                <li>Parents may monitor their child's progress but should not use the account for learning activities</li>
                <li>Account credentials should be kept secure and not shared with others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                Intellectual Property
              </h2>
              <p className="text-gray-600 font-poppins mb-4">
                All content on the MindLeap platform is protected by copyright:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-poppins space-y-2 ml-4">
                <li>Quizzes, challenges, and educational content are copyright © MindLeap</li>
                <li>Webinar recordings and materials are proprietary to MindLeap</li>
                <li>Users may not copy, distribute, or reproduce any platform content</li>
                <li>Screenshots or recordings for personal study are permitted</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                Access Duration & Transfer
              </h2>
              <ul className="list-disc list-inside text-gray-600 font-poppins space-y-2 ml-4">
                <li><strong>Non-transferable access:</strong> MindLeap accounts cannot be transferred to another student</li>
                <li>Access is valid for 1 year from the date of payment confirmation</li>
                <li>No extensions are provided beyond the 1-year access period</li>
                <li>Renewal requires a new payment for continued access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                Prohibited Activities
              </h2>
              <p className="text-gray-600 font-poppins mb-4">
                The following activities may result in immediate account termination:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-poppins space-y-2 ml-4">
                <li><strong>Spam:</strong> Excessive messaging or inappropriate communication</li>
                <li><strong>Misuse:</strong> Using the platform for non-educational purposes</li>
                <li><strong>Fraud:</strong> Attempting to manipulate scores or system data</li>
                <li><strong>Sharing:</strong> Distributing login credentials or account access</li>
                <li>Any activity that violates the educational integrity of the platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                Account Termination
              </h2>
              <p className="text-gray-600 font-poppins mb-4">
                MindLeap reserves the right to revoke access without refund in cases of:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-poppins space-y-2 ml-4">
                <li>Violation of these terms and conditions</li>
                <li>Misuse of platform features or content</li>
                <li>Fraudulent activity or system manipulation</li>
                <li>Failure to comply with community guidelines</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                Contact Information
              </h2>
              <p className="text-gray-600 font-poppins">
                For questions about these terms, please contact us at{' '}
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

export default TermsConditions;
