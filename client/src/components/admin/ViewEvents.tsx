import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, MapPin, Users, Award, Tag, Clock, 
  Edit, XCircle, QrCode, Eye, Loader2, Search, Trash2
} from 'lucide-react';
import axios from 'axios';
import AttendeeProfileModal from '../../modals/AttendeeProfileModal';
import QRScannerModal from '../../modals/QRScannerModal';

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
  
  // Profile modal states
  const [showAttendeeProfile, setShowAttendeeProfile] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);

  // QR Scanner modal state
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannerEvent, setScannerEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) { navigate('/admin/login'); return; }

      const response = await axios.get('http://localhost:5000/api/events/admin/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const categorizeEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming: Event[] = [];
    const todayEvents: Event[] = [];
    const past: Event[] = [];
    const cancelled: Event[] = [];

    events.forEach(event => {
      if (event.status === 'Cancelled') {
        cancelled.push(event);
        return;
      }

      const eventDate = new Date(event.eventDate);
      eventDate.setHours(0, 0, 0, 0);
      
      if (eventDate.getTime() === today.getTime()) todayEvents.push(event);
      else if (eventDate > today) upcoming.push(event);
      else past.push(event);
    });

    // Sort upcoming: nearest first (ascending)
    upcoming.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    
    // Sort past: most recent first (descending)
    past.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
    
    // Sort cancelled: most recent first (descending)
    cancelled.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

    return { upcoming, todayEvents, past, cancelled };
  };

  const { upcoming, todayEvents, past, cancelled } = categorizeEvents();

  const handleEdit = (event: Event) => {
    navigate('/admin/post-event', { state: { editEvent: event } });
  };

  const handleCancel = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to cancel this event?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/events/admin/${eventId}`,
        { status: 'Cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Event cancelled successfully');
      fetchEvents();
    } catch (error: any) {
      console.error('Error cancelling event:', error);
      alert('Failed to cancel event');
    }
  };

  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${eventTitle}"? This action cannot be undone.`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        `http://localhost:5000/api/events/admin/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Event deleted successfully');
      fetchEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const handleViewAttendance = async (event: Event, tab: 'upcoming' | 'today' | 'past' | 'cancelled') => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `http://localhost:5000/api/events/admin/${event._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedEvent(event);
      setCurrentTab(tab);
      setRegistered(response.data.registered || []);
      setAttendees(response.data.attendees || []);
      setShowAttendanceModal(true);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      alert('Failed to load attendance records');
    }
  };

  const handleRecordAttendance = (event: Event) => {
    setScannerEvent(event);
    setShowQRScanner(true);
  };

  const handleAttendanceMarked = () => {
    // Refresh events list after attendance is marked
    fetchEvents();
  };

  const handleViewProfile = (person: Attendee) => {
    console.log('👤 Viewing profile for:', person);
    console.log('📊 User data:', JSON.stringify(person, null, 2));
    setSelectedAttendee(person);
    setShowAttendeeProfile(true);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  const currentEvents = activeTab === 'upcoming' ? upcoming 
    : activeTab === 'today' ? todayEvents 
    : activeTab === 'past' ? past 
    : cancelled;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <button
          onClick={() => navigate('/admin/post-event')}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md"
        >
          <Calendar className="w-5 h-5" />
          Create Event
        </button>
      </div>

      <h1 className="text-4xl font-extrabold text-black mb-8 text-center">Event Management</h1>

      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg shadow-sm p-1 inline-flex gap-1">
          {(['upcoming', 'today', 'past', 'cancelled'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg font-semibold transition-colors capitalize ${
                activeTab === tab
                  ? tab === 'upcoming' ? 'bg-blue-600 text-white'
                  : tab === 'today' ? 'bg-green-600 text-white'
                  : tab === 'past' ? 'bg-gray-600 text-white'
                  : 'bg-red-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'upcoming' ? `Upcoming (${upcoming.length})`
               : tab === 'today' ? `Today (${todayEvents.length})`
               : tab === 'past' ? `Past (${past.length})`
               : `Cancelled (${cancelled.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {currentEvents.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No {activeTab === 'upcoming' ? 'Upcoming' 
                : activeTab === 'today' ? "Today's" 
                : activeTab === 'past' ? 'Past' 
                : 'Cancelled'} Events
            </h3>
            <p className="text-sm text-gray-400">
              {activeTab === 'upcoming' && 'Create a new event to get started'}
              {activeTab === 'today' && 'No events scheduled for today'}
              {activeTab === 'past' && 'No past events to display'}
              {activeTab === 'cancelled' && 'No cancelled events'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </div>

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
          onClose={() => {
            setShowAttendanceModal(false);
            setSelectedEvent(null);
            setAttendanceFilter('all');
            setSearchQuery('');
          }}
        />
      )}

      {/* Attendee Profile Modal */}
      {showAttendeeProfile && selectedAttendee && (
        <AttendeeProfileModal
          attendee={selectedAttendee}
          isOpen={showAttendeeProfile}
          onClose={() => {
            setShowAttendeeProfile(false);
            setSelectedAttendee(null);
          }}
        />
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && scannerEvent && (
        <QRScannerModal
          event={scannerEvent}
          isOpen={showQRScanner}
          onClose={() => {
            setShowQRScanner(false);
            setScannerEvent(null);
          }}
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

const EventCard: React.FC<EventCardProps> = ({ 
  event, tab, onEdit, onCancel, onDelete, onRecordAttendance, onViewAttendance 
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {event.posterImage && !imgError ? (
        <img
          src={event.posterImage}
          alt={event.title}
          className="w-full h-40 object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
          <Calendar className="w-12 h-12 text-white opacity-50" />
        </div>
      )}

      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-800 line-clamp-2">{event.title}</h3>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold shrink-0 ${
              event.status === 'Published' ? 'bg-green-100 text-green-700' :
              event.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
              event.status === 'Completed' ? 'bg-gray-100 text-gray-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {event.status}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
            <Tag className="w-3 h-3" />
            {event.category}
          </span>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
            <span>{new Date(event.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500 shrink-0" />
            <span>{event.startTime} - {event.endTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500 shrink-0" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-500 shrink-0" />
            <span>
              {event.registeredCount} registered
              {tab === 'past' && ` • ${event.attendeesCount} attended`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500 shrink-0" />
            <span className="font-semibold text-yellow-700">{event.pointsReward} points</span>
          </div>
        </div>

        <div className="text-xs text-gray-400 font-mono pt-2 border-t border-gray-100">{event.eventId}</div>

        <div className="pt-3 border-t border-gray-100">
          {tab === 'upcoming' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onEdit(event)} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => onCancel(event._id)} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">
                  <XCircle className="w-4 h-4" /> Cancel
                </button>
              </div>
              <button onClick={() => onViewAttendance(event, tab)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors">
                <Eye className="w-4 h-4" /> View Registrants
              </button>
            </div>
          )}
          {tab === 'today' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onRecordAttendance(event)} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">
                  <QrCode className="w-4 h-4" /> Scan
                </button>
                <button onClick={() => onEdit(event)} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                  <Edit className="w-4 h-4" /> Edit
                </button>
              </div>
              <button onClick={() => onViewAttendance(event, tab)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors">
                <Eye className="w-4 h-4" /> View Attendance
              </button>
            </div>
          )}
          {tab === 'past' && (
            <button onClick={() => onViewAttendance(event, tab)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors">
              <Eye className="w-4 h-4" /> View Attendance
            </button>
          )}
          {tab === 'cancelled' && (
            <div className="space-y-2">
              <button onClick={() => onViewAttendance(event, tab)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors">
                <Eye className="w-4 h-4" /> View Registrants
              </button>
              <button 
                onClick={() => onDelete(event._id, event.title)} 
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Event
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">{event.title}</h2>
            <p className="text-sm text-gray-200">{modalTitle}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {(tab === 'today' || tab === 'past') && (
          <div className="bg-gray-50 px-6 py-4 grid grid-cols-3 gap-4 border-b border-gray-200 shrink-0">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{registered.length}</p>
              <p className="text-sm text-gray-600">Registered</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{attendees.length}</p>
              <p className="text-sm text-gray-600">Attended</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {registered.length > 0 ? Math.round((attendees.length / registered.length) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-600">Attendance Rate</p>
            </div>
          </div>
        )}

        <div className="px-6 py-4 bg-white border-b border-gray-200 space-y-3 shrink-0">
          {tab !== 'upcoming' && tab !== 'cancelled' && (
            <div className="flex gap-2">
              <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                All Registered ({registered.length})
              </button>
              <button onClick={() => setFilter('attended')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === 'attended' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
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
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {displayedList.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No records found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedList.map(person => (
                <div key={person._id} className={`flex items-center justify-between p-4 rounded-lg border-2 ${hasAttended(person._id) && tab !== 'upcoming' && tab !== 'cancelled' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-gray-600 bg-white px-2 py-1 rounded border border-gray-300">
                      {person.skIdNumber || 'N/A'}
                    </span>
                    <span className="font-semibold text-gray-800">{formatFullName(person)}</span>
                    {hasAttended(person._id) && tab !== 'upcoming' && tab !== 'cancelled' && (
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">✓ ATTENDED</span>
                    )}
                  </div>
                  <button 
                    onClick={() => onViewProfile(person)} 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end shrink-0">
          <button onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewEvents;