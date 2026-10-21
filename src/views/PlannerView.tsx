import React, { useState, useEffect } from 'react';
import {
  CITIES,
  CityId,
  SafetyFacility,
  IncidentReport,
  RouteAssessment,
  JourneyAdviceResponse,
  Trip,
} from '../lib/types.ts';
import {
  calculateRouteReadiness,
  calculateDistanceKm,
  ROUTE_DISCLAIMER,
} from '../lib/scoring/readiness.ts';
import {
  Navigation,
  ArrowUpDown,
  Shield,
  Sparkles,
  AlertTriangle,
  Clock,
  Compass,
  CheckCircle2,
  FileQuestion,
  Play,
  RotateCcw,
} from 'lucide-react';
import { MapLibreMap } from '../components/MapLibreMap.tsx';

interface PlannerViewProps {
  currentCityId: CityId;
  onStartJourney: (trip: Trip) => void;
  onNavigate: (view: string) => void;
}

export const PlannerView: React.FC<PlannerViewProps> = ({
  currentCityId,
  onStartJourney,
  onNavigate,
}) => {
  const city = CITIES[currentCityId];

  const [originName, setOriginName] = useState(city.defaultOrigin.name);
  const [originCoords, setOriginCoords] = useState<[number, number]>(city.defaultOrigin.coordinates);
  const [destName, setDestName] = useState(city.defaultDestination.name);
  const [destCoords, setDestCoords] = useState<[number, number]>(city.defaultDestination.coordinates);

  const [facilities, setFacilities] = useState<SafetyFacility[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [assessment, setAssessment] = useState<RouteAssessment | null>(null);
  const [advice, setAdvice] = useState<JourneyAdviceResponse | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [checkinInterval, setCheckinInterval] = useState(10);
  const [isStartingTrip, setIsStartingTrip] = useState(false);

  // Sync inputs when city changes
  useEffect(() => {
    setOriginName(city.defaultOrigin.name);
    setOriginCoords(city.defaultOrigin.coordinates);
    setDestName(city.defaultDestination.name);
    setDestCoords(city.defaultDestination.coordinates);
    setAdvice(null);
  }, [currentCityId]);

  // Load facilities and incidents
  useEffect(() => {
    async function fetchData() {
      try {
        const [facRes, incRes] = await Promise.all([
          fetch(`/api/facilities?city=${currentCityId}`),
          fetch(`/api/incidents?city=${currentCityId}`),
        ]);
        const facData = await facRes.json();
        const incData = await incRes.json();
        if (facData.success) setFacilities(facData.data);
        if (incData.success) setIncidents(incData.data);
      } catch (e) {
        console.error('Error fetching planner data:', e);
      }
    }
    fetchData();
  }, [currentCityId]);

  // Generate intermediate route polyline points
  const routePoints: [number, number][] = [
    originCoords,
    [
      originCoords[0] + (destCoords[0] - originCoords[0]) * 0.33,
      originCoords[1] + (destCoords[1] - originCoords[1]) * 0.33,
    ],
    [
      originCoords[0] + (destCoords[0] - originCoords[0]) * 0.66,
      originCoords[1] + (destCoords[1] - originCoords[1]) * 0.66,
    ],
    destCoords,
  ];

  // Re-run deterministic assessment whenever inputs or facilities change
  useEffect(() => {
    if (originCoords && destCoords) {
      const res = calculateRouteReadiness({
        originCoords,
        destinationCoords: destCoords,
        routeCoordinates: routePoints,
        facilities,
        recentIncidents: incidents,
      });
      setAssessment(res);
    }
  }, [originCoords, destCoords, facilities, incidents]);

  // Distance & Walking Duration
  const distKm = calculateDistanceKm(originCoords, destCoords);
  const durationMins = Math.round((distKm / 4.5) * 60);

  // Swap origin and destination
  const handleSwap = () => {
    const tempName = originName;
    const tempCoords = originCoords;
    setOriginName(destName);
    setOriginCoords(destCoords);
    setDestName(tempName);
    setDestCoords(tempCoords);
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          setOriginName('My Current Location (GPS)');
          setOriginCoords(coords);
        },
        (err) => {
          alert('Location permission was denied or unavailable. Using default origin.');
        }
      );
    }
  };

  // Fetch Server-Side Gemini AI Advice
  const handleGetAiAdvice = async () => {
    try {
      setLoadingAdvice(true);
      const res = await fetch('/api/ai/journey-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: originName,
          destination: destName,
          cityId: currentCityId,
          routeScore: assessment?.score || 75,
          distanceKm: distKm,
          durationMins,
          nearbyFacilityCount: assessment?.factors.facilityCountNearby || 3,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdvice(data.data);
      }
    } catch (e) {
      console.error('Failed to get Gemini advice:', e);
    } finally {
      setLoadingAdvice(false);
    }
  };

  // Launch Monitored Journey
  const handleStartMonitoredJourney = async () => {
    try {
      setIsStartingTrip(true);
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: { name: originName, coordinates: originCoords },
          destination: { name: destName, coordinates: destCoords },
          city: currentCityId,
          checkinIntervalMinutes: checkinInterval,
          routeGeometry: {
            type: 'LineString',
            coordinates: routePoints,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Start journey immediately
        const trip = data.data;
        await fetch(`/api/trips/${trip._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ACTIVE' }),
        });
        trip.status = 'ACTIVE';
        onStartJourney(trip);
        onNavigate('guardian');
      }
    } catch (err) {
      console.error('Error starting journey:', err);
    } finally {
      setIsStartingTrip(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* View Title */}
      <div>
        <div className="text-xs font-mono text-teal-400 uppercase tracking-wider mb-1">
          Commute Intelligence · {city.name}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Journey Planner & Route Readiness
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Evaluate pedestrian and transit routes against 4 verified safety evidence factors before you step out.
        </p>
      </div>

      {/* Origin / Destination Search Bar */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
          {/* Origin */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Departure Point (Origin)</span>
              <button
                onClick={handleUseCurrentLocation}
                className="text-[11px] text-teal-400 hover:text-teal-300 font-medium cursor-pointer"
              >
                Use GPS location
              </button>
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700/80">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
              <input
                type="text"
                value={originName}
                onChange={(e) => setOriginName(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                placeholder="Enter starting location..."
              />
            </div>
          </div>

          {/* Destination */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Arrival Point (Destination)
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700/80">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0"></span>
              <input
                type="text"
                value={destName}
                onChange={(e) => setDestName(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                placeholder="Enter destination location..."
              />
            </div>
          </div>
        </div>

        {/* Route Controls: Swap + Check-in interval */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <button
            onClick={handleSwap}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Reverse Route</span>
          </button>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 font-medium">
              Guardian Check-In Interval:
            </label>
            <select
              value={checkinInterval}
              onChange={(e) => setCheckinInterval(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value={1}>1 min (Demo Rapid Mode)</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes (Recommended)</option>
              <option value={15}>15 minutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Route Readiness Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Map */}
        <div className="lg:col-span-7 space-y-4">
          <MapLibreMap
            city={city}
            facilities={facilities}
            incidents={incidents}
            origin={{ name: originName, coordinates: originCoords }}
            destination={{ name: destName, coordinates: destCoords }}
            routeCoordinates={routePoints}
            className="h-[420px] w-full"
          />

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
            <span>Route Distance: {distKm.toFixed(2)} km</span>
            <span>Est. Walking Duration: ~{durationMins} mins</span>
            <span className="text-teal-400">Transit Buffer: 500m</span>
          </div>
        </div>

        {/* Right: Route Readiness Card */}
        <div className="lg:col-span-5 space-y-4">
          {assessment && (
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-5">
              {/* Score Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Route Readiness Index</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-4xl font-extrabold font-mono text-white tabular-nums">
                      {assessment.score}
                    </span>
                    <span className="text-sm font-mono text-slate-400">/ 100</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 block">
                    Evidence Confidence
                  </span>
                  <span className="text-sm font-mono font-bold text-teal-300">
                    {assessment.confidence}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    assessment.score >= 75
                      ? 'bg-teal-400'
                      : assessment.score >= 60
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                  style={{ width: `${assessment.score}%` }}
                />
              </div>

              {/* Factor Breakdown (0.30F + 0.25T + 0.25L + 0.20D) */}
              <div className="space-y-2.5 pt-1">
                <span className="text-xs font-semibold text-slate-300 block">
                  Deterministic Factor Breakdown
                </span>

                <div className="space-y-2 text-xs">
                  {/* F */}
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-300">
                      Support Facilities (30%):{' '}
                      <span className="text-slate-400 font-mono">
                        {assessment.factors.facilityCountNearby} havens
                      </span>
                    </span>
                    <span className="font-mono text-teal-400 font-semibold">
                      {assessment.factors.facilitiesScore}
                    </span>
                  </div>

                  {/* T */}
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-300">
                      Public Transit Proximity (25%):{' '}
                      <span className="text-slate-400 font-mono">
                        {assessment.factors.transitStopsNearby} hubs
                      </span>
                    </span>
                    <span className="font-mono text-purple-400 font-semibold">
                      {assessment.factors.transitScore}
                    </span>
                  </div>

                  {/* L */}
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-300">Street Lighting Data (25%)</span>
                    <span className="font-mono text-amber-400 font-semibold">
                      {assessment.factors.lightingScore}
                    </span>
                  </div>

                  {/* D */}
                  <div className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-300">
                      Community Data Freshness (20%):{' '}
                      <span className="text-slate-400 font-mono">
                        {assessment.factors.freshReportsCount} alerts
                      </span>
                    </span>
                    <span className="font-mono text-blue-400 font-semibold">
                      {assessment.factors.dataFreshnessScore}
                    </span>
                  </div>
                </div>
              </div>

              {/* Missing Factors Notice if any */}
              {assessment.missingFactors.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-300 space-y-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <FileQuestion className="w-3.5 h-3.5" />
                    Provisional / Missing Data Layers:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-amber-200/80">
                    {assessment.missingFactors.map((m, idx) => (
                      <li key={idx}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Narrative Summary */}
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{assessment.explanation}"
              </p>

              {/* CTA: Start Monitored Journey */}
              <button
                onClick={handleStartMonitoredJourney}
                disabled={isStartingTrip}
                className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 text-slate-950 fill-current" />
                <span>{isStartingTrip ? 'Starting Trip...' : 'Start Monitored Journey'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gemini AI Journey Advice Panel */}
      <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-950 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Gemini AI Commute Preparation Assistant
              </h3>
              <p className="text-xs text-slate-400">
                Generate practical pre-trip safety checklists tailored to this specific corridor.
              </p>
            </div>
          </div>

          <button
            onClick={handleGetAiAdvice}
            disabled={loadingAdvice}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loadingAdvice ? 'Analyzing Route...' : advice ? 'Refresh Advice' : 'Generate Journey Advice'}</span>
          </button>
        </div>

        {advice && (
          <div className="pt-2 space-y-4 border-t border-slate-800">
            <p className="text-xs text-slate-200 leading-relaxed">
              {advice.routeSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Checklist */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-teal-400 block">
                  Recommended Pre-Departure Checklist
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {advice.preparationChecklist.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Checkpoints */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-semibold text-purple-400 block">
                  Suggested Guardian Checkpoints
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {advice.recommendedCheckpoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Compass className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              {advice.disclaimer}
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Disclaimer */}
      <div className="text-center text-xs text-slate-500 py-2">
        {ROUTE_DISCLAIMER}
      </div>
    </div>
  );
};
