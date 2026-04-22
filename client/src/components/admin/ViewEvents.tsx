import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, MapPin, Users, Award, Tag, Clock,
  Edit, XCircle, QrCode, Eye, Loader2, Search, Trash2
} from 'lucide-react';
import axios from 'axios';
import AttendeeProfileModal from '../../modals/AttendeeProfileModal';
import QRScannerModal from '../../modals/QRScannerModal';

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173";

interface Event {
  _id: string;
  eventId: string;
  title: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  venue: string;
  category: string;
  posterImage: string | null;
  pointsReward: number;
  maxCapacity: number | null;
  status: 'Draft' | 'Published' | 'Cancelled' | 'Completed';
  registeredCount: number;
  attendeesCount: number;
  createdAt: string;
}

interface Attendee {
  _id: string;
  skIdNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  sex: 'Male' | 'Female';
  birthday: Date;
  profilePicture?: string;
  age?: number;
  youthAgeGroup?: string;
  block?: string;
  lot?: string;
  houseNumber?: string;
  street?: string;
  purok: string;
  email: string;
  contactNumber: string;
  status: string;
  points?: number;
  civilStatus?: string;
  educationalBackground?: string;
  youthClassification?: string;
  workStatus?: string;
  registeredSkVoter?: boolean;
  registeredNationalVoter?: boolean;
  isPwd?: boolean;
  isCicwl?: boolean;
  isIndigenous?: boolean;
}

// Shared button style helpers


const ViewEvents = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'today' | 'past' | 'cancelled'>('upcoming');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [registered, setRegistered] = useState<Attendee[]>([]);
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'attended'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState<'upcoming' | 'today' | 'past' | 'cancelled'>('upcoming');
  const [showAttendeeProfile, setShowAttendeeProfile] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannerEvent, setScannerEvent] = useState<Event | null>(null);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) { navigate('/admin/login'); return; }
      const response = await axios.get(`${API_URL}/api/events/admin/all`, { headers: { Authorization: `Bearer ${token}` } });
      setEvents(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) { localStorage.removeItem('adminToken'); navigate('/admin/login'); }
    } finally {
      setLoading(false);
    }
  };

  const categorizeEvents = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming: Event[] = [], todayEvents: Event[] = [], past: Event[] = [], cancelled: Event[] = [];
    events.forEach(event => {
      if (event.status === 'Cancelled') { cancelled.push(event); return; }
      const eventDate = new Date(event.eventDate); eventDate.setHours(0, 0, 0, 0);
      if (eventDate.getTime() === today.getTime()) todayEvents.push(event);
      else if (eventDate > today) upcoming.push(event);
      else past.push(event);
    });
    upcoming.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    past.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
    cancelled.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
    return { upcoming, todayEvents, past, cancelled };
  };

  const { upcoming, todayEvents, past, cancelled } = categorizeEvents();

  const handleEdit = (event: Event) => navigate('/admin/post-event', { state: { editEvent: event } });

  const handleCancel = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to cancel this event?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`${API_URL}/api/events/admin/${eventId}`, { status: 'Cancelled' }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Event cancelled successfully'); fetchEvents();
    } catch { alert('Failed to cancel event'); }
  };

  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${eventTitle}"? This action cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/api/events/admin/${eventId}`, { headers: { Authorization: `Bearer ${token}` } });
      alert('Event deleted successfully'); fetchEvents();
    } catch { alert('Failed to delete event'); }
  };

  const handleViewAttendance = async (event: Event, tab: 'upcoming' | 'today' | 'past' | 'cancelled') => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/api/events/admin/${event._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedEvent(event); setCurrentTab(tab);
      setRegistered(response.data.registered || []);
      setAttendees(response.data.attendees || []);
      setShowAttendanceModal(true);
    } catch { alert('Failed to load attendance records'); }
  };

  const handleRecordAttendance = (event: Event) => { setScannerEvent(event); setShowQRScanner(true); };
  const handleAttendanceMarked = () => fetchEvents();
  const handleViewProfile = (person: Attendee) => { setSelectedAttendee(person); setShowAttendeeProfile(true); };

  const getDisplayedAttendees = () => {
    let list: Attendee[] = attendanceFilter === 'attended' ? attendees : registered;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      list = list.filter(person =>
        person.firstName.toLowerCase().includes(query) ||
        person.lastName.toLowerCase().includes(query) ||
        person.skIdNumber?.toLowerCase().includes(query)
      );
    }
    return list;
  };

  const formatFullName = (person: Attendee) => {
    const middleInitial = person.middleName ? `${person.middleName.charAt(0)}.` : '';
    return `${person.firstName} ${middleInitial} ${person.lastName}`.trim();
  };
  const hasAttended = (personId: string) => attendees.some(a => a._id === personId);

  if (loading) return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #5CB0B3 37%, #007EA7 100%)' }}
    >
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-white/50 animate-spin mx-auto mb-3" />
        <p className="text-white/60 text-sm font-work">Loading events...</p>
      </div>
    </div>
  );

  const currentEvents = activeTab === 'upcoming' ? upcoming
    : activeTab === 'today' ? todayEvents
    : activeTab === 'past' ? past
    : cancelled;

  const TAB_COUNTS = { upcoming: upcoming.length, today: todayEvents.length, past: past.length, cancelled: cancelled.length };

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #5CB0B3 37%, #007EA7 100%)' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/15 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] px-3 py-2 rounded-lg"
            style={{ background: 'rgba(0,52,89,0.35)' }}
            onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,23,31,0.5)')}
            onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,52,89,0.35)')}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </button>
          <h1 className="text-lg font-bold text-white font-fugaz">Event Management</h1>
          <button
            onClick={() => navigate('/admin/post-event')}
            className="flex items-center gap-1.5 text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] px-3 py-2 rounded-lg"
            style={{ background: '#003459' }}
            onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#00171F')}
            onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#003459')}
          >
            <Calendar className="w-3.5 h-3.5" /> Create Event
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-5">

        {/* Tab pills */}
        <div className="flex justify-center">
          <div className="bg-white/20 border border-white/30 rounded-xl p-1 inline-flex gap-1">
            {(['upcoming', 'today', 'past', 'cancelled'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all font-fugaz capitalize ${
                  activeTab === tab ? 'bg-white text-[#003459] shadow-sm' : 'text-white/70 hover:text-white'
                }`}
              >
                {tab === 'upcoming' ? `Upcoming (${TAB_COUNTS.upcoming})`
                 : tab === 'today' ? `Today (${TAB_COUNTS.today})`
                 : tab === 'past' ? `Past (${TAB_COUNTS.past})`
                 : `Cancelled (${TAB_COUNTS.cancelled})`}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {currentEvents.length === 0 ? (
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/20">
            <Calendar className="w-14 h-14 text-white/20 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-white/60 mb-1 font-fugaz">
              No {activeTab === 'upcoming' ? 'Upcoming' : activeTab === 'today' ? "Today's" : activeTab === 'past' ? 'Past' : 'Cancelled'} Events
            </h3>
            <p className="text-xs text-white/40 font-work">
              {activeTab === 'upcoming' && 'Create a new event to get started'}
              {activeTab === 'today' && 'No events scheduled for today'}
              {activeTab === 'past' && 'No past events to display'}
              {activeTab === 'cancelled' && 'No cancelled events'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentEvents.map(event => (
              <EventCard
                key={event._id}
                event={event}
                tab={activeTab}
                onEdit={handleEdit}
                onCancel={handleCancel}
                onDelete={handleDelete}
                onRecordAttendance={handleRecordAttendance}
                onViewAttendance={handleViewAttendance}
              />
            ))}
          </div>
        )}
      </main>

      {/* Attendance Modal */}
      {showAttendanceModal && selectedEvent && (
        <AttendanceModal
          event={selectedEvent}
          tab={currentTab}
          registered={registered}
          attendees={attendees}
          filter={attendanceFilter}
          setFilter={setAttendanceFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          getDisplayedAttendees={getDisplayedAttendees}
          formatFullName={formatFullName}
          hasAttended={hasAttended}
          onViewProfile={handleViewProfile}
          onClose={() => { setShowAttendanceModal(false); setSelectedEvent(null); setAttendanceFilter('all'); setSearchQuery(''); }}
        />
      )}

      {showAttendeeProfile && selectedAttendee && (
        <AttendeeProfileModal
          attendee={selectedAttendee}
          isOpen={showAttendeeProfile}
          onClose={() => { setShowAttendeeProfile(false); setSelectedAttendee(null); }}
        />
      )}

      {showQRScanner && scannerEvent && (
        <QRScannerModal
          event={scannerEvent}
          isOpen={showQRScanner}
          onClose={() => { setShowQRScanner(false); setScannerEvent(null); }}
          onAttendanceMarked={handleAttendanceMarked}
        />
      )}
    </div>
  );
};

// ── Event Card ──
interface EventCardProps {
  event: Event;
  tab: 'upcoming' | 'today' | 'past' | 'cancelled';
  onEdit: (event: Event) => void;
  onCancel: (eventId: string) => void;
  onDelete: (eventId: string, eventTitle: string) => void;
  onRecordAttendance: (event: Event) => void;
  onViewAttendance: (event: Event, tab: 'upcoming' | 'today' | 'past' | 'cancelled') => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, tab, onEdit, onCancel, onDelete, onRecordAttendance, onViewAttendance }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {event.posterImage && !imgError ? (
        <img src={event.posterImage} alt={event.title} className="w-full h-40 object-cover" onError={() => setImgError(true)} />
      ) : (
        <div className="w-full h-40 flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #5CB0B3 37%, #007EA7 100%)' }}>
          <Calendar className="w-12 h-12 text-white/30" />
        </div>
      )}

      <div className="p-5 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-bold text-gray-900 line-clamp-2 font-fugaz">{event.title}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold font-work shrink-0 ${
              event.status === 'Published' ? 'bg-green-50 text-green-700' :
              event.status === 'Cancelled' ? 'bg-red-50 text-red-700' :
              event.status === 'Completed' ? 'bg-gray-100 text-gray-600' :
              'bg-yellow-50 text-yellow-700'
            }`}>
              {event.status}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-[#003459]/10 text-[#003459] rounded-lg text-xs font-semibold font-work">
            <Tag className="w-3 h-3" />{event.category}
          </span>
        </div>

        <div className="space-y-1.5 text-sm text-gray-500">
          <div className="flex items-center gap-2 font-work"><Calendar className="w-4 h-4 text-[#003459] shrink-0" /><span>{new Date(event.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
          <div className="flex items-center gap-2 font-work"><Clock className="w-4 h-4 text-orange-400 shrink-0" /><span>{event.startTime} - {event.endTime}</span></div>
          <div className="flex items-center gap-2 font-work"><MapPin className="w-4 h-4 text-red-400 shrink-0" /><span className="line-clamp-1">{event.location}</span></div>
          <div className="flex items-center gap-2 font-work"><Users className="w-4 h-4 text-green-500 shrink-0" /><span>{event.registeredCount} registered{tab === 'past' && ` · ${event.attendeesCount} attended`}</span></div>
          <div className="flex items-center gap-2 font-work"><Award className="w-4 h-4 text-yellow-500 shrink-0" /><span className="font-semibold text-yellow-600">{event.pointsReward} points</span></div>
        </div>

        <p className="text-xs text-gray-300 font-mono pt-2 border-t border-gray-100">{event.eventId}</p>

        {/* Action buttons */}
        <div className="pt-1 space-y-2">
          {tab === 'upcoming' && (<>
            <div className="grid grid-cols-2 gap-2">
              <ActionBtn onClick={() => onEdit(event)} icon={<Edit className="w-4 h-4" />} label="Edit" />
              <ActionBtn onClick={() => onCancel(event._id)} icon={<XCircle className="w-4 h-4" />} label="Cancel" danger />
            </div>
            <ActionBtn onClick={() => onViewAttendance(event, tab)} icon={<Eye className="w-4 h-4" />} label="View Registrants" full />
          </>)}
          {tab === 'today' && (<>
            <div className="grid grid-cols-2 gap-2">
              <ActionBtn onClick={() => onRecordAttendance(event)} icon={<QrCode className="w-4 h-4" />} label="Scan" />
              <ActionBtn onClick={() => onEdit(event)} icon={<Edit className="w-4 h-4" />} label="Edit" />
            </div>
            <ActionBtn onClick={() => onViewAttendance(event, tab)} icon={<Eye className="w-4 h-4" />} label="View Attendance" full />
          </>)}
          {tab === 'past' && (
            <ActionBtn onClick={() => onViewAttendance(event, tab)} icon={<Eye className="w-4 h-4" />} label="View Attendance" full />
          )}
          {tab === 'cancelled' && (<>
            <ActionBtn onClick={() => onViewAttendance(event, tab)} icon={<Eye className="w-4 h-4" />} label="View Registrants" full />
            <ActionBtn onClick={() => onDelete(event._id, event.title)} icon={<Trash2 className="w-4 h-4" />} label="Delete Event" full danger />
          </>)}
        </div>
      </div>
    </div>
  );
};

// ── Reusable action button ──
const ActionBtn = ({ onClick, icon, label, full = false, danger = false }: {
  onClick: () => void; icon: React.ReactNode; label: string; full?: boolean; danger?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] ${full ? 'w-full' : ''}`}
    style={{ background: danger ? '#dc2626' : '#003459' }}
    onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.background = danger ? '#b91c1c' : '#00171F'; }}
    onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = danger ? '#dc2626' : '#003459'; }}
  >
    {icon} {label}
  </button>
);

// ── Attendance Modal ──
interface AttendanceModalProps {
  event: Event;
  tab: 'upcoming' | 'today' | 'past' | 'cancelled';
  registered: Attendee[];
  attendees: Attendee[];
  filter: 'all' | 'attended';
  setFilter: (filter: 'all' | 'attended') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  getDisplayedAttendees: () => Attendee[];
  formatFullName: (person: Attendee) => string;
  hasAttended: (personId: string) => boolean;
  onViewProfile: (person: Attendee) => void;
  onClose: () => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({
  event, tab, registered, attendees, filter, setFilter,
  searchQuery, setSearchQuery, getDisplayedAttendees,
  formatFullName, hasAttended, onViewProfile, onClose
}) => {
  const displayedList = getDisplayedAttendees();
  const modalTitle = tab === 'upcoming' || tab === 'cancelled' ? 'Registrants' : 'Attendance Records';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Modal header */}
        <div
          className="px-6 py-5 flex items-center justify-between shrink-0"
          style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #007EA7 100%)' }}
        >
          <div>
            <h2 className="text-xl font-bold text-white font-fugaz">{event.title}</h2>
            <p className="text-sm text-white/70 font-work">{modalTitle}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Stats row */}
        {(tab === 'today' || tab === 'past') && (
          <div className="bg-[#003459]/5 px-6 py-4 grid grid-cols-3 gap-4 border-b border-gray-100 shrink-0">
            <div className="text-center">
              <p className="text-2xl font-black text-gray-800 font-fugaz">{registered.length}</p>
              <p className="text-xs text-gray-500 font-work">Registered</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-green-600 font-fugaz">{attendees.length}</p>
              <p className="text-xs text-gray-500 font-work">Attended</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-[#003459] font-fugaz">
                {registered.length > 0 ? Math.round((attendees.length / registered.length) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500 font-work">Attendance Rate</p>
            </div>
          </div>
        )}

        {/* Filter + search */}
        <div className="px-6 py-4 bg-white border-b border-gray-100 space-y-3 shrink-0">
          {tab !== 'upcoming' && tab !== 'cancelled' && (
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all font-fugaz ${filter === 'all' ? 'text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                style={filter === 'all' ? { background: '#003459' } : {}}
              >
                All Registered ({registered.length})
              </button>
              <button
                onClick={() => setFilter('attended')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all font-fugaz ${filter === 'attended' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Attended Only ({attendees.length})
              </button>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or SK ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition bg-white"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          {displayedList.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-work text-sm">No records found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedList.map(person => (
                <div
                  key={person._id}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    hasAttended(person._id) && tab !== 'upcoming' && tab !== 'cancelled'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-200">
                      {person.skIdNumber || 'N/A'}
                    </span>
                    <span className="font-semibold text-gray-800 font-work text-sm">{formatFullName(person)}</span>
                    {hasAttended(person._id) && tab !== 'upcoming' && tab !== 'cancelled' && (
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-lg font-fugaz">✓ ATTENDED</span>
                    )}
                  </div>
                  <button
                    onClick={() => onViewProfile(person)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] flex items-center gap-1.5"
                    style={{ background: '#003459' }}
                    onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#00171F')}
                    onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#003459')}
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em]"
            style={{ background: '#003459' }}
            onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#00171F')}
            onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#003459')}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewEvents;