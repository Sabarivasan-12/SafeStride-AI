import React, { useState, useEffect } from 'react';
import { TrustedContact } from '../lib/types.ts';
import {
  Users,
  Plus,
  Trash2,
  PhoneCall,
  CheckCircle2,
  Clock,
  Shield,
  Send,
  BellRing,
} from 'lucide-react';

export const ContactsView: React.FC = () => {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [notifyOnCheckinMissed, setNotifyOnCheckinMissed] = useState(true);
  const [notifyOnSos, setNotifyOnSos] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  async function loadContacts() {
    try {
      setLoading(true);
      const res = await fetch('/api/contacts');
      const data = await res.json();
      if (data.success) {
        setContacts(data.data);
      }
    } catch (e) {
      console.error('Failed to load contacts:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !relationship) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          relationship,
          notifyOnCheckinMissed,
          notifyOnSos,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setName('');
        setPhone('');
        setRelationship('');
        loadContacts();
      }
    } catch (e) {
      console.error('Failed to add contact:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadContacts();
      }
    } catch (e) {
      console.error('Delete error:', e);
    }
  };

  const handleTestSimulatedSms = (contact: TrustedContact) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResult(
      `[Prototype Simulation] Mock SMS broadcast dispatched to ${contact.name} (${contact.phone}) at ${timestamp}. Verified gateway status: MOCK_DISPATCH_ACK.`
    );
    setTimeout(() => {
      setTestResult(null);
    }, 6000);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono text-teal-400 uppercase tracking-wider mb-1">
            Guardian Safety Circle
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Trusted Emergency Contacts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage friends, family, and housemates who receive simulated SMS broadcasts if an alert is triggered.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-transform hover:scale-105 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Add Trusted Contact</span>
        </button>
      </div>

      {/* Simulated Dispatch Banner */}
      {testResult && (
        <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-500/50 text-xs text-teal-300 flex items-start gap-2.5">
          <BellRing className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-mono">{testResult}</div>
        </div>
      )}

      {/* Contacts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts.map((contact) => (
          <div
            key={contact._id}
            className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-colors space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-teal-400">
                  {contact.relationship}
                </span>
                <h3 className="text-sm font-bold text-white">{contact.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{contact.phone}</p>
              </div>

              <button
                onClick={() => handleDelete(contact._id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                title="Remove Contact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Notification preferences and consent */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Consent Verification:</span>
                <span
                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                    contact.consentStatus === 'verified'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                      : 'bg-amber-950 text-amber-300 border border-amber-800/40'
                  }`}
                >
                  {contact.consentStatus.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Notify on missed check-in:</span>
                <span className="font-mono text-slate-200">
                  {contact.notifyOnCheckinMissed ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {/* Test Simulated Alert Dispatch Button */}
            <button
              onClick={() => handleTestSimulatedSms(contact)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-700/80 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test Simulated Alert</span>
            </button>
          </div>
        ))}
      </div>

      {contacts.length === 0 && !loading && (
        <div className="p-12 text-center text-xs text-slate-400 rounded-xl bg-[#0f172a] border border-slate-800">
          No trusted contacts added yet. Add at least one contact to receive Guardian alerts.
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                <span>Add Trusted Emergency Contact</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sarah Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Mobile Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g., +1 (415) 555-0123"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Relationship</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sister, Partner, Flatmate, Friend"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-800 text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnCheckinMissed}
                    onChange={(e) => setNotifyOnCheckinMissed(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0"
                  />
                  <span>Dispatch alert on overdue / missed check-in</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnSos}
                    onChange={(e) => setNotifyOnSos(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-teal-500 focus:ring-0"
                  />
                  <span>Dispatch alert on panic SOS trigger</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg font-bold disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
