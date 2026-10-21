import React, { useState, useEffect } from 'react';
import { CityId, CITIES, Trip } from './lib/types.ts';
import { auth, onAuthStateChanged, FirebaseUser } from './lib/firebase.ts';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { LandingView } from './views/LandingView.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { PlannerView } from './views/PlannerView.tsx';
import { GuardianView } from './views/GuardianView.tsx';
import { FacilitiesView } from './views/FacilitiesView.tsx';
import { IncidentsView } from './views/IncidentsView.tsx';
import { ContactsView } from './views/ContactsView.tsx';
import { EmergencyView } from './views/EmergencyView.tsx';
import { HistoryView } from './views/HistoryView.tsx';
import { SettingsView } from './views/SettingsView.tsx';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [currentCityId, setCurrentCityId] = useState<CityId>('karur');
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Poll or fetch latest active trip on load
  const refreshActiveTrip = async () => {
    try {
      const res = await fetch('/api/trips');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const ongoing = data.data.find(
          (t: Trip) => t.status === 'ACTIVE' || t.status === 'CHECKIN_DUE' || t.status === 'ALERT_PENDING' || t.status === 'ALERT_SIMULATED'
        );
        setActiveTrip(ongoing || null);
      }
    } catch (e) {
      console.error('Failed to refresh trips:', e);
    }
  };

  useEffect(() => {
    refreshActiveTrip();
  }, []);

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans selection:bg-teal-500/20 selection:text-teal-300">
      {/* Top Navbar adhering to Top Bar Contract */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentCityId={currentCityId}
        onSelectCity={(cityId) => setCurrentCityId(cityId)}
        isJourneyActive={Boolean(activeTrip)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        currentUser={currentUser}
      />

      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar (hidden on mobile, and hidden on landing view for clean presentation) */}
        {currentView !== 'landing' && (
          <Sidebar
            currentView={currentView}
            onNavigate={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            activeTrip={activeTrip}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0">
          {currentView === 'landing' && (
            <LandingView
              onNavigate={(view) => setCurrentView(view)}
              currentCityId={currentCityId}
              onSelectCity={(cityId) => setCurrentCityId(cityId)}
            />
          )}

          {currentView === 'dashboard' && (
            <DashboardView
              onNavigate={(view) => setCurrentView(view)}
              currentCityId={currentCityId}
              activeTrip={activeTrip}
              onRefreshTrip={refreshActiveTrip}
            />
          )}

          {currentView === 'planner' && (
            <PlannerView
              currentCityId={currentCityId}
              onStartJourney={(trip) => {
                setActiveTrip(trip);
                setCurrentView('guardian');
              }}
              onNavigate={(view) => setCurrentView(view)}
            />
          )}

          {currentView === 'guardian' && (
            <GuardianView
              activeTrip={activeTrip}
              onRefreshTrip={refreshActiveTrip}
              onCompleteTrip={() => {
                setActiveTrip(null);
                refreshActiveTrip();
                setCurrentView('history');
              }}
              onNavigate={(view) => setCurrentView(view)}
            />
          )}

          {currentView === 'facilities' && (
            <FacilitiesView currentCityId={currentCityId} />
          )}

          {currentView === 'incidents' && (
            <IncidentsView currentCityId={currentCityId} />
          )}

          {currentView === 'contacts' && <ContactsView />}

          {currentView === 'emergency' && (
            <EmergencyView
              currentCityId={currentCityId}
              activeTrip={activeTrip}
              onNavigate={(view) => setCurrentView(view)}
            />
          )}

          {currentView === 'history' && <HistoryView />}

          {currentView === 'settings' && (
            <SettingsView
              onDatabaseReset={() => {
                setActiveTrip(null);
                refreshActiveTrip();
              }}
            />
          )}
        </main>
      </div>

      {/* Global Minimalist Footer */}
      <footer className="border-t border-slate-900 bg-[#070a12] py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">SafeStride AI</span>
            <span>·</span>
            <span>Plan smarter. Travel prepared. Stay connected.</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Prototype Commuter Companion</span>
            <span>·</span>
            <span>Emergency Services Simulated</span>
            <span>·</span>
            <span>Gemini 3.8 Flash Grounded</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
