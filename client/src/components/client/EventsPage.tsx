import React, { useState, useEffect } from 'react';
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

  if (loading) return (
    <div className="px-4 py-16 text-center">
      <Loader2 className="w-10 h-10 text-white/50 animate-spin mx-auto mb-3" />
      <p className="text-gray-400 text-xs mt-1 font-work">Loading events...</p>
    </div>
  );

  if (error) return (
    <div className="px-4 py-12">
      <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl px-7 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 font-fugaz mb-1">Something went wrong</h2>
        <p className="text-gray-400 text-xs mt-1 mb-5 font-work">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em]"
          style={{ background: '#003459' }}
          onMouseOver={e => ((e.currentTarget as HTMLButtonElement).style.background = '#00171F')}
          onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.background = '#003459')}>
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-5">

      {/* Section header — mirrors LoginForm card header style */}
      <div className="bg-white rounded-2xl shadow-2xl px-7 py-5">
        <h2 className="text-2xl font-bold text-gray-900 font-fugaz">Upcoming Events</h2>
        <p className="text-gray-400 text-xs mt-1 font-work">Join SK activities and programs in your community</p>
      </div>

      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-2xl px-7 py-12 text-center">
            <Calendar className="w-14 h-14 text-gray-200 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 font-fugaz mb-1">No Upcoming Events</h2>
            <p className="text-gray-400 text-xs font-work">Check back soon for new activities!</p>
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
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Banner image / fallback */}
      {event.image && !imgError ? (
        <img src={event.image} alt={event.title} className="w-full h-44 object-cover"
          onError={() => setImgError(true)} />
      ) : (
        <div className="w-full h-44 flex items-center justify-center"
          style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #5CB0B3 37%, #007EA7 100%)' }}>
          <Calendar className="w-14 h-14 text-white/30" />
        </div>
      )}

      <div className="px-7 py-5 space-y-4">
        {/* Title + category */}
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-2xl font-bold text-gray-900 flex-1 font-fugaz leading-tight">{event.title}</h2>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold font-work whitespace-nowrap"
            style={{ background: 'rgba(0,52,89,0.08)', color: '#003459' }}>
            <Tag className="w-3 h-3" />{event.category}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[#00171F] font-work flex items-center gap-2">
            <Calendar className="w-4 h-4 flex-shrink-0" />{event.date}
          </p>
          <p className="text-sm font-medium text-[#00171F] font-work flex items-center gap-2">
            <Clock className="w-4 h-4 flex-shrink-0" />{event.time}
          </p>
          <p className="text-sm font-medium text-[#00171F] font-work flex items-center gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />{event.location} — {event.venue}
          </p>
          <p className="text-sm font-medium text-[#00171F] font-work flex items-center gap-2">
            <Users className="w-4 h-4 flex-shrink-0" />
            {event.registered}{event.maxCapacity ? ` / ${event.maxCapacity}` : ''} registered
            {isFull && <span className="text-xs font-bold text-red-500 ml-1">(FULL)</span>}
          </p>
          <p className="text-sm font-medium text-[#00171F] font-work flex items-center gap-2">
            <Award className="w-4 h-4 flex-shrink-0" />{event.pointsReward} pts reward
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center">
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 font-work">{event.description}</p>

        {/* Action button */}
        {isRegistered ? (
          <button
            onClick={() => onUnregister(event.id)} disabled={isRegistering}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] disabled:opacity-50"
            style={{ background: '#003459' }}
            onMouseOver={e => { const b = e.currentTarget as HTMLButtonElement; if (!b.disabled) b.style.background = '#00171F'; }}
            onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}>
            {isRegistering && <Loader2 className="w-4 h-4 animate-spin" />}
            {isRegistering ? 'Processing...' : 'Unregister'}
          </button>
        ) : (
          <button
            onClick={() => onRegister(event.id)} disabled={isFull || isRegistering}
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] disabled:opacity-50"
            style={{ background: isFull ? '#d1d5db' : '#003459', color: isFull ? '#9ca3af' : 'white', cursor: isFull ? 'not-allowed' : 'pointer' }}
            onMouseOver={e => { const b = e.currentTarget as HTMLButtonElement; if (!b.disabled && !isFull) b.style.background = '#00171F'; }}
            onMouseOut={e => { if (!isFull) (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}>
            {isRegistering && <Loader2 className="w-4 h-4 animate-spin" />}
            {isFull ? 'Event Full' : isRegistering ? 'Registering...' : 'Register for Event'}
          </button>
        )}
      </div>
    </div>
  );
};

export default EventsPage;