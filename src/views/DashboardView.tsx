import React, { useEffect, useState } from 'react';
import {
  CITIES,
  CityId,
  Trip,
  SafetyFacility,
  IncidentReport,
  SafetyEvent,
  TrustedContact,
} from '../lib/types.ts';
import {
  Shield,
  Navigation,
  Radio,
  Building2,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  PhoneCall,
  ChevronRight,
} from 'lucide-react';
import { MapLibreMap } from '../components/MapLibreMap.tsx';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  currentCityId: CityId;
  activeTrip: Trip | null;
  onRefreshTrip: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  currentCityId,
  activeTrip,
}) => {
  const city = CITIES[currentCityId];
  const [facilities, setFacilities] = useState<SafetyFacility[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [facRes, incRes, conRes] = await Promise.all([
          fetch(`/api/facilities?city=${currentCityId}`),
          fetch(`/api/incidents?city=${currentCityId}`),
          fetch('/api/contacts'),
        ]);

        const facData = await facRes.json();
        const incData = await incRes.json();
        const conData = await conRes.json();

        if (facData.success) setFacilities(facData.data);
        if (incData.success) setIncidents(incData.data);
        if (conData.success) setContacts(conData.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [currentCityId]);

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono text-teal-400 uppercase tracking-wider mb-1">
            Command Center · {city.name}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Welcome back, Maya Chen
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Guardian accompaniment and verified public safe havens are synchronized for your evening commute.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('planner')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm transition-transform hover:scale-105 cursor-pointer"
          >
            <Navigation className="w-4 h-4 text-slate-950" />
            <span>Plan New Route</span>
          </button>
        </div>
      </div>

      {/* Active Trip Banner if Active */}
      {activeTrip && activeTrip.status === 'ACTIVE' && (
        <div className="p-4 rounded-xl border border-teal-500/40 bg-teal-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
                <span>ACTIVE JOURNEY IN PROGRESS</span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-slate-300">Readiness: {activeTrip.routeReadinessScore}/100</span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {activeTrip.origin.name} → {activeTrip.destination.name}
              </h3>
              <p className="text-xs text-slate-400">
                Next check-in scheduled for{' '}
                <span className="text-slate-200 font-mono">
                  {activeTrip.nextCheckinDueAt
                    ? new Date(activeTrip.nextCheckinDueAt).toLocaleTimeString()
                    : 'Scheduled soon'}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('guardian')}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg whitespace-nowrap cursor-pointer transition-colors"
          >
            Open Journey Guardian Monitor
          </button>
        </div>
      )}

      {/* High-Level Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Safe Havens Nearby</span>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {facilities.length}
          </div>
          <span className="text-[11px] text-teal-400">Verified 24/7 Support Points</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Community Notices</span>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
            {incidents.filter((i) => i.reviewStatus === 'APPROVED').length}
          </div>
          <span className="text-[11px] text-slate-400">Active reviewed alerts</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Trusted Contacts</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {contacts.filter((c) => c.consentStatus === 'verified').length}
          </div>
          <span className="text-[11px] text-emerald-400">Consent verified for alerts</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Emergency Protocol</span>
          <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
            {city.emergencyNumber}
          </div>
          <span className="text-[11px] text-rose-300">Direct dial configured</span>
        </div>
      </div>

      {/* Main Map & Facilities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: City Map with Support Facility Markers */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-400" />
              <span>Verified Support Facilities Map</span>
            </h2>
            <button
              onClick={() => onNavigate('facilities')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
            >
              <span>View All Facilities</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <MapLibreMap
            city={city}
            facilities={facilities}
            incidents={incidents}
            className="h-80 w-full"
          />
        </div>

        {/* Right Col: Quick Safe Havens List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-400" />
              <span>Safe Havens Nearby</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">{facilities.length} Locations</span>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {facilities.slice(0, 4).map((fac) => (
              <div
                key={fac._id}
                className="p-3 rounded-lg bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wide">
                      {fac.facilityType.replace('_', ' ')}
                    </span>
                    <h4 className="text-xs font-semibold text-white leading-tight">{fac.name}</h4>
                    <p className="text-[11px] text-slate-400 leading-normal">{fac.address}</p>
                  </div>
                  {fac.phone && (
                    <a
                      href={`tel:${fac.phone}`}
                      className="p-1.5 rounded bg-slate-800 text-teal-400 hover:bg-slate-700 shrink-0"
                      title="Call Facility"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
                <div className="mt-2 text-[10px] text-slate-500 font-mono">
                  {fac.operatingHours} · Verified
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom 2 Columns: Community Feed + Emergency Hotline Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Recent Community Feed */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Recent Community Safety Feed</span>
            </h3>
            <button
              onClick={() => onNavigate('incidents')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium"
            >
              Report / Review
            </button>
          </div>

          <div className="space-y-3">
            {incidents.slice(0, 2).map((inc) => (
              <div key={inc._id} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{inc.category}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(inc.occurredAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{inc.description}</p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Near: {inc.location.approximateAddress} · {inc.reviewStatus}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency & Helpline Directory */}
        <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-rose-400" />
              <span>Emergency & Crisis Contacts</span>
            </h3>
            <p className="text-xs text-slate-400">
              Direct access to public emergency services and dedicated women's support hotlines for {city.name}.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href={`tel:${city.emergencyNumber}`}
              className="flex items-center justify-between p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 hover:bg-rose-900/40 transition-colors"
            >
              <div>
                <span className="text-xs font-bold text-rose-300">Emergency Police / Medical</span>
                <div className="text-[11px] text-rose-400 font-mono">Dial {city.emergencyNumber} directly</div>
              </div>
              <PhoneCall className="w-4 h-4 text-rose-400" />
            </a>

            <a
              href={`tel:${city.helplineNumber}`}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              <div>
                <span className="text-xs font-semibold text-slate-200">{city.helplineName}</span>
                <div className="text-[11px] text-teal-400 font-mono">{city.helplineNumber}</div>
              </div>
              <PhoneCall className="w-4 h-4 text-teal-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
