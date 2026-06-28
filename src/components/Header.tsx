import React from 'react';
import { Home, Info, Building, Mail, History, LogIn, LogOut } from 'lucide-react';

interface AuthUser { name: string; email: string; token: string; }

interface HeaderProps {
  onToggleSidebar: () => void;
  onToggleHistory: () => void;
  user?: AuthUser | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onToggleSidebar, onToggleHistory, user, onLogin, onLogout
}) => {
  return (
    <header className="fixed w-full top-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <div className="flex items-center space-x-2 group cursor-pointer flex-shrink-0">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
              <Building className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">GPlan</span>
          </div>

          {/* Desktop Nav — compact, no overflow */}
          <nav className="hidden md:flex items-center gap-3 overflow-hidden min-w-0">
            {[
              { name: 'Home', icon: Home, href: '#home' },
              { name: 'About', icon: Info, href: '#about' },
              { name: 'Generate', icon: Building, href: '#generate' },
              { name: 'Contact', icon: Mail, href: '#contact' },
            ].map((item) => (
              <a key={item.name} href={item.href}
                className="flex items-center gap-1 text-xs font-medium text-gray-300 hover:text-white transition-colors group whitespace-nowrap flex-shrink-0"
              >
                <item.icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                <span>{item.name}</span>
              </a>
            ))}

            {/* History */}
            <button onClick={onToggleHistory}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 transition-all text-xs whitespace-nowrap flex-shrink-0"
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-600/15 border border-blue-500/20 max-w-[130px]">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    {user.name[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-white font-medium truncate">{user.name.split(' ')[0]}</span>
                </div>
                <button onClick={onLogout}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={onLogin}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg whitespace-nowrap flex-shrink-0"
              >
                <LogIn className="w-3 h-3" />
                Sign In
              </button>
            )}
          </nav>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={onToggleHistory}
              className="p-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5"
            >
              <History className="w-4 h-4" />
            </button>
            {user ? (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                {user.name[0].toUpperCase()}
              </div>
            ) : (
              <button onClick={onLogin}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-semibold"
              >
                <LogIn className="w-3 h-3" /> Sign In
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;