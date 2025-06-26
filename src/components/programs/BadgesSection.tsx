import React, { useState } from 'react';
import { Award, Star, Crown } from 'lucide-react';
import ScrollAnimation from '../ScrollAnimation';

const BadgesSection = () => {
  const [selectedBadge, setSelectedBadge] = useState(0);
  
  const badges = [{
    name: 'Bronze Starter',
    icon: <img src="/medals_icons/bronze_medal.png.png" alt="Bronze Medal" className="w-12 h-12 object-contain" />,
    days: 5,
    color: 'from-orange-400 to-yellow-500',
    features: ['5-day streak', 'Basic certificate', 'Achievement unlock']
  }, {
    name: 'Silver Champion',
    icon: <img src="/medals_icons/silver_medal.png.png" alt="Silver Medal" className="w-12 h-12 object-contain" />,
    days: 10,
    color: 'from-gray-400 to-gray-600',
    features: ['10-day streak', 'Silver certificate', 'Parent notification']
  }, {
    name: 'Gold Master',
    icon: <img src="/medals_icons/gold_medal.png.png" alt="Gold Medal" className="w-12 h-12 object-contain" />,
    days: 15,
    color: 'from-yellow-400 to-yellow-600',
    features: ['15-day streak', 'Gold certificate', 'Special recognition']
  }, {
    name: 'Platinum Legend',
    icon: <img src="/medals_icons/platinium_medal.png.png" alt="Platinum Medal" className="w-12 h-12 object-contain" />,
    days: 20,
    color: 'from-purple-400 to-purple-600',
    features: ['20+ days streak', 'Platinum status', 'Cash rewards eligible']
  }];

  return (
    <section className="py-16 px-4 sm:px-6 md:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <ScrollAnimation animation="fadeUp">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-blue font-poppins mb-4">
              From Bronze to Platinum – Earn Every Step
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Build your streak and unlock amazing badges with certificates, recognition, and cash rewards for top performers.
            </p>
          </div>
        </ScrollAnimation>

        {/* Badge Slider */}
        <ScrollAnimation animation="scale">
          <div className="flex justify-center mb-12">
            <div className="flex space-x-4 bg-white rounded-2xl p-2 shadow-lg">
              {badges.map((badge, index) => (
                <button 
                  key={index} 
                  onClick={() => setSelectedBadge(index)} 
                  className={`flex flex-col items-center p-4 rounded-xl transition-all duration-300 ${selectedBadge === index ? 'bg-gradient-to-br ' + badge.color + ' text-white shadow-lg scale-110' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-center mb-3 w-16 h-16">
                    {badge.icon}
                  </div>
                  <p className={`text-xs font-medium ${selectedBadge === index ? 'text-white' : 'text-deep-blue'}`}>
                    {badge.days} days
                  </p>
                </button>
              ))}
            </div>
          </div>
        </ScrollAnimation>

        {/* Selected Badge Details */}
        <ScrollAnimation animation="fadeUp" delay={200}>
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${badges[selectedBadge].color} text-white mb-4`}>
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src={badges[selectedBadge].icon.props.src} 
                    alt={badges[selectedBadge].icon.props.alt} 
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-deep-blue mb-2">{badges[selectedBadge].name}</h3>
              <p className="text-gray-600">Achieve a {badges[selectedBadge].days}-day streak to unlock this badge</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {badges[selectedBadge].features.map((feature, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimation>

        {/* Reward System */}
        <ScrollAnimation animation="fadeUp" delay={400}>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <ScrollAnimation animation="slideLeft">
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-deep-blue mb-2">Monthly Reports</h3>
                <p className="text-sm text-gray-600">Detailed progress reports sent to parents every month with achievements and insights.</p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animation="fadeUp" delay={200}>
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-deep-blue mb-2">Digital Certificates</h3>
                <p className="text-sm text-gray-600">Official certificates for each badge level that can be downloaded and shared.</p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animation="slideRight">
              <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-deep-blue mb-2">Cash Rewards</h3>
                <p className="text-sm text-gray-600">Special cash rewards for quiz toppers and students who maintain platinum streaks.</p>
              </div>
            </ScrollAnimation>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};

export default BadgesSection;
