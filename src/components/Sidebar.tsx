import React from 'react';
import {
  LayoutDashboard,
  Navigation,
  Radio,
  Building2,
  AlertTriangle,
  Users,
  PhoneCall,
  History,
  Settings,
  Sparkles,
} from 'lucide-react';
import { Trip } from '../lib/types.ts';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  activeTrip: Trip | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  activeTrip,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Command Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Journey Planner', icon: Navigation },
    {
      id: 'guardian',
      label: 'Journey Guardian',
      icon: Radio,
      badge: activeTrip?.status === 'ACTIVE' ? 'ACTIVE' : null,
    },
    { id: 'facilities', label: 'Safe Havens Directory', icon: Building2 },
    { id: 'incidents', label: 'Community Reports', icon: AlertTriangle },
    { id: 'contacts', label: 'Trusted Contacts', icon: Users },
    { id: 'emergency', label: 'Emergency Center', icon: PhoneCall, urgent: true },
    { id: 'history', label: 'History & Analytics', icon: History },
    { id: 'settings', label: 'Settings & Privacy', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-800/80 bg-[#090D16] min-h-[calc(100vh-4rem)] p-4">
      {/* Active Journey Widget in Sidebar */}
      {activeTrip && activeTrip.status === 'ACTIVE' && (
        <div className="mb-5 p-3 rounded-xl border border-teal-500/30 bg-teal-950/20">
          <div className="flex items-center justify-between text-xs font-semibold text-teal-400 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              Monitored Trip
            </span>
            <span className="font-mono text-[11px] text-teal-300">
              {activeTrip.routeReadinessScore}/100
            </span>
          </div>
          <p className="text-xs text-slate-300 truncate font-medium">
            To: {activeTrip.destination.name}
          </p>
          <button
            onClick={() => onNavigate('guardian')}
            className="w-full mt-2 py-1 px-2 text-xs font-medium bg-teal-600 hover:bg-teal-500 text-slate-950 rounded-lg transition-colors text-center"
          >
            Open Guardian
          </button>
        </div>
      )}

      {/* Nav Link List */}
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-teal-400 font-semibold'
                  : item.urgent
                  ? 'text-rose-400 hover:bg-rose-950/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : ''}`} />
                <span className="whitespace-nowrap">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-mono font-bold tracking-wider text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="mt-auto pt-4 border-t border-slate-800/80 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span className="font-medium text-slate-300">Gemini 3.8 Intelligence</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Deterministic scoring + verified public safe havens. Prototype safety simulation.
        </p>
      </div>
    </aside>
  );
};
