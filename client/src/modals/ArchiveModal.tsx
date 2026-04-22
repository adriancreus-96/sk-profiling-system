import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, MapPin, User as UserIcon, Calendar, Hash, Mail, Phone,
  GraduationCap, Briefcase, Heart, CheckCircle, Award, Home, RotateCcw, Archive
} from 'lucide-react';

export interface UserData {
  _id: string; skIdNumber?: string; firstName: string; lastName: string;
  middleName?: string; suffix?: string; sex: 'Male' | 'Female'; birthday: Date;
  profilePicture?: string; age?: number; youthAgeGroup?: string;
  block?: string; lot?: string; houseNumber?: string; street?: string; purok: string;
  email: string; contactNumber: string; status: 'Pending' | 'Approved' | 'Rejected' | 'Archived' | string;
  points?: number; qrCode?: string; civilStatus?: string; educationalBackground?: string;
  youthClassification?: string; workStatus?: string;
  registeredSkVoter?: boolean; registeredNationalVoter?: boolean;
  isPwd?: boolean; isCicwl?: boolean; isIndigenous?: boolean;
}

interface ArchiveModalProps {
  user: UserData | null; isOpen: boolean; onClose: () => void;
  onRestore?: (id: string) => Promise<void>;
  onPermanentDelete?: (id: string) => Promise<void>;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({ user, isOpen, onClose, onRestore, onPermanentDelete }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  if (!isOpen || !user || !mounted) return null;

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const getFullAddress = () => {
    const parts = [];
    if (user.block) parts.push(`Block ${user.block}`);
    if (user.lot) parts.push(`Lot ${user.lot}`);
    if (user.houseNumber) parts.push(`#${user.houseNumber}`);
    if (user.street) parts.push(user.street);
    if (user.purok) parts.push(user.purok);
    return parts.join(', ') || 'N/A';
  };

  const handleRestore = () => {
    if (!window.confirm('Are you sure you want to restore this user to active status?')) return;
    onRestore?.(user._id);
  };

  const handlePermanentDelete = () => {
    if (!window.confirm('⚠️ WARNING: This will permanently delete this user. This action CANNOT be undone. Are you absolutely sure?')) return;
    if (prompt('Type "DELETE" in all caps to confirm:') !== 'DELETE') { alert('Deletion cancelled.'); return; }
    onPermanentDelete?.(user._id);
  };

  const InfoField = ({ label, value, icon: Icon }: { label: string; value: string | number | undefined; icon?: any; }) => (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 font-work">
        {Icon && <Icon className="w-3 h-3" />}{label}
      </label>
      <div className="font-medium text-[#00171F] bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200 font-work">
        {value || 'N/A'}
      </div>
    </div>
  );

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* HEADER — dark navy for archived/inactive state */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#003459] to-[#00171F] border-b border-[#00171F] shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-fugaz tracking-wide">
            <Archive className="w-5 h-5" />Archived Youth Profile
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto flex-1 p-8">

          {/* Archive Notice */}
          <div className={`mb-6 p-4 rounded-xl border-2 ${user.status === 'Rejected' ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'}`}>
            <div className="flex items-center gap-3">
              <Archive className={`w-5 h-5 shrink-0 ${user.status === 'Rejected' ? 'text-red-600' : 'text-orange-600'}`} />
              <div>
                <p className={`font-bold text-sm font-fugaz ${user.status === 'Rejected' ? 'text-red-800' : 'text-orange-800'}`}>
                  {user.status === 'Rejected' ? '⚠️ This profile was rejected and archived' : '📅 This profile was automatically archived (Age 31 or older)'}
                </p>
                <p className="text-xs text-gray-600 mt-1 font-work">
                  {user.status === 'Archived'
                    ? 'Users are automatically archived when they turn 31 years old.'
                    : 'You can restore this profile or permanently delete it from the system.'}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row gap-6 items-start mb-8 pb-8 border-b border-gray-200">
            <div className="shrink-0">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-300 shadow-lg opacity-60 grayscale"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              ) : null}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 text-white flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg opacity-60 font-fugaz"
                style={{ display: user.profilePicture ? 'none' : 'flex' }}>
                {user.firstName?.charAt(0) || '?'}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-3xl font-bold text-[#00171F] font-fugaz">
                {user.lastName}, {user.firstName} {user.middleName || ''} {user.suffix || ''}
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border border-gray-300 font-work">
                  <Hash className="w-3.5 h-3.5 mr-1" />{user.skIdNumber || 'No ID Assigned'}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold border-2 font-work ${
                  user.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-300'
                  : user.status === 'Archived' ? 'bg-orange-50 text-orange-700 border-orange-300'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}>{user.status}</span>
                {user.points !== undefined && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border border-gray-300 font-work">
                    <Award className="w-3.5 h-3.5 mr-1" />{user.points} Points
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Personal */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz"><UserIcon className="w-5 h-5 text-gray-500" />Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoField label="Sex" value={user.sex} />
              <InfoField label="Birthday" value={user.birthday ? formatDate(user.birthday) : undefined} icon={Calendar} />
              <InfoField label="Age" value={user.age} />
              <InfoField label="Youth Age Group" value={user.youthAgeGroup} />
              <InfoField label="Civil Status" value={user.civilStatus} icon={Heart} />
            </div>
          </div>

          {/* Contact */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz"><Phone className="w-5 h-5 text-gray-500" />Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Email" value={user.email} icon={Mail} />
              <InfoField label="Contact Number" value={user.contactNumber} icon={Phone} />
            </div>
          </div>

          {/* Address */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz"><MapPin className="w-5 h-5 text-gray-500" />Address Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoField label="Block" value={user.block} />
              <InfoField label="Lot" value={user.lot} />
              <InfoField label="House Number" value={user.houseNumber} />
              <InfoField label="Street" value={user.street} />
              <InfoField label="Purok" value={user.purok} icon={Home} />
            </div>
            <div className="mt-4"><InfoField label="Full Address" value={getFullAddress()} icon={MapPin} /></div>
          </div>

          {/* Education */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz"><GraduationCap className="w-5 h-5 text-gray-500" />Education & Employment</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Educational Background" value={user.educationalBackground} icon={GraduationCap} />
              <InfoField label="Youth Classification" value={user.youthClassification} />
              <InfoField label="Work Status" value={user.workStatus} icon={Briefcase} />
            </div>
          </div>

          {/* Registration */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz"><CheckCircle className="w-5 h-5 text-gray-500" />Registration & Categories</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {[{ label: 'SK Voter Registration', val: user.registeredSkVoter }, { label: 'National Voter Registration', val: user.registeredNationalVoter }].map(({ label, val }) => (
                <div key={label} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600 font-work">{label}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold font-work ${val ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{val ? 'Registered' : 'Not Registered'}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3 font-work">Special Categories</p>
              <div className="flex flex-wrap gap-2">
                {user.isPwd && <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-300 font-work">Person with Disability (PWD)</span>}
                {user.isCicwl && <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 border border-pink-300 font-work">Children in Conflict with the Law (CICWL)</span>}
                {user.isIndigenous && <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 font-work">Indigenous People (IP)</span>}
                {!user.isPwd && !user.isCicwl && !user.isIndigenous && <span className="text-sm text-gray-500 italic font-work">No special categories</span>}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-[#EAF4F7] px-8 py-5 border-t border-[#B3D9E5] flex justify-between items-center shrink-0">
          <button onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-work">
            Close
          </button>
          <div className="flex gap-3">
            {onPermanentDelete && (
              <button onClick={handlePermanentDelete}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-md font-work flex items-center gap-2">
                <X className="w-4 h-4" />Permanently Delete
              </button>
            )}
            {onRestore && (
              <button onClick={handleRestore}
                className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition duration-200 shadow-md font-fugaz tracking-[0.05em] flex items-center gap-2"
                style={{ background: '#003459' }}
                onMouseOver={e => (e.currentTarget.style.background = '#00171F')}
                onMouseOut={e => (e.currentTarget.style.background = '#003459')}>
                <RotateCcw className="w-4 h-4" />Restore Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ArchiveModal;