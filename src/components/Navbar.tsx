import React from 'react';
import { CITIES, CityId } from '../lib/types.ts';
import { FirebaseUser, signInWithGoogle, logOut } from '../lib/firebase.ts';
import { Shield, Radio, PhoneCall, Globe, Menu, X, LogIn, LogOut, User } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  currentCityId: CityId;
  onSelectCity: (cityId: CityId) => void;
  isJourneyActive: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  currentUser: FirebaseUser | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentCityId,
  onSelectCity,
  isJourneyActive,
  mobileMenuOpen,
  setMobileMenuOpen,
  currentUser,
}) => {
  const city = CITIES[currentCityId];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090D16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 h-16">
        {/* Zone 1: Brand Wordmark (Single Text Element) */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 font-black shadow-md shadow-teal-500/20">
            <Shield className="w-4 h-4 text-slate-950" />
          </div>
          <span>SafeStride <span className="text-teal-400 font-medium">AI</span></span>
        </button>

        {/* Zone 2: Single-Line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'dashboard' ? 'text-teal-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate('planner')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'planner' ? 'text-teal-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Journey Planner
          </button>
          <button
            onClick={() => onNavigate('guardian')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentView === 'guardian' ? 'text-teal-400 font-semibold' : 'hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-teal-400" />
            <span>Guardian Monitor</span>
            {isJourneyActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
            )}
          </button>
          <button
            onClick={() => onNavigate('facilities')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'facilities' ? 'text-teal-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Safe Havens
          </button>
          <button
            onClick={() => onNavigate('incidents')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              currentView === 'incidents' ? 'text-teal-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Community Reports
          </button>
        </nav>

        {/* Zone 3: Primary Actions (City Switcher + Firebase Google Auth + Emergency SOS) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* City Preset Switcher (Karur, Trichy, Dindigul) */}
          <div className="relative flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" />
            <select
              value={currentCityId}
              onChange={(e) => onSelectCity(e.target.value as CityId)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="karur" className="bg-slate-900 text-slate-100">Karur</option>
              <option value="trichy" className="bg-slate-900 text-slate-100">Trichy</option>
              <option value="dindigul" className="bg-slate-900 text-slate-100">Dindigul</option>
            </select>
          </div>

          {/* Firebase Google Auth Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg py-1 px-2 text-xs">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt="Avatar"
                  className="w-5 h-5 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-4 h-4 text-teal-400" />
              )}
              <span className="hidden md:inline text-slate-200 font-medium truncate max-w-[90px]">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
              <button
                onClick={() => logOut()}
                className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors"
                title="Sign Out of Firebase"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              title="Sign in with Google via Firebase Auth"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.9c2.28-2.1 3.645-5.18 3.645-9.14z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.9-3.05c-1.08.72-2.45 1.16-4.03 1.16-3.1 0-5.74-2.1-6.68-4.93H1.21v3.13C3.25 21.46 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.32 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.6H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.4l4.11-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.54 1.21 6.6l4.11 3.13c.94-2.83 3.58-4.98 6.68-4.98z"
                />
              </svg>
              <span className="hidden sm:inline">Google Login</span>
            </button>
          )}

          {/* Emergency Center Quick Action */}
          <button
            onClick={() => onNavigate('emergency')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-200 bg-rose-950/70 border border-rose-800/80 rounded-lg hover:bg-rose-900 transition-colors whitespace-nowrap shrink-0"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">SOS {city.emergencyNumber}</span>
          </button>

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-[#090D16] px-4 py-3 space-y-2">
          {currentUser ? (
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-teal-400" />
                <span>{currentUser.displayName || currentUser.email}</span>
              </div>
              <button
                onClick={() => { logOut(); setMobileMenuOpen(false); }}
                className="text-rose-400 font-semibold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => { signInWithGoogle(); setMobileMenuOpen(false); }}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2"
            >
              Sign In with Google (Firebase)
            </button>
          )}
          <button
            onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 hover:bg-slate-800/70"
          >
            Dashboard
          </button>
          <button
            onClick={() => { onNavigate('planner'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 hover:bg-slate-800/70"
          >
            Journey Planner
          </button>
          <button
            onClick={() => { onNavigate('guardian'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 hover:bg-slate-800/70"
          >
            Journey Guardian Monitor {isJourneyActive ? '(Active)' : ''}
          </button>
          <button
            onClick={() => { onNavigate('facilities'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 hover:bg-slate-800/70"
          >
            Support Facilities Directory
          </button>
          <button
            onClick={() => { onNavigate('incidents'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 hover:bg-slate-800/70"
          >
            Community Incident Intelligence
          </button>
          <button
            onClick={() => { onNavigate('contacts'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 hover:bg-slate-800/70"
          >
            Trusted Contacts
          </button>
          <button
            onClick={() => { onNavigate('emergency'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 px-3 rounded-lg text-sm text-rose-300 font-semibold hover:bg-rose-950/40"
          >
            Emergency Center & Hotlines
          </button>
          <button
            onClick={() => { onNavigate('history'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 hover:bg-slate-800/70"
          >
            Journey History & Analytics
          </button>
          <button
            onClick={() => { onNavigate('settings'); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 px-3 rounded-lg text-sm text-slate-200 hover:bg-slate-800/70"
          >
            Settings & Privacy
          </button>
        </div>
      )}
    </header>
  );
};
