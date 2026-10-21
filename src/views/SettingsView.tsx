import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Bell,
  Trash2,
  RotateCcw,
  Database,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface SettingsViewProps {
  onDatabaseReset: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onDatabaseReset }) => {
  const [privacyObfuscation, setPrivacyObfuscation] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    if (!confirm('Reset local demo database to default clean seed data?')) return;

    try {
      setIsResetting(true);
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResetSuccess(true);
        onDatabaseReset();
        setTimeout(() => setResetSuccess(false), 4000);
      }
    } catch (e) {
      console.error('Reset error:', e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="text-xs font-mono text-teal-400 uppercase tracking-wider mb-1">
          Account & Configuration
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Settings & Privacy Governance
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal profile, notification thresholds, spatial privacy parameters, and demo database state.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-500/50 text-xs text-teal-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>Local database reset to clean default seed data successfully.</span>
        </div>
      )}

      {/* User Profile Panel */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-teal-400" />
          <span>User Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400">Full Name</span>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-medium">
              Maya Chen
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400">Account Role</span>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-teal-400 font-mono font-bold">
              MODERATOR (Demo Lead)
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400">Email Address</span>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono">
              maya.commute@safestride.demo
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-slate-400">Active Guardian Protection</span>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-mono">
              ENABLED · Automated Escalation
            </div>
          </div>
        </div>
      </div>

      {/* Spatial Privacy Settings */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-teal-400" />
          <span>Geospatial Privacy & Data Minimization</span>
        </h3>

        <div className="space-y-3 text-xs">
          <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyObfuscation}
              onChange={(e) => setPrivacyObfuscation(e.target.checked)}
              className="mt-0.5 rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0"
            />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200">
                Obfuscate Exact Home / Workplace Coordinates
              </span>
              <p className="text-slate-400 leading-normal">
                Snaps trip origins and destinations to a 100-meter street intersection grid so exact residence door numbers are never stored in trip history.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={soundAlerts}
              onChange={(e) => setSoundAlerts(e.target.checked)}
              className="mt-0.5 rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0"
            />
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-200">
                Audible Check-In Chimes & Emergency Siren
              </span>
              <p className="text-slate-400 leading-normal">
                Play synthesized browser audio tones for countdown warnings, check-in confirmations, and simulated SOS panic triggers.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Backend & Architecture Status */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-teal-400" />
          <span>System & Storage Architecture</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400">Database Engine</span>
            <div className="font-mono text-slate-200 font-semibold">
              MongoDB Dual-Engine Store
            </div>
            <p className="text-[11px] text-teal-400 font-mono">
              {process.env.MONGODB_URI ? 'Connected to Atlas URI' : 'Embedded persistent JSON engine (active)'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400">AI Intelligence Model</span>
            <div className="font-mono text-slate-200 font-semibold">
              Gemini 3.8 Flash SDK
            </div>
            <p className="text-[11px] text-teal-400 font-mono">
              Server-side route `/api/ai/journey-advice`
            </p>
          </div>
        </div>

        {/* Database Reset Action */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-300 block">
              Reset Demo Seed Data
            </span>
            <p className="text-[11px] text-slate-500">
              Restores original seed facilities, contacts, and reports, clearing test journeys.
            </p>
          </div>

          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-900/50 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isResetting ? 'Resetting...' : 'Reset Database'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
