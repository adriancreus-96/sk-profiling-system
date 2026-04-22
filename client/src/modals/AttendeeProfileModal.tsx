import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, MapPin, User as UserIcon, Calendar, Hash, Mail, Phone,
  GraduationCap, Briefcase, Heart, CheckCircle, Award, Home, Tag
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173"

interface AttendeeData {
  _id: string; skIdNumber?: string; firstName: string; lastName: string;
  middleName?: string; suffix?: string; sex: 'Male' | 'Female'; birthday: Date;
  profilePicture?: string; age?: number; youthAgeGroup?: string;
  block?: string; lot?: string; houseNumber?: string; street?: string; purok: string;
  email: string; contactNumber: string; status: string; points?: number;
  civilStatus?: string; educationalBackground?: string; youthClassification?: string; workStatus?: string;
  registeredSkVoter?: boolean; registeredNationalVoter?: boolean;
  isPwd?: boolean; isCicwl?: boolean; isIndigenous?: boolean;
}

interface EventAttendance {
  eventId: string; title: string; eventDate: string;
  location: string; category: string; pointsReward: number; attended: boolean;
}

interface AttendeeProfileModalProps {
  attendee: AttendeeData | null; isOpen: boolean; onClose: () => void;
}

const AttendeeProfileModal: React.FC<AttendeeProfileModalProps> = ({ attendee, isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'profile'>('events');
  const [eventsAttended, setEventsAttended] = useState<EventAttendance[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  useEffect(() => {
    if (attendee && isOpen) {
      setActiveTab('events');
      if (attendee._id) fetchUserEvents(attendee._id);
    }
  }, [attendee?._id, isOpen]);

  const fetchUserEvents = async (userId: string) => {
    setLoadingEvents(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await axios.get(`${API_URL}/api/events/user/${userId}/attendance`, { headers: { Authorization: `Bearer ${token}` } });
      setEventsAttended(res.data || []);
    } catch { setEventsAttended([]); }
    finally { setLoadingEvents(false); }
  };

  if (!isOpen || !attendee || !mounted) return null;

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const getFullAddress = () => {
    const parts = [];
    if (attendee.block) parts.push(`Block ${attendee.block}`);
    if (attendee.lot) parts.push(`Lot ${attendee.lot}`);
    if (attendee.houseNumber) parts.push(`#${attendee.houseNumber}`);
    if (attendee.street) parts.push(attendee.street);
    if (attendee.purok) parts.push(attendee.purok);
    return parts.join(', ') || 'N/A';
  };

  const InfoField = ({ label, value, icon: Icon }: { label: string; value: string | number | undefined; icon?: any; }) => (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 font-work">
        {Icon && <Icon className="w-3 h-3" />}{label}
      </label>
      <div className="font-medium px-3 py-2.5 rounded-lg border bg-gray-50 border-gray-200 text-[#00171F] font-work">
        {value || 'N/A'}
      </div>
    </div>
  );

  const renderEventsTab = () => (
    <div className="overflow-y-auto flex-1 p-8">
      <h4 className="text-lg font-bold text-[#00171F] mb-6 flex items-center gap-2 font-fugaz">
        <Calendar className="w-5 h-5 text-[#007EA7]" />Events Attended ({eventsAttended.length})
      </h4>
      {loadingEvents ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-[#007EA7] border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-400 mt-4 font-work">Loading events...</p>
        </div>
      ) : eventsAttended.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Calendar className="w-16 h-16 text-[#B3D9E5] mx-auto mb-4" />
          <p className="text-gray-500 font-medium font-work">No events attended yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {eventsAttended.map(event => (
            <div key={event.eventId} className={`p-4 rounded-lg border-2 ${event.attended ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-bold text-[#00171F] font-fugaz">{event.title}</h5>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded font-work ${event.attended ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {event.attended ? '✓ ATTENDED' : 'REGISTERED'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2 font-work"><Calendar className="w-4 h-4 text-[#007EA7]" /><span>{formatDate(event.eventDate)}</span></div>
                    <div className="flex items-center gap-2 font-work"><MapPin className="w-4 h-4 text-red-500" /><span>{event.location}</span></div>
                    <div className="flex items-center gap-2 font-work"><Tag className="w-4 h-4 text-purple-500" /><span>{event.category}</span></div>
                    <div className="flex items-center gap-2 font-work"><Award className="w-4 h-4 text-yellow-500" /><span className="font-semibold text-yellow-700">{event.pointsReward} points</span></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfileTab = () => (
    <div className="overflow-y-auto flex-1 p-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start mb-8 pb-8 border-b border-gray-200">
        <div className="flex flex-col items-center gap-3">
          {attendee.profilePicture ? (
            <img src={attendee.profilePicture} alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-[#B3D9E5] shadow-lg"
              onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${attendee.firstName}+${attendee.lastName}&size=200&background=007EA7&color=fff`; }} />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#5CB0B3] to-[#007EA7] text-white flex items-center justify-center text-5xl font-bold border-4 border-white shadow-lg font-fugaz">
              {attendee.firstName?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <h3 className="text-3xl font-bold text-[#00171F] font-fugaz">
            {attendee.lastName}, {attendee.firstName} {attendee.middleName || ''} {attendee.suffix || ''}
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-[#EAF4F7] text-[#007EA7] border border-[#B3D9E5] font-work">
              <Hash className="w-3.5 h-3.5 mr-1" />{attendee.skIdNumber || 'No ID Assigned'}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold border-2 font-work ${attendee.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-yellow-50 text-yellow-700 border-yellow-300'}`}>
              {attendee.status}
            </span>
            {attendee.points !== undefined && (
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-[#EAF4F7] text-[#003459] border border-[#B3D9E5] font-work">
                <Award className="w-3.5 h-3.5 mr-1" />{attendee.points} Points
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz"><UserIcon className="w-5 h-5 text-[#007EA7]" />Personal Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoField label="First Name" value={attendee.firstName} />
          <InfoField label="Last Name" value={attendee.lastName} />
          <InfoField label="Middle Name" value={attendee.middleName} />
          <InfoField label="Suffix" value={attendee.suffix} />
          <InfoField label="Sex" value={attendee.sex} />
          <InfoField label="Birthday" value={attendee.birthday ? formatDate(attendee.birthday) : undefined} icon={Calendar} />
          <InfoField label="Age" value={attendee.age} />
          <InfoField label="Youth Age Group" value={attendee.youthAgeGroup} />
          <InfoField label="Civil Status" value={attendee.civilStatus} icon={Heart} />
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz"><Phone className="w-5 h-5 text-[#007EA7]" />Contact Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Email" value={attendee.email} icon={Mail} />
          <InfoField label="Contact Number" value={attendee.contactNumber} icon={Phone} />
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz"><MapPin className="w-5 h-5 text-[#007EA7]" />Address Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoField label="Block" value={attendee.block} />
          <InfoField label="Lot" value={attendee.lot} />
          <InfoField label="House Number" value={attendee.houseNumber} />
          <InfoField label="Street" value={attendee.street} />
          <InfoField label="Purok" value={attendee.purok} icon={Home} />
        </div>
        <div className="mt-4"><InfoField label="Full Address" value={getFullAddress()} icon={MapPin} /></div>
      </div>

      <div className="mb-8">
        <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz"><GraduationCap className="w-5 h-5 text-[#007EA7]" />Education & Employment</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Educational Background" value={attendee.educationalBackground} icon={GraduationCap} />
          <InfoField label="Youth Classification" value={attendee.youthClassification} />
          <InfoField label="Work Status" value={attendee.workStatus} icon={Briefcase} />
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz"><CheckCircle className="w-5 h-5 text-[#007EA7]" />Registration & Categories</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {[{ label: 'SK Voter Registration', val: attendee.registeredSkVoter }, { label: 'National Voter Registration', val: attendee.registeredNationalVoter }].map(({ label, val }) => (
            <div key={label} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-600 font-work">{label}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold font-work ${val ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{val ? 'Registered' : 'Not Registered'}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-[#EAF4F7] border border-[#B3D9E5] rounded-lg p-4">
          <p className="text-xs font-semibold text-[#007EA7] uppercase mb-3 font-work">Special Categories</p>
          <div className="flex flex-wrap gap-2">
            {attendee.isPwd && <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-300 font-work">Person with Disability (PWD)</span>}
            {attendee.isCicwl && <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 border border-pink-300 font-work">Children in Conflict with the Law (CICWL)</span>}
            {attendee.isIndigenous && <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 font-work">Indigenous People (IP)</span>}
            {!attendee.isPwd && !attendee.isCicwl && !attendee.isIndigenous && <span className="text-sm text-gray-500 italic font-work">No special categories</span>}
          </div>
        </div>
      </div>
    </div>
  );

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#007EA7] to-[#003459] border-b border-[#005f80] shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-fugaz tracking-wide">
            <UserIcon className="w-5 h-5" />Youth Profile
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* TABS */}
        <div className="bg-white border-b border-gray-200 px-6 shrink-0">
          <div className="flex gap-4">
            <button onClick={() => setActiveTab('events')}
              className={`px-4 py-3 font-semibold font-work transition-colors relative flex items-center gap-2 ${activeTab === 'events' ? 'text-[#007EA7] border-b-2 border-[#007EA7]' : 'text-gray-500 hover:text-gray-700'}`}>
              Events Attended
              {eventsAttended.length > 0 && <span className="bg-[#EAF4F7] text-[#007EA7] text-xs font-bold px-2 py-0.5 rounded-full">{eventsAttended.length}</span>}
            </button>
            <button onClick={() => setActiveTab('profile')}
              className={`px-4 py-3 font-semibold font-work transition-colors relative ${activeTab === 'profile' ? 'text-[#007EA7] border-b-2 border-[#007EA7]' : 'text-gray-500 hover:text-gray-700'}`}>
              Profile Information
            </button>
          </div>
        </div>

        {activeTab === 'events' ? renderEventsTab() : renderProfileTab()}

        {/* FOOTER */}
        <div className="bg-[#EAF4F7] px-8 py-5 border-t border-[#B3D9E5] flex justify-end items-center shrink-0">
          <button onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-work">
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AttendeeProfileModal;