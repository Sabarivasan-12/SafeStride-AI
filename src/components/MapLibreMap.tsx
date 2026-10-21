import React, { useState, useMemo } from 'react';
import { SafetyFacility, CityConfig, IncidentReport } from '../lib/types.ts';
import {
  Shield,
  Plus,
  Minus,
  RotateCcw,
  PhoneCall,
  MapPin,
  Building2,
  AlertTriangle,
  Train,
  Cross,
} from 'lucide-react';

interface MapLibreMapProps {
  city: CityConfig;
  facilities?: SafetyFacility[];
  incidents?: IncidentReport[];
  origin?: { name: string; coordinates: [number, number] };
  destination?: { name: string; coordinates: [number, number] };
  routeCoordinates?: [number, number][];
  onSelectFacility?: (facility: SafetyFacility) => void;
  className?: string;
  zoom?: number;
}

/**
 * Slippy Map Tile Coordinate Calculations (Web Mercator Projection)
 */
function lon2tile(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}

function lat2tile(lat: number, zoom: number): number {
  return (
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
    Math.pow(2, zoom)
  );
}

export const MapLibreMap: React.FC<MapLibreMapProps> = ({
  city,
  facilities = [],
  incidents = [],
  origin,
  destination,
  routeCoordinates,
  onSelectFacility,
  className = 'h-96 w-full',
}) => {
  const [currentZoom, setCurrentZoom] = useState<number>(14);
  const [selectedItem, setSelectedItem] = useState<{
    title: string;
    type: string;
    desc: string;
    phone?: string;
    coords: [number, number];
  } | null>(null);

  const centerLng = city.center[0];
  const centerLat = city.center[1];

  // Tile grid bounds (3x3 tile grid centered on the city coordinate)
  const centerTileX = lon2tile(centerLng, currentZoom);
  const centerTileY = lat2tile(centerLat, currentZoom);

  // Convert GPS [lng, lat] to pixel offset relative to center of the 3x3 viewport
  const coordsToPercent = (coords: [number, number]): { x: number; y: number } => {
    const tileX = lon2tile(coords[0], currentZoom);
    const tileY = lat2tile(coords[1], currentZoom);
    // Span is 3 tiles = 768px virtual box
    const percentX = 50 + (tileX - centerTileX) * 33.33;
    const percentY = 50 + (tileY - centerTileY) * 33.33;
    return {
      x: Math.max(2, Math.min(98, percentX)),
      y: Math.max(2, Math.min(98, percentY)),
    };
  };

  const originProj = origin ? coordsToPercent(origin.coordinates) : null;
  const destProj = destination ? coordsToPercent(destination.coordinates) : null;

  // Calculate tiles needed for 3x3 grid around center
  const baseTileX = Math.floor(centerTileX);
  const baseTileY = Math.floor(centerTileY);

  const tileGrid = useMemo(() => {
    const tiles: Array<{ x: number; y: number; url: string }> = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = baseTileX + dx;
        const ty = baseTileY + dy;
        tiles.push({
          x: dx,
          y: dy,
          url: `https://tile.openstreetmap.org/${currentZoom}/${tx}/${ty}.png`,
        });
      }
    }
    return tiles;
  }, [baseTileX, baseTileY, currentZoom]);

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-slate-800 bg-[#090D16] select-none ${className}`}
    >
      {/* Real OpenStreetMap Raster Tile Grid with sleek dark mode filter */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-45">
        <div
          className="absolute w-[300%] h-[300%] -left-[100%] -top-[100%] grid grid-cols-3 grid-rows-3"
          style={{
            filter: 'invert(100%) hue-rotate(180deg) brightness(80%) contrast(110%)',
          }}
        >
          {tileGrid.map((tile, idx) => (
            <img
              key={`${tile.url}-${idx}`}
              src={tile.url}
              alt="OpenStreetMap Tile"
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                // If an OSM tile fails, hide image cleanly without breaking layout
                (e.target as HTMLElement).style.opacity = '0';
              }}
            />
          ))}
        </div>
      </div>

      {/* Subtle midnight overlay and technical grid lines */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090D16]/90 via-[#090D16]/20 to-[#090D16]/60 pointer-events-none z-1" />

      {/* Interactive Vector Overlay Layer */}
      <svg
        className="absolute inset-0 w-full h-full z-10 pointer-events-auto"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="routeStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Route Line */}
        {originProj && destProj && (
          <g>
            {/* Glowing route corridor buffer */}
            <line
              x1={originProj.x}
              y1={originProj.y}
              x2={destProj.x}
              y2={destProj.y}
              stroke="url(#routeGlow)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            {/* Crisp dashed center line */}
            <line
              x1={originProj.x}
              y1={originProj.y}
              x2={destProj.x}
              y2={destProj.y}
              stroke="url(#routeStroke)"
              strokeWidth="0.9"
              strokeDasharray="2, 1"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Origin Marker */}
        {originProj && (
          <g transform={`translate(${originProj.x}, ${originProj.y})`}>
            <circle r="3.0" fill="#10b981" fillOpacity="0.25" />
            <circle r="1.5" fill="#10b981" stroke="#090d16" strokeWidth="0.4" />
            <circle r="0.6" fill="#ffffff" />
          </g>
        )}

        {/* Destination Marker */}
        {destProj && (
          <g transform={`translate(${destProj.x}, ${destProj.y})`}>
            <circle r="3.0" fill="#14b8a6" fillOpacity="0.25" />
            <circle r="1.5" fill="#14b8a6" stroke="#090d16" strokeWidth="0.4" />
            <circle r="0.6" fill="#ffffff" />
          </g>
        )}

        {/* Support Facilities Pins */}
        {facilities.map((fac) => {
          const p = coordsToPercent(fac.location.coordinates);
          let fillColor = '#3b82f6'; // Police (Blue)
          if (fac.facilityType === 'pharmacy_247') fillColor = '#10b981'; // Pharmacy (Mint)
          if (fac.facilityType === 'safe_haven') fillColor = '#14b8a6'; // Shelter (Teal)
          if (fac.facilityType === 'transit_hub') fillColor = '#a855f7'; // Transit (Purple)

          return (
            <g
              key={fac._id}
              transform={`translate(${p.x}, ${p.y})`}
              className="cursor-pointer transition-transform hover:scale-125"
              onClick={() => {
                setSelectedItem({
                  title: fac.name,
                  type: fac.facilityType.replace('_', ' ').toUpperCase(),
                  desc: `${fac.address} · ${fac.operatingHours}`,
                  phone: fac.phone,
                  coords: fac.location.coordinates,
                });
                if (onSelectFacility) onSelectFacility(fac);
              }}
            >
              <circle r="2.2" fill={fillColor} fillOpacity="0.3" />
              <circle r="1.2" fill={fillColor} stroke="#090d16" strokeWidth="0.3" />
              <circle r="0.4" fill="#ffffff" />
            </g>
          );
        })}

        {/* Incident Notice Markers */}
        {incidents.map((inc) => {
          const p = coordsToPercent(inc.location.coordinates);
          return (
            <g
              key={inc._id}
              transform={`translate(${p.x}, ${p.y})`}
              className="cursor-pointer transition-transform hover:scale-125"
              onClick={() => {
                setSelectedItem({
                  title: `Community Notice: ${inc.category}`,
                  type: inc.reviewStatus,
                  desc: `${inc.location.approximateAddress} · ${inc.description}`,
                  coords: inc.location.coordinates,
                });
              }}
            >
              <circle r="2.0" fill="#f59e0b" fillOpacity="0.3" />
              <circle r="1.0" fill="#f59e0b" stroke="#090d16" strokeWidth="0.25" />
            </g>
          );
        })}
      </svg>

      {/* Top Overlay Badge & Telemetry */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs font-medium text-slate-200 shadow-lg pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-teal-400"></span>
          <span>{city.name} Corridor</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {facilities.length} Verified Havens
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/60 shadow-lg pointer-events-auto">
          <button
            onClick={() => setCurrentZoom((z) => Math.min(16, z + 1))}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentZoom((z) => Math.max(12, z - 1))}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentZoom(city.zoom || 14)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selected Facility / Incident Toast Box */}
      {selectedItem && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-30 pointer-events-auto bg-slate-900/95 border border-teal-500/50 p-3.5 rounded-xl shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400 font-bold block">
                {selectedItem.type}
              </span>
              <h4 className="text-xs font-bold text-white">{selectedItem.title}</h4>
              <p className="text-[11px] text-slate-300 leading-normal">{selectedItem.desc}</p>
              {selectedItem.phone && (
                <a
                  href={`tel:${selectedItem.phone}`}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-teal-300 hover:text-teal-200 mt-1.5 underline"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Call: {selectedItem.phone}</span>
                </a>
              )}
            </div>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Attribution Footer */}
      <div className="absolute bottom-2 right-3 z-10 text-[9px] font-mono text-slate-500 pointer-events-none">
        OpenStreetMap Cartography · WGS84
      </div>
    </div>
  );
};
