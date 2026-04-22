import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Award, Tag, Clock, Loader2, ZoomIn } from 'lucide-react';
import axios from 'axios';
import ImageLightbox from '../../components/ImageLightbox'; // adjust path as needed

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
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

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

      {/* Section header */}
      <div className="bg-white rounded-2xl shadow-2xl px-7 py-5">
        <h2 className="text-2xl font-bold text-gray-900 font-fugaz">Upcoming Events</h2>
        <p className="text-gray-400 text-xs mt-1 font-work">Join SK activities and programs in your community</p>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-2xl px-7 py-12 text-center">
          <Calendar className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 font-fugaz mb-1">No Upcoming Events</h2>
          <p className="text-gray-400 text-xs font-work">Check back soon for new activities!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onRegister={handleRegister}
              onUnregister={handleUnregister}
              isRegistering={registering === event.id}
              onImageClick={(src, title) => setLightboxImage({ src, title })}
            />
          ))}
        </div>
      )}

      {/* Global lightbox */}
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.title}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
};

interface EventCardProps {
  event: Event;
  onRegister: (eventId: string) => void;
  onUnregister: (eventId: string) => void;
  isRegistering: boolean;
  onImageClick: (src: string, title: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onRegister, onUnregister, isRegistering, onImageClick }) => {
  const [imgError, setImgError] = useState(false);
  const isFull = event.maxCapacity ? event.registered >= event.maxCapacity : false;
  const isRegistered = event.isRegistered || false;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Banner — clickable if image exists */}
      {event.image && !imgError ? (
        <div
          className="relative group cursor-zoom-in"
          onClick={() => onImageClick(event.image!, event.title)}
        >
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-40 object-cover"
            onError={() => setImgError(true)}
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/60 text-white text-xs font-semibold font-fugaz px-3 py-2 rounded-lg">
              <ZoomIn className="w-4 h-4" /> View Full Image
            </div>
          </div>
        </div>
      ) : (
        <div
          className="w-full h-40 flex items-center justify-center"
          style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #5CB0B3 37%, #007EA7 100%)' }}
        >
          <Calendar className="w-12 h-12 text-white/30" />
        </div>
      )}

      <div className="p-5 space-y-3 flex flex-col flex-1">
        {/* Title + registered badge */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-bold text-gray-900 line-clamp-2 font-fugaz flex-1">{event.title}</h3>
            {isRegistered && (
              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-700 font-work shrink-0">
                Registered
              </span>
            )}
          </div>
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold font-work"
            style={{ background: 'rgba(0,52,89,0.08)', color: '#003459' }}
          >
            <Tag className="w-3 h-3" />{event.category}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-1.5 text-sm text-gray-500">
          <div className="flex items-center gap-2 font-work">
            <Calendar className="w-4 h-4 text-[#003459] shrink-0" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2 font-work">
            <Clock className="w-4 h-4 text-orange-400 shrink-0" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2 font-work">
            <MapPin className="w-4 h-4 text-red-400 shrink-0" />
            <span className="line-clamp-1">{event.location} — {event.venue}</span>
          </div>
          <div className="flex items-center gap-2 font-work">
            <Users className="w-4 h-4 text-green-500 shrink-0" />
            <span>
              {event.registered}{event.maxCapacity ? ` / ${event.maxCapacity}` : ''} registered
              {isFull && <span className="text-xs font-bold text-red-500 ml-1">(FULL)</span>}
            </span>
          </div>
          <div className="flex items-center gap-2 font-work">
            <Award className="w-4 h-4 text-yellow-500 shrink-0" />
            <span className="font-semibold text-yellow-600">{event.pointsReward} pts reward</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 font-work line-clamp-2 border-t border-gray-100 pt-3">
          {event.description}
        </p>

        {/* Action button — pushed to bottom */}
        <div className="pt-1 mt-auto">
          {isRegistered ? (
            <button
              onClick={() => onUnregister(event.id)}
              disabled={isRegistering}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] disabled:opacity-50"
              style={{ background: '#003459' }}
              onMouseOver={e => { const b = e.currentTarget as HTMLButtonElement; if (!b.disabled) b.style.background = '#00171F'; }}
              onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}
            >
              {isRegistering && <Loader2 className="w-4 h-4 animate-spin" />}
              {isRegistering ? 'Processing...' : 'Unregister'}
            </button>
          ) : (
            <button
              onClick={() => onRegister(event.id)}
              disabled={isFull || isRegistering}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] disabled:opacity-50"
              style={{
                background: isFull ? '#d1d5db' : '#003459',
                color: isFull ? '#9ca3af' : 'white',
                cursor: isFull ? 'not-allowed' : 'pointer'
              }}
              onMouseOver={e => { const b = e.currentTarget as HTMLButtonElement; if (!b.disabled && !isFull) b.style.background = '#00171F'; }}
              onMouseOut={e => { if (!isFull) (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}
            >
              {isRegistering && <Loader2 className="w-4 h-4 animate-spin" />}
              {isFull ? 'Event Full' : isRegistering ? 'Registering...' : 'Register for Event'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsPage;