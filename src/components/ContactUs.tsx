import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send, Sparkles } from 'lucide-react';
import ScrollAnimation from './ScrollAnimation';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'contactQueries'), {
        name: formData.fullName,
        email: formData.email,
        phone: formData.mobile,
        message: formData.message,
        source: 'Contact Page Form',
        timestamp: new Date(),
        status: 'new'
      });

      toast({
        title: "Thanks for reaching out!",
        description: "We'll get back to you within 24 hours."
      });
      
      setFormData({
        fullName: '',
        email: '',
        mobile: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast({
        title: "Error",
        description: "There was an error sending your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: "Email",
      value: "support@mindleap.org.in",
      color: "text-blue-600"
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: "Phone", 
      value: "+91 8886 55 44 55",
      color: "text-green-600"
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Location",
      value: "Guntur, Andhra Pradesh",
      color: "text-purple-600"
    }
  ];

  return (
    <section id="contact" className="py-12 px-4 sm:px-6 md:px-24 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Section Heading */}
        <ScrollAnimation animation="fadeUp" className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-vibrant-orange rounded-xl mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-deep-blue font-poppins mb-2">
            Get in Touch
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Ready to transform your child's thinking journey? Let's connect!
          </p>
        </ScrollAnimation>

        {/* Contact Info Cards */}
        <ScrollAnimation animation="fadeUp" delay={200}>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 text-center">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${info.color} bg-opacity-10`}>
                  <span className={info.color}>{info.icon}</span>
                </div>
                <h3 className="font-semibold text-deep-blue mb-1">{info.title}</h3>
                <p className="text-gray-600 text-sm">{info.value}</p>
              </div>
            ))}
          </div>
        </ScrollAnimation>

        {/* Contact Form */}
        <ScrollAnimation animation="fadeUp" delay={400}>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-deep-blue mb-1">Send us a message</h3>
                <p className="text-sm text-gray-600">We'll get back to you soon</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName" className="text-sm font-medium text-deep-blue mb-1 block">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="h-10 border border-gray-200 rounded-lg focus:border-vibrant-orange focus:ring-1 focus:ring-vibrant-orange"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-deep-blue mb-1 block">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="h-10 border border-gray-200 rounded-lg focus:border-vibrant-orange focus:ring-1 focus:ring-vibrant-orange"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mobile" className="text-sm font-medium text-deep-blue mb-1 block">
                  Mobile Number
                </Label>
                <Input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  required
                  className="h-10 border border-gray-200 rounded-lg focus:border-vibrant-orange focus:ring-1 focus:ring-vibrant-orange"
                  placeholder="Your mobile number"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-sm font-medium text-deep-blue mb-1 block">
                  Message
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="border border-gray-200 rounded-lg resize-none focus:border-vibrant-orange focus:ring-1 focus:ring-vibrant-orange"
                  placeholder="How can we help you?"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-gradient-to-r from-vibrant-orange to-orange-600 hover:from-orange-600 hover:to-vibrant-orange text-white font-semibold rounded-lg transition-all duration-300"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </div>
                )}
              </Button>
            </form>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};

export default ContactUs;
