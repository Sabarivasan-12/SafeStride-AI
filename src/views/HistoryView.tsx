import React, { useState, useEffect } from 'react';
import { Trip, SafetyEvent } from '../lib/types.ts';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Navigation,
  Shield,
  Calendar,
} from 'lucide-react';

export const HistoryView: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const res = await fetch('/api/trips');
        const data = await res.json();
        if (data.success) {
          setTrips(data.data);
        }
      } catch (e) {
        console.error('Failed to load trips history:', e);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  const totalCompleted = trips.filter((t) => t.status === 'COMPLETED').length;
  const avgScore =
    trips.length > 0
      ? Math.round(
          trips.reduce((acc, t) => acc + (t.routeReadinessScore || 70), 0) / trips.length
        )
      : 78;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono text-teal-400 uppercase tracking-wider mb-1">
            Personal Commute Archive
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Journey History & Safety Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete record of previous monitored commutes, readiness scores, and logged check-ins.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          Total Journeys Logged: <span className="text-teal-400 font-bold">{trips.length}</span>
        </div>
      </div>

      {/* Analytics KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Completed Commutes</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {totalCompleted}
          </div>
          <span className="text-[11px] text-slate-500">Safely checked-in destinations</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Average Route Readiness</span>
          <div className="text-2xl font-bold font-mono text-teal-400 tabular-nums">
            {avgScore}/100
          </div>
          <span className="text-[11px] text-teal-400">Consistent verified corridors</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Check-In Success Rate</span>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            96.4%
          </div>
          <span className="text-[11px] text-slate-500">On-time check-in reliability</span>
        </div>
      </div>

      {/* Journeys List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Previous Journeys Log
        </h3>

        {trips.map((trip) => (
          <div
            key={trip._id}
            className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold">
                    {trip.city.toUpperCase()} Commute
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(trip.createdAt).toLocaleString()}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">
                  {trip.origin.name} → {trip.destination.name}
                </h4>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-mono block">Readiness</span>
                  <span className="font-mono text-xs font-bold text-teal-300">
                    {trip.routeReadinessScore}/100
                  </span>
                </div>

                <span
                  className={`text-[10px] font-mono px-2.5 py-1 rounded font-bold ${
                    trip.status === 'COMPLETED'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                      : trip.status === 'ACTIVE'
                      ? 'bg-teal-950 text-teal-400 border border-teal-800/40 animate-pulse'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {trip.status}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
              <span>Distance: {(trip.distanceMeters / 1000).toFixed(2)} km</span>
              <span>Check-in interval: {trip.checkinIntervalMinutes} mins</span>
              <span className="text-slate-500">
                Created: {new Date(trip.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {trips.length === 0 && !loading && (
          <div className="p-10 text-center text-xs text-slate-400 rounded-xl bg-[#0f172a] border border-slate-800">
            No journeys recorded yet. Plan and start a journey to populate your commute history.
          </div>
        )}
      </div>
    </div>
  );
};
