import React, { useState } from 'react';
import { CITIES, CityId, Trip } from '../lib/types.ts';
import { soundController } from '../lib/audio.ts';
import {
  PhoneCall,
  AlertTriangle,
  Shield,
  HeartHandshake,
  CheckCircle2,
  Volume2,
  Radio,
} from 'lucide-react';

interface EmergencyViewProps {
  currentCityId: CityId;
  activeTrip: Trip | null;
  onNavigate: (view: string) => void;
}

export const EmergencyView: React.FC<EmergencyViewProps> = ({
  currentCityId,
  activeTrip,
  onNavigate,
}) => {
  const city = CITIES[currentCityId];
  const [sosSimulated, setSosSimulated] = useState(false);
  const [sirenPlaying, setSirenPlaying] = useState(false);

  const handleTestSiren = () => {
    if (sirenPlaying) {
      soundController.stopSiren();
      setSirenPlaying(false);
    } else {
      soundController.startSiren();
      setSirenPlaying(true);
    }
  };

  const handleTriggerSimulatedEmergency = async () => {
    soundController.startSiren();
    setSirenPlaying(true);
    setSosSimulated(true);

    try {
      await fetch('/api/safety/simulate-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: activeTrip?._id || 'trip_emergency_center',
          alertType: 'SOS',
          note: 'Direct panic trigger from Emergency Center',
        }),
      });
    } catch (e) {
      console.error('Failed to trigger emergency alert simulation:', e);
    }
  };

  const handleDismissSimulatedEmergency = () => {
    soundController.stopSiren();
    setSirenPlaying(false);
    setSosSimulated(false);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono text-rose-400 uppercase tracking-wider mb-1">
            Immediate Response Protocol · {city.name}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Emergency Center & Crisis Hotlines
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            One-touch emergency dials, regional support helplines, and simulated SOS panic dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestSiren}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              sirenPlaying
                ? 'bg-rose-900 border-rose-500 text-rose-100 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{sirenPlaying ? 'Stop Alarm Siren' : 'Test Alarm Audio'}</span>
          </button>
        </div>
      </div>

      {/* Simulated Alert Takeover Banner */}
      {sosSimulated && (
        <div className="p-6 rounded-2xl bg-rose-950/60 border border-rose-500 text-center space-y-4 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-900 border border-rose-400 text-rose-200 text-xs font-mono font-bold animate-pulse">
            🚨 SIMULATED EMERGENCY SOS ACTIVE
          </div>

          <h2 className="text-2xl font-black text-white">
            Simulated Panic Broadcast Dispatched
          </h2>
          <p className="text-xs text-rose-200/90 max-w-lg mx-auto leading-relaxed">
            Your emergency contacts have been sent simulated distress SMS messages with your last recorded commute coordinates.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href={`tel:${city.emergencyNumber}`}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Official Police ({city.emergencyNumber})</span>
            </a>

            <button
              onClick={handleDismissSimulatedEmergency}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer"
            >
              Dismiss / Resolve Simulated Alert
            </button>
          </div>
        </div>
      )}

      {/* Main Panic Button Card */}
      <div className="p-8 rounded-2xl bg-gradient-to-br from-rose-950/40 via-[#0f172a] to-[#0f172a] border border-rose-900/60 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-900/40 border-2 border-rose-500 flex items-center justify-center text-rose-400 mx-auto shadow-xl shadow-rose-950">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-bold text-white">
          Simulated Emergency Panic Trigger
        </h3>
        <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
          In an actual emergency, always dial <span className="font-bold text-rose-300">{city.emergencyNumber}</span> directly. Use this button to simulate the complete Guardian alert protocol and siren.
        </p>

        <div className="pt-2">
          <button
            onClick={handleTriggerSimulatedEmergency}
            className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm tracking-wider uppercase rounded-2xl shadow-xl shadow-rose-900/50 transition-all hover:scale-105 cursor-pointer"
          >
            Trigger Simulated SOS
          </button>
        </div>
      </div>

      {/* Direct Telephone Numbers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Official Emergency Service */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800/80 flex items-center justify-center text-rose-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Official Police & Medical Emergency
              </h3>
              <p className="text-xs text-slate-400">{city.region}</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Direct high-priority municipal emergency dispatch. For imminent physical threats or acute medical emergencies.
          </p>

          <a
            href={`tel:${city.emergencyNumber}`}
            className="w-full py-3 bg-rose-950/80 hover:bg-rose-900/80 border border-rose-800 text-rose-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call {city.emergencyNumber} (Emergency)</span>
          </a>
        </div>

        {/* Dedicated Women's Support & Crisis Hotline */}
        <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-950 border border-teal-800/80 flex items-center justify-center text-teal-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{city.helplineName}</h3>
              <p className="text-xs text-slate-400">24/7 Confidential Crisis Line</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Free, confidential advice, emergency shelter coordination, and emotional support for women traveling in {city.name}.
          </p>

          <a
            href={`tel:${city.helplineNumber}`}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-teal-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call {city.helplineNumber}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
