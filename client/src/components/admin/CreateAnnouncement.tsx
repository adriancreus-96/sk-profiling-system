import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Megaphone, Plus, Trash2, Pin, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────
export interface Announcement {
  _id: string;
  title: string;
  description: string;
  date: string;
  isPermanent: boolean;
  expiresAt?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
const isExpired = (a: Announcement) => {
  if (a.isPermanent || !a.expiresAt) return false;
  return new Date(a.expiresAt) < new Date();
};

const emptyForm = () => ({ title: '', description: '', eventDate: '', isPermanent: false, expiresAt: '' });

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────
const CreateAnnouncement = () => {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const token = localStorage.getItem('adminToken');
  const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch all (admin view — includes expired) ──
  const fetchAll = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_URL}/api/announcements`, { headers: authHeaders });
      if (res.status === 401) { navigate('/admin/login'); return; }
      const data = await res.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch {
      showToast('Failed to load announcements.', 'error');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Create ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.eventDate) {
      showToast('Please fill in all required fields.', 'error'); return;
    }
    if (!form.isPermanent && !form.expiresAt) {
      showToast('Set an expiry date or mark as permanent.', 'error'); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/announcements`, {
        method: 'POST', headers: authHeaders, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || 'Failed to create.', 'error'); return; }
      setAnnouncements(prev => [data.announcement, ...prev]);
      setForm(emptyForm());
      showToast('Announcement posted successfully!');
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/announcements/${id}`, { method: 'DELETE', headers: authHeaders });
      if (!res.ok) { showToast('Failed to delete.', 'error'); return; }
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      setDeleteConfirm(null);
      showToast('Announcement removed.');
    } catch {
      showToast('Network error. Please try again.', 'error');
    }
  };

  // ── Toggle pin ──
  const handleTogglePermanent = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/announcements/${id}/toggle-permanent`, {
        method: 'PATCH', headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message || 'Failed to update.', 'error'); return; }
      setAnnouncements(prev => prev.map(a => a._id === id ? data.announcement : a));
      showToast(data.message);
    } catch {
      showToast('Network error. Please try again.', 'error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
  };

  const inp = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007EA7] focus:border-transparent text-sm bg-white';
  const activeList = announcements.filter(a => !isExpired(a));
  const expiredList = announcements.filter(isExpired);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold
          ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Remove Announcement?</h3>
            </div>
            <p className="text-gray-500 text-sm mb-5">This will permanently remove it from the home page.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 transition text-sm">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition text-sm">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Back */}
        <button onClick={() => navigate('/admin')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition text-sm font-medium mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #007EA7 0%, #6EB8BB 100%)' }}>
            <Megaphone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Fugaz One', Impact, sans-serif" }}>
              Manage Announcements
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Create, pin, or remove announcements shown on the Home page.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* CREATE FORM */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sticky top-6">
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#007EA7]" /> New Announcement
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Title *</label>
                  <input name="title" value={form.title} onChange={handleChange}
                    placeholder="e.g. Community Clean-Up Drive" className={inp} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Description *</label>
                  <textarea name="description" value={form.description} onChange={handleChange}
                    placeholder="Short announcement details…" rows={3} className={`${inp} resize-none`} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">Event / Post Date *</label>
                  <input type="date" name="eventDate" value={form.eventDate} onChange={handleChange} className={inp} required />
                </div>

                {/* Permanent toggle */}
                <label className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer select-none">
                  <div className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${form.isPermanent ? 'bg-[#007EA7]' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isPermanent ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                  <input type="checkbox" name="isPermanent" checked={form.isPermanent} onChange={handleChange} className="hidden" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5 text-[#007EA7]" /> Permanent
                    </p>
                    <p className="text-xs text-gray-400">Never auto-expires from the home page</p>
                  </div>
                </label>

                {!form.isPermanent && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1 block">
                      <Clock className="w-3.5 h-3.5" /> Expiry Date *
                    </label>
                    <input type="date" name="expiresAt" value={form.expiresAt} onChange={handleChange} className={inp} />
                    <p className="text-xs text-gray-400 mt-1">After this date, it won't show on the home page.</p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition shadow-md disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #007EA7 0%, #6EB8BB 100%)' }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {loading ? 'Posting…' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>

          {/* LIST */}
          <div className="lg:col-span-3 space-y-5">
            {fetching ? (
              <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading announcements…
              </div>
            ) : (
              <>
                <section>
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Active ({activeList.length})
                  </h2>
                  {activeList.length === 0 && (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
                      No active announcements yet.
                    </div>
                  )}
                  <div className="space-y-3">
                    {activeList.map(a => (
                      <AnnouncementRow key={a._id} ann={a}
                        onDelete={() => setDeleteConfirm(a._id)}
                        onTogglePermanent={() => handleTogglePermanent(a._id)} />
                    ))}
                  </div>
                </section>

                {expiredList.length > 0 && (
                  <section>
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                      Expired ({expiredList.length})
                    </h2>
                    <div className="space-y-3">
                      {expiredList.map(a => (
                        <AnnouncementRow key={a._id} ann={a} expired
                          onDelete={() => setDeleteConfirm(a._id)}
                          onTogglePermanent={() => handleTogglePermanent(a._id)} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  Row card
// ─────────────────────────────────────────────
const AnnouncementRow = ({ ann, expired = false, onDelete, onTogglePermanent }: {
  ann: Announcement; expired?: boolean; onDelete: () => void; onTogglePermanent: () => void;
}) => (
  <div className={`bg-white rounded-2xl border shadow-sm p-4 flex gap-4 items-start transition
    ${expired ? 'opacity-55 border-gray-200' : 'border-gray-100 hover:shadow-md'}`}>
    <div className={`w-1 self-stretch rounded-full flex-shrink-0
      ${expired ? 'bg-gray-300' : ann.isPermanent ? 'bg-[#007EA7]' : 'bg-teal-400'}`} />
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h4 className="font-bold text-gray-800 text-sm leading-snug" style={{ fontFamily: "'Fugaz One', Impact, sans-serif" }}>
          {ann.title}
        </h4>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {ann.isPermanent && !expired && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#007EA7] bg-[#007EA7]/10 px-2 py-0.5 rounded-full">
              <Pin className="w-3 h-3" /> Pinned
            </span>
          )}
          {expired && (
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Expired</span>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{ann.description}</p>
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        <span className="text-[11px] text-gray-400 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {ann.date}
        </span>
        {!ann.isPermanent && ann.expiresAt && (
          <span className="text-[11px] text-amber-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Expires {new Date(ann.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
    <div className="flex flex-col gap-2 flex-shrink-0">
      <button onClick={onTogglePermanent} title={ann.isPermanent ? 'Unpin' : 'Pin permanently'}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition
          ${ann.isPermanent ? 'bg-[#007EA7]/15 text-[#007EA7] hover:bg-[#007EA7]/25' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>
        <Pin className="w-3.5 h-3.5" />
      </button>
      <button onClick={onDelete} title="Delete"
        className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

export default CreateAnnouncement;