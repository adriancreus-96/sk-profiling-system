import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Users, Award, Tag, Clock, Loader2 } from 'lucide-react';
import axios from 'axios';

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
      const response = await axios.get('http://localhost:5000/api/events', config);
      setEvents(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRegister = async (eventId: string) => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Please login to register for events'); return; }

    setRegistering(eventId);
    try {
      await axios.post(
        `http://localhost:5000/api/events/${eventId}/register`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchEvents();
      alert('Successfully registered for event!');
    } catch (err: any) {
      console.error('Registration error:', err);
      alert(err.response?.data?.message || 'Failed to register for event');
    } finally {
      setRegistering(null);
    }
  };

  const handleUnregister = async (eventId: string) => {
    const token = localStorage.getItem('token');
    if (!token) { alert('Please login first'); return; }
    if (!window.confirm('Are you sure you want to unregister from this event?')) return;

    setRegistering(eventId);
    try {
      await axios.post(
        `http://localhost:5000/api/events/${eventId}/unregister`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchEvents();
      alert('Successfully unregistered from event');
    } catch (err: any) {
      console.error('Unregister error:', err);
      alert(err.response?.data?.message || 'Failed to unregister');
    } finally {
      setRegistering(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-screen-lg mx-auto px-4 py-12 text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-screen-lg mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Upcoming Events</h2>
        <p className="text-sm text-gray-500">Join SK activities and programs in your community</p>
      </div>

      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Upcoming Events</h3>
            <p className="text-sm text-gray-400">Check back soon for new activities!</p>
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* image is now a full Cloudinary https:// URL — no localhost prefix needed */}
      {event.image && !imgError ? (
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-48 object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <Calendar className="w-16 h-16 text-white opacity-50" />
        </div>
      )}

      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold text-gray-800 flex-1">{event.title}</h3>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
            <Tag className="w-3 h-3" />
            {event.category}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{event.location} - {event.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>
              {event.registered} {event.maxCapacity ? `/ ${event.maxCapacity}` : ''} registered
              {isFull && <span className="ml-2 text-red-600 font-semibold">(FULL)</span>}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500 flex-shrink-0" />
            <span className="font-semibold text-yellow-700">{event.pointsReward} points reward</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 pt-2 border-t border-gray-100">{event.description}</p>

        <div className="text-xs text-gray-400 font-mono">Event ID: {event.eventId}</div>

        {isRegistered ? (
          <button
            onClick={() => onUnregister(event.id)}
            disabled={isRegistering}
            className="w-full py-2.5 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isRegistering && <Loader2 className="w-4 h-4 animate-spin" />}
            {isRegistering ? 'Processing...' : 'Unregister'}
          </button>
        ) : (
          <button
            onClick={() => onRegister(event.id)}
            disabled={isFull || isRegistering}
            className={`w-full py-2.5 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              isFull ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white'
            }`}
          >
            {isRegistering && <Loader2 className="w-4 h-4 animate-spin" />}
            {isFull ? 'Event Full' : isRegistering ? 'Registering...' : 'Register for Event'}
          </button>
        )}
      </div>
    </div>
  );
};

export default EventsPage;