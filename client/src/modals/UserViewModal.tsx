import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, MapPin, User as UserIcon, Calendar, Hash, Mail, Phone,
  GraduationCap, Briefcase, Heart, CheckCircle, Award, Home, Camera, Printer, Tag
} from 'lucide-react';
import axios from 'axios';
import PrintIDModule from './PrintIDModal';

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173"

export interface UserData {
  _id: string;
  skIdNumber?: string;
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
  status: 'Pending' | 'Approved' | 'Rejected' | 'Archived' | string;
  points?: number;
  qrCode?: string;
  civilStatus?: string;
  educationalBackground?: string;
  youthClassification?: string;
  workStatus?: string;
  registeredSkVoter?: boolean;
  registeredNationalVoter?: boolean;
  isPwd?: boolean;
  isCicwl?: boolean;
  isIndigenous?: boolean;
  dateApproved?: Date | null;
  idPrinted?: boolean;
  datePrinted?: Date | null;
}

interface EventAttendance {
  eventId: string;
  title: string;
  eventDate: string;
  location: string;
  category: string;
  pointsReward: number;
  attended: boolean;
}

interface UserViewModalProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  onEdit?: (id: string) => void;
  onSave?: (updatedUser: UserData, originalUser: UserData, newProfilePicture?: File) => Promise<void>;
  onCancelEdit?: () => void;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string) => Promise<void>;
  onPrintComplete?: (userId: string) => Promise<void>;
}

const UserViewModal: React.FC<UserViewModalProps> = ({
  user, isOpen, onClose, isEditMode = false,
  onEdit, onSave, onCancelEdit, onApprove, onReject, onPrintComplete
}) => {
  const [mounted, setMounted] = useState(false);
  const [editedUser, setEditedUser] = useState<UserData | null>(null);
  const [ageError, setAgeError] = useState<string>('');
  const [newProfilePicture, setNewProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'events'>('profile');
  const [eventsAttended, setEventsAttended] = useState<EventAttendance[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  useEffect(() => {
    if (user && isOpen) {
      setEditedUser({ ...user });
      setAgeError('');
      setNewProfilePicture(null);
      setPreviewUrl('');
      setActiveTab('profile');
      if (user._id) fetchUserEvents(user._id);
    }
  }, [user?._id, isEditMode, isOpen]);

  const fetchUserEvents = async (userId: string) => {
    setLoadingEvents(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${API_URL}/api/events/user/${userId}/attendance`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEventsAttended(response.data || []);
    } catch { setEventsAttended([]); }
    finally { setLoadingEvents(false); }
  };

  const validateAge = (birthDate: Date): string => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age < 15) return 'User must be at least 15 years old';
    if (age > 30) return 'User must be no older than 30 years old';
    return '';
  };

  const getBirthdayConstraints = () => {
    const today = new Date();
    const max = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());
    const min = new Date(today.getFullYear() - 31, today.getMonth(), today.getDate() + 1);
    return { min: min.toISOString().split('T')[0], max: max.toISOString().split('T')[0] };
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image size should be less than 5MB'); return; }
    setNewProfilePicture(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const isFieldEditable = (field: keyof UserData): boolean => {
    if (!user) return false;
    if (['_id', 'age', 'youthAgeGroup', 'points', 'qrCode', 'skIdNumber'].includes(field)) return false;
    if (user.status === 'Pending') {
      if (field === 'email' || field === 'contactNumber') return false;
      return true;
    }
    if (user.status === 'Approved') {
      if (['firstName', 'lastName', 'middleName', 'suffix', 'email', 'contactNumber'].includes(field)) return false;
      return true;
    }
    return false;
  };

  if (!isOpen || !user || !mounted || !editedUser) return null;

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const getFullAddress = () => {
    const u = isEditMode ? editedUser : user;
    const parts = [];
    if (u.block) parts.push(`Block ${u.block}`);
    if (u.lot) parts.push(`Lot ${u.lot}`);
    if (u.houseNumber) parts.push(`#${u.houseNumber}`);
    if (u.street) parts.push(u.street);
    if (u.purok) parts.push(u.purok);
    return parts.join(', ') || 'N/A';
  };

  const handleInputChange = (field: keyof UserData, value: any) => {
    setEditedUser(prev => prev ? { ...prev, [field]: value } : null);
    if (field === 'birthday') setAgeError(validateAge(new Date(value)));
  };

  const handleSave = () => {
    if (ageError) { alert('Please fix the age validation error'); return; }
    if (editedUser?.firstName && editedUser?.lastName && editedUser?.email && editedUser?.contactNumber) {
      onSave?.(editedUser, user, newProfilePicture || undefined);
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleCancelEdit = () => {
    setEditedUser({ ...user });
    setAgeError('');
    setNewProfilePicture(null);
    setPreviewUrl('');
    onCancelEdit?.();
  };

  const handleReject = () => {
    if (!window.confirm('Are you sure you want to reject this user? This action cannot be undone.')) return;
    onReject?.(user._id);
  };

  const birthdayConstraints = getBirthdayConstraints();
  const displayPictureUrl = previewUrl || editedUser.profilePicture || user.profilePicture || '';
  const canEditPicture = isEditMode && (user.status === 'Pending' || user.status === 'Approved');
  const canEditUser = user.status === 'Pending' || user.status === 'Approved';
  const canPrintID = user.status === 'Approved' && user.skIdNumber && !user.idPrinted;

  const InfoField = ({ label, value, icon: Icon, field, type = 'text', options }: {
    label: string; value: string | number | undefined; icon?: any;
    field?: keyof UserData; type?: 'text' | 'email' | 'tel' | 'date' | 'select' | 'checkbox';
    options?: string[];
  }) => {
    const canEdit = field ? isFieldEditable(field) : false;

    if (isEditMode && field && canEdit) {
      if (type === 'select' && options) {
        return (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 font-work">
              {Icon && <Icon className="w-3 h-3" />}{label}
            </label>
            <select
              value={editedUser![field] as string || ''}
              onChange={e => handleInputChange(field, e.target.value)}
              className="w-full font-medium text-[#00171F] bg-white px-3 py-2.5 rounded-lg border-2 border-[#5CB0B3] focus:border-[#007EA7] focus:outline-none font-work"
            >
              <option value="">Select...</option>
              {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        );
      }
      if (type === 'date') {
        const dateValue = editedUser![field]
          ? new Date(editedUser![field] as Date).toISOString().split('T')[0] : '';
        return (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 font-work">
              {Icon && <Icon className="w-3 h-3" />}{label}
            </label>
            <input
              type="date" value={dateValue}
              onChange={e => handleInputChange(field, new Date(e.target.value))}
              min={birthdayConstraints.min} max={birthdayConstraints.max}
              className={`w-full font-medium text-[#00171F] bg-white px-3 py-2.5 rounded-lg border-2 focus:outline-none font-work ${ageError && field === 'birthday' ? 'border-red-500 focus:border-red-600' : 'border-[#5CB0B3] focus:border-[#007EA7]'
                }`}
            />
            {ageError && field === 'birthday' && <p className="text-sm text-red-600 font-medium font-work">{ageError}</p>}
          </div>
        );
      }
      if (type === 'checkbox') {
        return (
          <div className="bg-white border-2 border-[#5CB0B3] rounded-lg p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-gray-600 font-work">{label}</span>
              <input
                type="checkbox"
                checked={editedUser![field] as boolean || false}
                onChange={e => handleInputChange(field, e.target.checked)}
                className="w-5 h-5 rounded focus:ring-2 focus:ring-[#007EA7]"
              />
            </label>
          </div>
        );
      }
      const isRequired = ['firstName', 'lastName'].includes(field);
      return (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 font-work">
            {Icon && <Icon className="w-3 h-3" />}{label}
            {isRequired && <span className="text-red-600">*</span>}
          </label>
          <input
            type={type}
            defaultValue={editedUser![field] as string || ''}
            onBlur={e => handleInputChange(field, e.target.value)}
            required={isRequired}
            className="w-full font-medium text-[#00171F] bg-white px-3 py-2.5 rounded-lg border-2 border-[#5CB0B3] focus:border-[#007EA7] focus:outline-none font-work"
          />
        </div>
      );
    }

    const isProtected = isEditMode && field && !canEdit;
    return (
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 font-work">
          {Icon && <Icon className="w-3 h-3" />}{label}
          {isProtected && <span className="text-orange-500 text-[10px]">(Protected)</span>}
        </label>
        <div className={`font-medium px-3 py-2.5 rounded-lg border font-work ${isProtected
          ? 'text-gray-500 bg-gray-100 border-2 border-gray-300'
          : 'text-[#00171F] bg-gray-50 border border-gray-200'
          }`}>
          {value || 'N/A'}
        </div>
      </div>
    );
  };

  const renderProfileTab = () => (
    <div className="overflow-y-auto flex-1 p-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start mb-8 pb-8 border-b border-gray-200">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {displayPictureUrl ? (
              <img
                src={displayPictureUrl} alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-[#B3D9E5] shadow-lg"
                onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&size=200&background=007EA7&color=fff`; }}
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#5CB0B3] to-[#007EA7] text-white flex items-center justify-center text-5xl font-bold border-4 border-white shadow-lg font-fugaz">
                {user.firstName?.charAt(0) || '?'}
              </div>
            )}
            {previewUrl && canEditPicture && (
              <button type="button" onClick={() => { setNewProfilePicture(null); setPreviewUrl(''); }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition shadow-lg">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {canEditPicture && (
            <label className="cursor-pointer bg-[#EAF4F7] hover:bg-[#d4eef4] text-[#007EA7] px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-sm font-work">
              <Camera className="w-4 h-4" />
              {displayPictureUrl ? 'Change Photo' : 'Upload Photo'}
              <input type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
            </label>
          )}
          {canEditPicture && <p className="text-xs text-gray-400 text-center font-work">Max 5MB</p>}
        </div>

        <div className="flex-1 space-y-3">
          <h3 className="text-3xl font-bold text-[#00171F] font-fugaz">
            {user.lastName}, {user.firstName} {user.middleName || ''} {user.suffix || ''}
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-[#EAF4F7] text-[#007EA7] border border-[#B3D9E5] font-work">
              <Hash className="w-3.5 h-3.5 mr-1" />{user.skIdNumber || 'No ID Assigned'}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold border-2 font-work ${user.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-300'
              : user.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-300'
                : user.status === 'Archived' ? 'bg-orange-50 text-orange-700 border-orange-300'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-300'
              }`}>{user.status}</span>
            {user.points !== undefined && (
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-[#EAF4F7] text-[#003459] border border-[#B3D9E5] font-work">
                <Award className="w-3.5 h-3.5 mr-1" />{user.points} Points
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="mb-8">
        <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz">
          <UserIcon className="w-5 h-5 text-[#007EA7]" />Personal Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoField label="First Name" value={user.firstName} field="firstName" />
          <InfoField label="Last Name" value={user.lastName} field="lastName" />
          <InfoField label="Middle Name" value={user.middleName} field="middleName" />
          <InfoField label="Suffix" value={user.suffix} field="suffix" />
          <InfoField label="Sex" value={user.sex} field="sex" type="select" options={['Male', 'Female']} />
          <InfoField label="Birthday (Age 15–30)" value={user.birthday ? formatDate(user.birthday) : undefined} field="birthday" type="date" icon={Calendar} />
          <InfoField label="Age" value={user.age} />
          <InfoField label="Youth Age Group" value={user.youthAgeGroup} />
          <InfoField label="Civil Status" value={user.civilStatus} field="civilStatus" type="select" options={['Single', 'Married', 'Widowed', 'Separated', 'Live-in', 'Annulled', 'Others']} icon={Heart} />
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-8">
        <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz">
          <Phone className="w-5 h-5 text-[#007EA7]" />Contact Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Email" value={user.email} field="email" type="email" icon={Mail} />
          <InfoField label="Contact Number" value={user.contactNumber} field="contactNumber" type="tel" icon={Phone} />
        </div>
      </div>

      {/* Address */}
      <div className="mb-8">
        <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz">
          <MapPin className="w-5 h-5 text-[#007EA7]" />Address Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoField label="Block" value={user.block} field="block" />
          <InfoField label="Lot" value={user.lot} field="lot" />
          <InfoField label="House Number" value={user.houseNumber} field="houseNumber" />
          <InfoField label="Street" value={user.street} field="street" />
          <InfoField label="Purok" value={user.purok} field="purok" type="select" options={['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6', 'Purok 7']} icon={Home} />
        </div>
        <div className="mt-4"><InfoField label="Full Address" value={getFullAddress()} icon={MapPin} /></div>
      </div>

      {/* Education & Work */}
      <div className="mb-8">
        <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz">
          <GraduationCap className="w-5 h-5 text-[#007EA7]" />Education & Employment
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Educational Background" value={user.educationalBackground} field="educationalBackground" type="select"
            options={['Elementary Level', 'Elementary Grad', 'High School Level', 'High School Grad', 'Vocational Grad', 'College Level', 'College Grad', 'Masters Level', 'Masters Grad', 'Doctorate Level', 'Doctorate Graduate']} icon={GraduationCap} />
          <InfoField label="Youth Classification" value={user.youthClassification} field="youthClassification" type="select"
            options={['In School Youth', 'Out of School Youth', 'Working Youth', 'Youth with Specific Needs']} />
          <InfoField label="Work Status" value={user.workStatus} field="workStatus" type="select"
            options={['Employed', 'Unemployed', 'Self-Employed', 'Currently looking for a Job', 'Not Interested Looking for a Job']} icon={Briefcase} />
        </div>
      </div>

      {/* Registration & Categories */}
      <div className="mb-8">
        <h4 className="text-lg font-bold text-[#00171F] mb-4 flex items-center gap-2 font-fugaz">
          <CheckCircle className="w-5 h-5 text-[#007EA7]" />Registration & Categories
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {isEditMode && canEditUser ? (
            <>
              <InfoField label="SK Voter Registration" value={user.registeredSkVoter ? 'Yes' : 'No'} field="registeredSkVoter" type="checkbox" />
              <InfoField label="National Voter Registration" value={user.registeredNationalVoter ? 'Yes' : 'No'} field="registeredNationalVoter" type="checkbox" />
            </>
          ) : (
            <>
              {[
                { label: 'SK Voter Registration', val: user.registeredSkVoter },
                { label: 'National Voter Registration', val: user.registeredNationalVoter },
              ].map(({ label, val }) => (
                <div key={label} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-600 font-work">{label}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold font-work ${val ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {val ? 'Registered' : 'Not Registered'}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        {isEditMode && canEditUser ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoField label="Person with Disability (PWD)" value={user.isPwd ? 'Yes' : 'No'} field="isPwd" type="checkbox" />
            <InfoField label="CICWL" value={user.isCicwl ? 'Yes' : 'No'} field="isCicwl" type="checkbox" />
            <InfoField label="Indigenous People (IP)" value={user.isIndigenous ? 'Yes' : 'No'} field="isIndigenous" type="checkbox" />
          </div>
        ) : (
          <div className="bg-[#EAF4F7] border border-[#B3D9E5] rounded-lg p-4">
            <p className="text-xs font-semibold text-[#007EA7] uppercase mb-3 font-work">Special Categories</p>
            <div className="flex flex-wrap gap-2">
              {user.isPwd && <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-300 font-work">Person with Disability (PWD)</span>}
              {user.isCicwl && <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 border border-pink-300 font-work">Children in Conflict with the Law (CICWL)</span>}
              {user.isIndigenous && <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300 font-work">Indigenous People (IP)</span>}
              {!user.isPwd && !user.isCicwl && !user.isIndigenous && <span className="text-sm text-gray-500 italic font-work">No special categories</span>}
            </div>
          </div>
        )}
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
              <div className="flex items-start justify-between gap-4">
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

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-[#007EA7] to-[#003459] border-b border-[#005f80] shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 font-fugaz tracking-wide">
              <UserIcon className="w-5 h-5" />
              {isEditMode ? 'Edit Youth Profile' : 'Youth Profile Details'}
            </h2>
            <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all">
              <X size={20} />
            </button>
          </div>

          {/* TABS */}
          {!isEditMode && (
            <div className="bg-white border-b border-gray-200 px-6 shrink-0">
              <div className="flex gap-4">
                {(['profile', 'events'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 font-semibold font-work transition-colors relative flex items-center gap-2 ${activeTab === tab ? 'text-[#007EA7] border-b-2 border-[#007EA7]' : 'text-gray-500 hover:text-gray-700'
                      }`}>
                    {tab === 'profile' ? 'Profile Information' : 'Events Attended'}
                    {tab === 'events' && eventsAttended.length > 0 && (
                      <span className="bg-[#EAF4F7] text-[#007EA7] text-xs font-bold px-2 py-0.5 rounded-full">
                        {eventsAttended.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* BODY */}
          {activeTab === 'profile' ? renderProfileTab() : renderEventsTab()}

          {/* FOOTER */}
          <div className="bg-[#EAF4F7] px-8 py-5 border-t border-[#B3D9E5] flex justify-between items-center shrink-0">
            {isEditMode ? (
              <>
                <button onClick={handleCancelEdit}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-work">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={!!ageError}
                  className="px-8 py-2.5 text-sm font-semibold text-white rounded-lg transition duration-200 shadow-md font-fugaz tracking-[0.05em] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: ageError ? '#9ca3af' : '#003459' }}
                  onMouseOver={e => { if (!ageError) (e.currentTarget as HTMLButtonElement).style.background = '#00171F'; }}
                  onMouseOut={e => { if (!ageError) (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}>
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-work">
                  Close
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setShowPrintModal(true)}
                    className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition duration-200 shadow-md font-fugaz tracking-[0.05em] flex items-center gap-2"
                    style={{ background: '#003459' }}
                    onMouseOver={e => (e.currentTarget.style.background = '#00171F')}
                    onMouseOut={e => (e.currentTarget.style.background = '#003459')}>
                    <Printer className="w-4 h-4" />Print ID
                  </button>
                  {onEdit && canEditUser && (
                    <button onClick={() => onEdit(user._id)}
                      className="px-6 py-2.5 text-sm font-semibold text-[#007EA7] bg-[#EAF4F7] border-2 border-[#B3D9E5] rounded-lg hover:bg-[#d4eef4] transition-colors shadow-sm font-work">
                      Edit Profile
                    </button>
                  )}
                  {onReject && user.status === 'Pending' && (
                    <button onClick={handleReject}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-md font-work">
                      Reject User
                    </button>
                  )}
                  {onApprove && user.status === 'Pending' && (
                    <button onClick={() => onApprove(user._id)}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-md font-fugaz tracking-[0.05em]">
                      Approve User
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showPrintModal && (
        <PrintIDModule
          user={user}
          onClose={() => setShowPrintModal(false)}
          onPrintComplete={onPrintComplete}
          onMarkPrinted={async (userId) => {
            const token = localStorage.getItem('adminToken');
            await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/mark-printed`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
          }}
        />)}
    </>
  );

  return createPortal(modalContent, document.body);
};

export default UserViewModal;