import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  onStartDesigning: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onStartDesigning }) => {
  return (
    <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">

      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-blue-300 text-sm font-medium mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span>AI-Powered Architecture v2.0</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight drop-shadow-2xl">
            Design Your Dream Home <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 animate-gradient-x">
              In Seconds
            </span>
          </h1>

          <p className="text-xl text-slate-300 mb-12 leading-relaxed max-w-2xl mx-auto font-light">
            Stop imagining and start seeing. Enter your dimensions, choose your style, and let our advanced AI generate professional-grade floor plans instantly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={onStartDesigning}
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30"
            >
              <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
              <span>Start Designing Free</span>
              <div className="absolute -inset-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 group-hover:opacity-40 blur-lg transition-opacity duration-200" />
            </button>

            <button className="inline-flex items-center text-slate-300 hover:text-white font-medium transition-colors">
              <span>View Gallery</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;