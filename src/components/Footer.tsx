import React from 'react';
import { Shield, FileText, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-50 to-purple-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-gray-600">
              © 2025 AI Floor Plan Generator. All rights reserved.
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <a
              href="#"
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-500 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Privacy</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-500 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Terms</span>
            </a>
            <a
              href="#"
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-500 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;