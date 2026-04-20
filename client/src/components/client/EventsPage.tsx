import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Award, Tag, Clock, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173";

interface Event {
  id: string;
  eventId: string;
  title: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  image: string | null;
  registered: number;
  maxCapacity: number | null;
  description: string;
  category: string;
  pointsReward: number;
  qrCode: string;
  isRegistered?: boolean;
}

const EventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API_URL}/api/events`, config);
      setEvents(response.data);
      setError(null);
    } catch (err: any) {
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleRegister = async (eventId: string) => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Please login to register for events'); return; }
    setRegistering(eventId);
    try {
      await axios.post(`${API_URL}/api/events/${eventId}/register`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchEvents();
      alert('Successfully registered for event!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to register for event');
    } finally {
      setRegistering(null);
    }
  };

  const handleUnregister = async (eventId: string) => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Please login first'); return; }
    if (!window.confirm('Are you sure you want to unregister?')) return;
    setRegistering(eventId);
    try {
      await axios.post(`${API_URL}/api/events/${eventId}/unregister`, {}, { headers: { Authorization: `Bearer ${token}` } });
      await fetchEvents();
      alert('Successfully unregistered from event');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unregister');
    } finally {
      setRegistering(null);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-16 text-center">
        <Loader2 className="w-10 h-10 text-cyan-300 animate-spin mx-auto mb-3" />
        <p className="text-white/60 text-sm">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-12">
        <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-6 text-center">
          <p className="text-red-300 font-medium text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()}
            className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Upcoming Events</h2>
        <p className="text-cyan-300 text-xs tracking-wide mt-0.5">Join SK activities and programs in your community</p>
      </div>

      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/10">
            <Calendar className="w-14 h-14 text-white/20 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-white/60 mb-1">No Upcoming Events</h3>
            <p className="text-xs text-white/40">Check back soon for new activities!</p>
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onRegister={handleRegister}
              onUnregister={handleUnregister}
              isRegistering={registering === event.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ── Event Card ──
interface EventCardProps {
  event: Event;
  onRegister: (eventId: string) => void;
  onUnregister: (eventId: string) => void;
  isRegistering: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, onRegister, onUnregister, isRegistering }) => {
  const [imgError, setImgError] = useState(false);
  const isFull = event.maxCapacity ? event.registered >= event.maxCapacity : false;
  const isRegistered = event.isRegistered || false;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {event.image && !imgError ? (
        <img src={event.image} alt={event.title} className="w-full h-44 object-cover" onError={() => setImgError(true)} />
      ) : (
        <div className="w-full h-44 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d4a5c, #1a7a8a)' }}>
          <Calendar className="w-14 h-14 text-white/30" />
        </div>
      )}

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-gray-800 flex-1">{event.title}</h3>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-700 rounded-lg text-xs font-semibold whitespace-nowrap">
            <Tag className="w-3 h-3" />{event.category}
          </span>
        </div>

        <div className="space-y-1.5 text-sm text-gray-500">
          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-cyan-500 flex-shrink-0" /><span>{event.date}</span></div>
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-400 flex-shrink-0" /><span>{event.time}</span></div>
          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-400 flex-shrink-0" /><span>{event.location} — {event.venue}</span></div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>{event.registered}{event.maxCapacity ? ` / ${event.maxCapacity}` : ''} registered</span>
            {isFull && <span className="text-red-600 font-semibold text-xs">(FULL)</span>}
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <span className="font-semibold text-yellow-600">{event.pointsReward} pts reward</span>
          </div>
        </div>

        <p className="text-sm text-gray-500 pt-2 border-t border-gray-100">{event.description}</p>
        <p className="text-xs text-gray-300 font-mono">Event ID: {event.eventId}</p>

        {isRegistered ? (
          <button onClick={() => onUnregister(event.id)} disabled={isRegistering}
            className="w-full py-2.5 bg-gray-500 hover:bg-gray-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
            {isRegistering && <Loader2 className="w-4 h-4 animate-spin" />}
            {isRegistering ? 'Processing...' : 'Unregister'}
          </button>
        ) : (
          <button onClick={() => onRegister(event.id)} disabled={isFull || isRegistering}
            className={`w-full py-2.5 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 ${
              isFull ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white shadow'
            }`}>
            {isRegistering && <Loader2 className="w-4 h-4 animate-spin" />}
            {isFull ? 'Event Full' : isRegistering ? 'Registering...' : 'Register for Event'}
          </button>
        )}
      </div>
    </div>
  );
};

export default EventsPage;