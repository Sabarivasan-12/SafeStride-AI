import React, { useState, useEffect } from 'react';
import {
  CITIES,
  CityId,
  SafetyFacility,
  FacilityType,
} from '../lib/types.ts';
import { calculateDistanceKm } from '../lib/scoring/readiness.ts';
import {
  Building2,
  Shield,
  Cross,
  Train,
  HeartHandshake,
  Search,
  PhoneCall,
  ExternalLink,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { MapLibreMap } from '../components/MapLibreMap.tsx';

interface FacilitiesViewProps {
  currentCityId: CityId;
}

export const FacilitiesView: React.FC<FacilitiesViewProps> = ({ currentCityId }) => {
  const city = CITIES[currentCityId];
  const [facilities, setFacilities] = useState<SafetyFacility[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFacilities() {
      try {
        setLoading(true);
        const res = await fetch(`/api/facilities?city=${currentCityId}`);
        const data = await res.json();
        if (data.success) {
          setFacilities(data.data);
        }
      } catch (err) {
        console.error('Failed to load facilities:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFacilities();
  }, [currentCityId]);

  const filtered = facilities.filter((f) => {
    const matchesType = selectedType === 'all' || f.facilityType === selectedType;
    const matchesSearch =
      searchQuery === '' ||
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono text-teal-400 uppercase tracking-wider mb-1">
            Verified Support Network · {city.name}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Safe Havens & Support Facilities Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            24/7 staffed safe shelters, police precincts, well-lit pharmacies, and transit hubs across the metropolitan corridor.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
          Total Registered: <span className="text-teal-400 font-bold">{facilities.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search facility name or street address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {/* Category Tabs (Functional Buttons) */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Safe Havens' },
            { id: 'safe_haven', label: 'Safe Shelters' },
            { id: 'pharmacy_247', label: '24/7 Pharmacies' },
            { id: 'police', label: 'Police Stations' },
            { id: 'transit_hub', label: 'Transit Hubs' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedType(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                selectedType === cat.id
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Map Preview + Facility Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Map Preview */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Corridor Spatial Distribution
          </h3>
          <MapLibreMap
            city={city}
            facilities={filtered}
            className="h-[460px] w-full"
          />
        </div>

        {/* Right: Facilities List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Showing {filtered.length} Facilities
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Attributed from City Open Data Registries
            </span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
            {filtered.map((fac) => {
              const dist = calculateDistanceKm(city.center, fac.location.coordinates);

              return (
                <div
                  key={fac._id}
                  className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-colors space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold">
                          {fac.facilityType.replace('_', ' ')}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-[11px] font-mono text-slate-400">
                          ~{dist.toFixed(1)} km from city center
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{fac.name}</h4>
                      <p className="text-xs text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{fac.address}</span>
                      </p>
                    </div>

                    {fac.phone && (
                      <a
                        href={`tel:${fac.phone}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-950/80 border border-teal-500/40 text-teal-300 hover:bg-teal-900/80 text-xs font-semibold shrink-0"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Call</span>
                      </a>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{fac.operatingHours}</span>
                    </div>

                    <div className="text-slate-500">
                      Source: {fac.sourceName}
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 rounded-xl bg-[#0f172a] border border-slate-800">
                No facilities matching your search in {city.name}.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
