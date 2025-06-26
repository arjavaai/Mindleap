
import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CustomCursor from '../components/CustomCursor';
import ScrollProgressButton from '../components/ScrollProgressButton';

const RefundPolicy = () => {
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
            Refund Policy
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 font-poppins mb-6 text-lg">
              Last updated: January 2025
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                No Refund Policy
              </h2>
              <div className="bg-orange-50 border-l-4 border-vibrant-orange p-6 mb-6">
                <p className="text-deep-blue font-poppins font-semibold text-lg">
                  ₹500/year is non-refundable once account access has been granted.
                </p>
              </div>
              <p className="text-gray-600 font-poppins mb-4">
                This policy ensures that we can continue providing high-quality educational content and platform maintenance. Once your child's account is activated and they gain access to our complete library of quizzes, challenges, and educational resources, the annual fee becomes non-refundable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                Limited Exceptions
              </h2>
              <p className="text-gray-600 font-poppins mb-4">
                Refunds may be considered only in the following exceptional circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-poppins space-y-2 ml-4">
                <li><strong>Duplicate Payment:</strong> If the same payment was processed twice due to technical error</li>
                <li><strong>System Lock-out:</strong> If the user was permanently locked out due to a technical issue on our end</li>
                <li><strong>Billing Error:</strong> If you were charged incorrectly due to a system malfunction</li>
              </ul>
              <p className="text-gray-600 font-poppins mt-4">
                <em>Note: Technical difficulties, change of mind, or academic schedule changes do not qualify for refunds.</em>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                What Your Payment Covers
              </h2>
              <p className="text-gray-600 font-poppins mb-4">
                Your ₹500 annual subscription provides:
              </p>
              <ul className="list-disc list-inside text-gray-600 font-poppins space-y-2 ml-4">
                <li>Full access to daily thinking challenges</li>
                <li>Unlimited quiz attempts across all subjects</li>
                <li>Badge collection and streak tracking</li>
                <li>Monthly progress reports sent to parents</li>
                <li>Access to exclusive webinars and educational content</li>
                <li>Technical support throughout the year</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                Dispute Resolution Process
              </h2>
              <p className="text-gray-600 font-poppins mb-4">
                If you believe you qualify for a refund under our limited exceptions:
              </p>
              <ol className="list-decimal list-inside text-gray-600 font-poppins space-y-2 ml-4">
                <li>Contact our support team within 7 days of payment</li>
                <li>Provide your transaction ID and detailed explanation</li>
                <li>Allow 5-7 business days for investigation</li>
                <li>Our team will respond with a decision and next steps</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                Contact for Disputes
              </h2>
              <p className="text-gray-600 font-poppins mb-4">
                For any payment-related concerns or refund requests:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 font-poppins mb-2">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:support@mindleap.org.in" className="text-vibrant-orange hover:underline">
                    support@mindleap.org.in
                  </a>
                </p>
                <p className="text-gray-700 font-poppins mb-2">
                  <strong>Phone:</strong>{' '}
                  <a href="tel:+918886554455" className="text-vibrant-orange hover:underline">
                    8886 55 44 55
                  </a>
                </p>
                <p className="text-gray-700 font-poppins">
                  <strong>Subject Line:</strong> "Refund Request - [Your Transaction ID]"
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-deep-blue font-poppins mb-4">
                Processing Time
              </h2>
              <p className="text-gray-600 font-poppins">
                Approved refunds (under exceptional circumstances) will be processed within 7-14 business days to the original payment method.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RefundPolicy;
