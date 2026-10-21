import React from 'react';
import { CITIES, CityId } from '../lib/types.ts';
import {
  Shield,
  Navigation,
  Radio,
  Building2,
  Users,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (view: string) => void;
  currentCityId: CityId;
  onSelectCity: (cityId: CityId) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onNavigate,
  currentCityId,
  onSelectCity,
}) => {
  const currentCity = CITIES[currentCityId];

  return (
    <div className="space-y-16 py-6 pb-20">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/30 bg-teal-950/30 text-teal-300 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-teal-400"></span>
          <span>Women Commuter Safety Platform · 7-Hour Hackathon Edition</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Plan smarter. Travel prepared.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
            Stay connected.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          SafeStride AI provides women commuting through unfamiliar urban corridors with transparent, explainable route readiness evidence, active journey check-in monitoring, and rapid emergency escalation.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onNavigate('planner')}
            className="flex items-center gap-2 px-6 py-3.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-slate-950" />
            <span>Launch Journey Planner</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-100 font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
          >
            <span>Open Command Dashboard</span>
          </button>
        </div>

        {/* Responsible Safety Notice */}
        <div className="max-w-2xl mx-auto mt-6 p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-left flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            <span className="font-semibold text-amber-300">Responsible Safety Disclosure:</span> SafeStride AI calculates readiness scores from verified public facilities, transit density, and community notices. It does not predict criminal activity or guarantee personal safety. All SOS triggers are simulated for demonstration.
          </div>
        </div>
      </section>

      {/* City Switcher Bar */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-teal-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Live Demo Metropolitan Preset</h3>
              <p className="text-xs text-slate-400">
                Explore real support facilities and commuter routes across 3 global cities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(['karur', 'trichy', 'dindigul'] as CityId[]).map((cId) => {
              const c = CITIES[cId];
              const isSelected = currentCityId === cId;
              return (
                <button
                  key={cId}
                  onClick={() => onSelectCity(cId)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3 Core Innovation Pillars */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Three Layers of Commute Intelligence
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            A complete safety framework combining transparent route evidence, active accompaniment, and community solidarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-colors space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-950/60 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">1. Explainable Route Readiness</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparent, deterministic formula based on 4 verified evidence factors: 24/7 support facilities (30%), public transit proximity (25%), municipal lighting (25%), and community freshness (20%).
            </p>
            <div className="pt-2 text-xs text-teal-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full factor breakdown & missing-data warnings</span>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-colors space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">2. Journey Guardian</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In-app state machine monitoring your commute timeline with timed check-in countdowns. If overdue, transitions through warning states to simulated trusted-contact escalation.
            </p>
            <div className="pt-2 text-xs text-purple-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Audible siren & simulated SMS dispatch audit log</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-colors space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">3. Community Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Submit anonymous local observations (lighting outages, walkway obstructions, harassment). Moderated feed ensures unreviewed allegations are never reported as confirmed facts.
            </p>
            <div className="pt-2 text-xs text-amber-400 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Gemini AI categorization & moderator workflow</span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Quick CTA Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="p-8 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <h3 className="text-xl font-bold text-white">Ready to test the demo commute?</h3>
            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
              Test the route between {currentCity.defaultOrigin.name} and {currentCity.defaultDestination.name} in {currentCity.name}.
            </p>
          </div>

          <button
            onClick={() => onNavigate('planner')}
            className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl whitespace-nowrap shadow-md cursor-pointer transition-transform hover:scale-105"
          >
            Start Route Assessment
          </button>
        </div>
      </section>
    </div>
  );
};
