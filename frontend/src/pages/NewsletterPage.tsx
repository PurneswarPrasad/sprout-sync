import React, { useState } from 'react';
import { Footer } from '../components/Footer';

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyjWd-PJGtmO6QdR4UPRTjERLgNsK-JBxU-rUKU_36cbHY95slU8T3LV7xUUrvTdiSv/exec';

export const NewsletterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      // Google Apps Script web app - POST request with FormData
      const formData = new FormData();
      formData.append('timestamp', new Date().toISOString());
      formData.append('name', name.trim() || '');
      formData.append('email', email.trim());

      // POST request to Google Apps Script
      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      });

      // Since no-cors mode doesn't return response data, we'll assume success
      // The Google Apps Script should handle the submission
      setShowSuccess(true);
      setName('');
      setEmail('');
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to subscribe. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-green-700 to-teal-700 relative">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Successfully Subscribed!</h3>
            <p className="text-gray-600 mb-6">
              Thank you for subscribing to SproutSync's newsletter. You'll receive weekly plant care tips and insights.
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12 mt-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
            Plant Care Insights Newsletter
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Stay updated with the latest plant care tips, growing techniques, and botanical knowledge. 
            Join thousands of plant enthusiasts who are nurturing their green spaces.
          </p>
        </div>

        {/* Call to Action Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Stay Updated with Plant Care Insights
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
            Get weekly plant care tips, seasonal growing guides, and expert advice delivered to your inbox. 
            Join thousands of plant lovers who are cultivating thriving gardens.
          </p>
        </div>

        {/* Content Section - Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 max-w-6xl mx-auto">
          {/* Left Column - What You'll Get */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6">What You'll Get:</h3>
            <ul className="space-y-4">
              {[
                'Weekly plant care tips and seasonal guides',
                'Exclusive access to new plant care features',
                'Plant identification and health monitoring insights',
                'Growing techniques for different plant types',
                'Early access to new content and tools',
              ].map((item, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <span className="text-emerald-300 mt-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="text-white text-lg">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column - Testimonials */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Recent Subscribers Say:</h3>
            <div className="space-y-4">
              <div className="bg-emerald-600/30 rounded-xl p-6">
                <p className="text-white mb-3 italic">
                  "The weekly plant care tips have completely transformed how I care for my indoor garden! 
                  My plants are thriving like never before."
                </p>
                <p className="text-emerald-200 font-semibold">— Sarah M.</p>
              </div>
              <div className="bg-emerald-600/30 rounded-xl p-6">
                <p className="text-white mb-3 italic">
                  "Finally, plant care advice explained in a way that's practical and easy to understand. 
                  Perfect for beginners like me!"
                </p>
                <p className="text-emerald-200 font-semibold">— Mike R.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Form Section */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="First name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 px-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-red-200 text-sm text-center">{error}</p>
            )}
            <p className="text-white/80 text-sm text-center">
              No spam, ever. Unsubscribe anytime with one click.
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-16">
        <Footer />
      </div>
    </div>
  );
};

