import React, { useState, useEffect } from 'react';
import {
  Trip,
  TripCheckin,
  SafetyEvent,
  CityConfig,
  CITIES,
} from '../lib/types.ts';
import { soundController } from '../lib/audio.ts';
import {
  Radio,
  Clock,
  Shield,
  AlertTriangle,
  PhoneCall,
  CheckCircle2,
  BellRing,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface GuardianViewProps {
  activeTrip: Trip | null;
  onRefreshTrip: () => void;
  onCompleteTrip: () => void;
  onNavigate: (view: string) => void;
}

export const GuardianView: React.FC<GuardianViewProps> = ({
  activeTrip,
  onRefreshTrip,
  onCompleteTrip,
  onNavigate,
}) => {
  const city = activeTrip ? CITIES[activeTrip.city] : CITIES.karur;

  // State Machine: 'IDLE' | 'ACTIVE' | 'CHECKIN_DUE' | 'ALERT_PENDING' | 'ALERT_SIMULATED' | 'RESOLVED'
  const [guardianState, setGuardianState] = useState<
    'IDLE' | 'ACTIVE' | 'CHECKIN_DUE' | 'ALERT_PENDING' | 'ALERT_SIMULATED' | 'RESOLVED'
  >(activeTrip?.status === 'ACTIVE' ? 'ACTIVE' : 'IDLE');

  const [secondsRemaining, setSecondsRemaining] = useState<number>(300); // 5 min default
  const [sosCountdown, setSosCountdown] = useState<number>(10); // 10s cancellation window
  const [isSirenMuted, setIsSirenMuted] = useState<boolean>(false);
  const [checkins, setCheckins] = useState<TripCheckin[]>([]);
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [simulatedSmsList, setSimulatedSmsList] = useState<
    Array<{ name: string; phone: string; status: string; message: string; time: string }>
  >([]);
  const [loadingAction, setLoadingAction] = useState(false);

  // Load journey details if active
  useEffect(() => {
    if (activeTrip) {
      setGuardianState('ACTIVE');
      fetchTripDetails();
    } else {
      setGuardianState('IDLE');
    }
  }, [activeTrip]);

  async function fetchTripDetails() {
    if (!activeTrip) return;
    try {
      const res = await fetch(`/api/trips/${activeTrip._id}`);
      const data = await res.json();
      if (data.success) {
        setCheckins(data.data.checkins || []);
        setEvents(data.data.events || []);

        // Compute seconds remaining from nextCheckinDueAt
        if (data.data.nextCheckinDueAt) {
          const diff = Math.max(
            0,
            Math.round(
              (new Date(data.data.nextCheckinDueAt).getTime() - Date.now()) / 1000
            )
          );
          setSecondsRemaining(diff > 0 ? diff : 60);
        }
      }
    } catch (e) {
      console.error('Failed to fetch trip details:', e);
    }
  }

  // Active Countdown Timer
  useEffect(() => {
    if (guardianState !== 'ACTIVE' && guardianState !== 'CHECKIN_DUE') return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setGuardianState('CHECKIN_DUE');
          soundController.playWarningChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [guardianState]);

  // SOS Countdown Timer when in ALERT_PENDING
  useEffect(() => {
    if (guardianState !== 'ALERT_PENDING') return;

    const sosTimer = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev <= 1) {
          triggerSimulatedEscalation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(sosTimer);
  }, [guardianState]);

  // Trigger simulated alert escalation
  async function triggerSimulatedEscalation() {
    setGuardianState('ALERT_SIMULATED');
    if (!isSirenMuted) {
      soundController.startSiren();
    }

    try {
      const res = await fetch('/api/safety/simulate-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: activeTrip?._id,
          alertType: 'SOS',
          note: 'Guardian check-in window elapsed or panic SOS triggered',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSimulatedSmsList(data.data.simulatedSmsBroadcast || []);
        fetchTripDetails();
      }
    } catch (e) {
      console.error('Failed to trigger alert simulation:', e);
    }
  }

  // Record Check-In
  const handleCheckInNow = async () => {
    if (!activeTrip) return;
    try {
      setLoadingAction(true);
      const res = await fetch(`/api/trips/${activeTrip._id}/checkin`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        soundController.playCheckinSuccess();
        setGuardianState('ACTIVE');
        // Reset countdown to trip interval
        const intervalSec = (activeTrip.checkinIntervalMinutes || 10) * 60;
        setSecondsRemaining(intervalSec);
        fetchTripDetails();
        onRefreshTrip();
      }
    } catch (e) {
      console.error('Checkin error:', e);
    } finally {
      setLoadingAction(false);
    }
  };

  // Simulate SOS Button Press
  const handleTriggerSos = () => {
    setSosCountdown(10);
    setGuardianState('ALERT_PENDING');
    soundController.playWarningChime();
  };

  // Cancel Alert before escalation
  const handleCancelAlert = async () => {
    soundController.stopSiren();
    setGuardianState('ACTIVE');
    if (activeTrip) {
      await fetch('/api/safety/simulate-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: activeTrip._id,
          alertType: 'CANCEL',
          note: 'User cancelled alert countdown in time',
        }),
      });
      fetchTripDetails();
    }
  };

  // Resolve Alert after escalation
  const handleResolveAlert = async () => {
    soundController.stopSiren();
    setGuardianState('RESOLVED');
    if (activeTrip) {
      await fetch('/api/safety/simulate-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: activeTrip._id,
          alertType: 'RESOLVE',
          note: 'User confirmed safe status and resolved alert',
        }),
      });
      fetchTripDetails();
    }
  };

  // Complete Trip Safely
  const handleFinishTrip = async () => {
    if (!activeTrip) return;
    try {
      soundController.stopSiren();
      await fetch(`/api/trips/${activeTrip._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      soundController.playCheckinSuccess();
      onCompleteTrip();
    } catch (e) {
      console.error('Error completing trip:', e);
    }
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono text-teal-400 uppercase tracking-wider mb-1">
            Active Commute Accompaniment
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Journey Guardian Monitor
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Active state machine monitoring your commute timeline with timed check-in countdowns.
          </p>
        </div>

        {activeTrip && (
          <button
            onClick={handleFinishTrip}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>I Have Arrived Safely</span>
          </button>
        )}
      </div>

      {/* No Active Journey State */}
      {!activeTrip && (
        <div className="p-10 rounded-2xl bg-[#0f172a] border border-slate-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Monitored Journey Active</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            The Journey Guardian state machine requires an active trip. Launch a journey from the planner to begin monitored check-in countdowns.
          </p>
          <button
            onClick={() => onNavigate('planner')}
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
          >
            Launch Journey Planner
          </button>
        </div>
      )}

      {/* Active Journey View */}
      {activeTrip && (
        <div className="space-y-6">
          {/* Active Trip Header Info */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400">
                Current Corridor · {city.name}
              </span>
              <h3 className="text-sm font-bold text-white">
                {activeTrip.origin.name} → {activeTrip.destination.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Interval: every {activeTrip.checkinIntervalMinutes} mins · Route Readiness: {activeTrip.routeReadinessScore}/100
              </p>
            </div>

            {/* Quick Siren Mute Toggle */}
            <button
              onClick={() => {
                if (!isSirenMuted) soundController.stopSiren();
                setIsSirenMuted(!isSirenMuted);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white"
            >
              {isSirenMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-teal-400" />}
              <span>{isSirenMuted ? 'Siren Muted' : 'Siren Sound Armed'}</span>
            </button>
          </div>

          {/* MAIN GUARDIAN HERO CARD */}
          <div
            className={`p-6 sm:p-8 rounded-2xl border transition-all text-center space-y-6 ${
              guardianState === 'ALERT_SIMULATED'
                ? 'bg-rose-950/40 border-rose-600 shadow-2xl shadow-rose-900/30'
                : guardianState === 'ALERT_PENDING'
                ? 'bg-amber-950/40 border-amber-500 shadow-xl'
                : guardianState === 'CHECKIN_DUE'
                ? 'bg-amber-950/20 border-amber-500/50'
                : 'bg-[#0f172a] border-teal-500/30'
            }`}
          >
            {/* Status State Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider">
              {guardianState === 'ACTIVE' && (
                <span className="text-teal-400 bg-teal-950/80 px-3 py-1 rounded-full border border-teal-500/30">
                  ● ACTIVE MONITORING
                </span>
              )}
              {guardianState === 'CHECKIN_DUE' && (
                <span className="text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/30">
                  ▲ CHECK-IN DUE NOW
                </span>
              )}
              {guardianState === 'ALERT_PENDING' && (
                <span className="text-amber-300 bg-amber-900/90 px-3 py-1 rounded-full border border-amber-400">
                  ⚠ SOS ESCALATION IN {sosCountdown}S
                </span>
              )}
              {guardianState === 'ALERT_SIMULATED' && (
                <span className="text-rose-200 bg-rose-900/90 px-3 py-1 rounded-full border border-rose-500 animate-pulse">
                  🚨 SIMULATED EMERGENCY ALERT ACTIVE
                </span>
              )}
              {guardianState === 'RESOLVED' && (
                <span className="text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/30">
                  ✓ ALERT RESOLVED · ALL CLEAR
                </span>
              )}
            </div>

            {/* Radial / Large Digital Countdown */}
            {guardianState === 'ALERT_PENDING' ? (
              <div className="space-y-2">
                <div className="text-6xl font-black font-mono text-amber-300 tabular-nums">
                  00:{sosCountdown < 10 ? `0${sosCountdown}` : sosCountdown}
                </div>
                <p className="text-xs text-amber-200">
                  Countdown to simulated SMS dispatch to trusted contacts. Press cancel if false alarm.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleCancelAlert}
                    className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-600 cursor-pointer"
                  >
                    Cancel Alert (I am Safe)
                  </button>
                </div>
              </div>
            ) : guardianState === 'ALERT_SIMULATED' ? (
              <div className="space-y-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-rose-300">
                  Simulated SOS Dispatched to Trusted Contacts
                </div>
                <p className="text-xs text-rose-200/90 max-w-lg mx-auto leading-relaxed">
                  Simulated SMS notifications and live location logs have been dispatched to your verified contact list. Dial emergency if immediate physical intervention is required.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href={`tel:${city.emergencyNumber}`}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Police ({city.emergencyNumber})</span>
                  </a>

                  <button
                    onClick={handleResolveAlert}
                    className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer"
                  >
                    Resolve Alert (Status Clear)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-5xl sm:text-6xl font-black font-mono text-white tabular-nums">
                  {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                </div>
                <p className="text-xs text-slate-400">
                  Time until next scheduled safety check-in.
                </p>

                {/* Primary Action Button */}
                <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
                  <button
                    onClick={handleCheckInNow}
                    disabled={loadingAction}
                    className="px-8 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-teal-500/20 transition-all hover:scale-105 flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                    <span>I'm Safe · Check In Now</span>
                  </button>

                  <button
                    onClick={handleTriggerSos}
                    className="px-5 py-3.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 font-bold text-xs rounded-xl border border-rose-800/80 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>SOS Panic Button</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Simulated SMS Dispatch Audit Trail */}
          {simulatedSmsList.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-teal-400" />
                  <span>Simulated SMS Dispatch Audit Trail</span>
                </h4>
                <span className="text-[10px] font-mono text-slate-400">
                  {simulatedSmsList.length} Messages Dispatched
                </span>
              </div>

              <div className="space-y-2">
                {simulatedSmsList.map((sms, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="font-semibold text-teal-300">{sms.name} ({sms.phone})</span>
                      <span className="font-mono text-[10px] text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/40">
                        {sms.status}
                      </span>
                    </div>
                    <p className="text-slate-400 font-mono text-[11px] leading-relaxed">
                      "{sms.message}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline of Logged Check-Ins & Events */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Check-In History */}
            <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Trip Check-In History</span>
              </h4>

              {checkins.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-4 text-center">
                  No check-ins logged yet for this journey.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {checkins.map((chk) => (
                    <div
                      key={chk._id}
                      className="p-2.5 rounded bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-200">
                          Checkpoint #{chk.checkpointNumber}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {chk.checkedInAt
                            ? new Date(chk.checkedInAt).toLocaleTimeString()
                            : 'Pending'}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          chk.status === 'ON_TIME'
                            ? 'text-emerald-400 bg-emerald-950/80'
                            : 'text-amber-400 bg-amber-950/80'
                        }`}
                      >
                        {chk.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Safety Audit Events */}
            <div className="p-4 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                <span>Safety Event Audit Log</span>
              </h4>

              {events.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-4 text-center">
                  No safety events recorded.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {events.map((evt) => (
                    <div
                      key={evt._id}
                      className="p-2.5 rounded bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-200">{evt.eventType}</span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(evt.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {evt.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Browser Timer Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 leading-relaxed text-center">
            Notice: Web browser security restricts background thread execution when tabs are inactive. Keep this tab active or pinned to ensure timely audio warnings and countdown triggers.
          </div>
        </div>
      )}
    </div>
  );
};
