import React, { useState, useEffect } from 'react';
import {
  CITIES,
  CityId,
  IncidentReport,
  IncidentCategory,
  ReviewStatus,
} from '../lib/types.ts';
import {
  AlertTriangle,
  Plus,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface IncidentsViewProps {
  currentCityId: CityId;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({ currentCityId }) => {
  const city = CITIES[currentCityId];
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModeratorMode, setIsModeratorMode] = useState<boolean>(true); // Demo user has moderator role
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // New report form fields
  const [newCategory, setNewCategory] = useState<IncidentCategory>('LIGHTING');
  const [newApproxAddress, setNewApproxAddress] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadIncidents();
  }, [currentCityId]);

  async function loadIncidents() {
    try {
      const res = await fetch(`/api/incidents?city=${currentCityId}`);
      const data = await res.json();
      if (data.success) {
        setIncidents(data.data);
      }
    } catch (e) {
      console.error('Failed to load incidents:', e);
    }
  }

  // Submit new incident
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription || !newApproxAddress) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          city: currentCityId,
          approximateAddress: newApproxAddress,
          coordinates: city.center,
          description: newDescription,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowSubmitModal(false);
        setNewDescription('');
        setNewApproxAddress('');
        loadIncidents();
      }
    } catch (err) {
      console.error('Error submitting incident:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Moderator Review: Approve or Reject
  const handleReview = async (id: string, newStatus: ReviewStatus) => {
    try {
      const res = await fetch(`/api/incidents/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewStatus: newStatus,
          moderationNotes: `Verified via SafeStride moderator review on ${new Date().toLocaleDateString()}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadIncidents();
      }
    } catch (e) {
      console.error('Error reviewing incident:', e);
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    const matchesCat = categoryFilter === 'ALL' || inc.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || inc.reviewStatus === statusFilter;
    return matchesCat && matchesStatus;
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono text-teal-400 uppercase tracking-wider mb-1">
            Community Intelligence · {city.name}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Community Safety Reports & Moderation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Crowdsourced, verified hazard and commute observations to assist fellow women travelers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-transform hover:scale-105 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Submit Safety Report</span>
          </button>
        </div>
      </div>

      {/* Moderation Toggle & Filter Controls */}
      <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'LIGHTING', 'SUSPICIOUS', 'HAZARD', 'HARASSMENT', 'INFRASTRUCTURE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Moderator Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs">
          <Shield className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-slate-300 font-medium">Moderator Controls:</span>
          <button
            onClick={() => setIsModeratorMode(!isModeratorMode)}
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              isModeratorMode ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {isModeratorMode ? 'ACTIVE' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-4">
        {filteredIncidents.map((inc) => (
          <div
            key={inc._id}
            className={`p-5 rounded-xl border transition-all ${
              inc.reviewStatus === 'APPROVED'
                ? 'bg-[#0f172a] border-slate-800'
                : inc.reviewStatus === 'UNDER_REVIEW'
                ? 'bg-amber-950/20 border-amber-500/40'
                : 'bg-slate-900/40 border-rose-900/40 opacity-70'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-teal-400 uppercase tracking-wide">
                    {inc.category}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(inc.occurredAt).toLocaleString()}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      inc.reviewStatus === 'APPROVED'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                        : inc.reviewStatus === 'UNDER_REVIEW'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                        : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                    }`}
                  >
                    {inc.reviewStatus.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white">
                  {inc.location.approximateAddress}
                </h3>
              </div>

              {/* Moderator Actions */}
              {isModeratorMode && inc.reviewStatus === 'UNDER_REVIEW' && (
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleReview(inc._id, 'APPROVED')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-600 text-emerald-300 text-xs font-semibold hover:bg-emerald-900"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Advisory</span>
                  </button>
                  <button
                    onClick={() => handleReview(inc._id, 'REJECTED')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950 border border-rose-600 text-rose-300 text-xs font-semibold hover:bg-rose-900"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
              {inc.description}
            </p>

            {inc.moderationNotes && (
              <div className="mt-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 font-mono">
                Moderator Note: {inc.moderationNotes}
              </div>
            )}
          </div>
        ))}

        {filteredIncidents.length === 0 && (
          <div className="p-10 text-center text-xs text-slate-400 rounded-xl bg-[#0f172a] border border-slate-800">
            No incident reports matching your criteria in {city.name}.
          </div>
        )}
      </div>

      {/* Submit Incident Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-teal-400" />
                <span>Submit Safety Observation</span>
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as IncidentCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none"
                >
                  <option value="LIGHTING">Street Lighting Outage / Dark Corridor</option>
                  <option value="SUSPICIOUS">Suspicious Activity / Harassment Risk</option>
                  <option value="HAZARD">Walkway Hazard / Construction Obstruction</option>
                  <option value="HARASSMENT">Verbal Harassment / Aggressive Behavior</option>
                  <option value="INFRASTRUCTURE">Transit Infrastructure Defect</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">
                  Approximate Location (Street & Cross Street)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 10th St near Market St, northwest corner"
                  value={newApproxAddress}
                  onChange={(e) => setNewApproxAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what you observed factually to help other commuters..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-300/90 leading-relaxed">
                Notice: Community submissions enter an <span className="font-bold">UNDER_REVIEW</span> state prior to publication. Never submit emergency distress calls here; dial emergency directly if in danger.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
