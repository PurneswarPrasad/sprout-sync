import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Information and Social Media */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-lg">🌱</span>
              </div>
              <span className="text-xl font-bold text-emerald-600">SproutSync</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Transform your plant care journey into a mindful ritual with our intuitive plant care app.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors">
                <img src='/instagram.png' alt='Instagram' className='w-4 h-4' />
              </a>
              <a href="#" className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors">
                <img src='/twitter.png' alt='Twitter' className='w-4 h-4' />
              </a>
            </div>
          </div>

          {/* Tests Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Tests</h3>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-gray-600 hover:text-emerald-600 transition-colors cursor-pointer">
                AI Plant Identifier
              </a>
              <a href="#" className="block text-sm text-gray-600 hover:text-emerald-600 transition-colors cursor-pointer">
                AI Plant Health Monitor
              </a>
            </div>
          </div>

          {/* Company Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Company</h3>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-gray-600 hover:text-emerald-600 transition-colors cursor-pointer">
                Blog
              </a>
              <a href="#" className="block text-sm text-gray-600 hover:text-emerald-600 transition-colors cursor-pointer">
                Contact
              </a>
              <a href="#" className="block text-sm text-gray-600 hover:text-emerald-600 transition-colors cursor-pointer">
                Newsletter
              </a>
              <a href="#" className="block text-sm text-gray-600 hover:text-emerald-600 transition-colors cursor-pointer">
                Team
              </a>
            </div>
          </div>

          {/* Supported By Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Supported by</h3>
            <div className="flex items-center space-x-3">
              <img
                src="/C4E-logo.jpg"
                alt="C4E Logo"
                className="w-12 h-12 object-contain"
              />
            </div>
            <p className="text-sm text-gray-600">
              C4E is a collective of dreamers and doers.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            © 2025 SproutSync. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
