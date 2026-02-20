import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, MapPin, User as UserIcon, Calendar, Hash, Mail, Phone, 
  GraduationCap, Briefcase, Heart, CheckCircle, Award, Home, Camera, Printer, Tag
} from 'lucide-react';
import axios from 'axios';
import PrintIDModule from './PrintIDModal';

// Complete User Data Interface matching the User model
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
  user, 
  isOpen, 
  onClose,
  isEditMode = false,
  onEdit,
  onSave,
  onCancelEdit,
  onApprove,
  onReject,
  onPrintComplete
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

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (user && isOpen) {
      setEditedUser({ ...user });
      setAgeError('');
      setNewProfilePicture(null);
      setPreviewUrl('');
      setActiveTab('profile');
      if (user._id) {
        fetchUserEvents(user._id);
      }
    }
  }, [user?._id, isEditMode, isOpen]);

  const fetchUserEvents = async (userId: string) => {
    setLoadingEvents(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `http://localhost:5000/api/events/user/${userId}/attendance`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEventsAttended(response.data || []);
    } catch (error) {
      console.error('Error fetching user events:', error);
      setEventsAttended([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const validateAge = (birthDate: Date): string => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;
    if (age < 15) return 'User must be at least 15 years old';
    if (age > 30) return 'User must be no older than 30 years old';
    return '';
  };

  const getBirthdayConstraints = () => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - 31, today.getMonth(), today.getDate() + 1);
    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0]
    };
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setNewProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removePicture = () => {
    setNewProfilePicture(null);
    setPreviewUrl('');
  };

  const isFieldEditable = (field: keyof UserData): boolean => {
    if (!user) return false;

    const nonEditableFields = ['_id', 'age', 'youthAgeGroup', 'points', 'qrCode', 'skIdNumber'];
    if (nonEditableFields.includes(field)) return false;

    if (user.status === 'Pending') {
      if (field === 'email' || field === 'contactNumber') return false;
      return true;
    }

    if (user.status === 'Approved') {
      const protectedFields = ['firstName', 'lastName', 'middleName', 'suffix', 'email', 'contactNumber'];
      if (protectedFields.includes(field)) return false;
      return true;
    }

    return false;
  };

  if (!isOpen || !user || !mounted || !editedUser) return null;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

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
    if (field === 'birthday') {
      const error = validateAge(new Date(value));
      setAgeError(error);
    }
  };

  const handleSave = () => {
    if (ageError) {
      alert('Please fix the age validation error');
      return;
    }
    if (editedUser && editedUser.firstName && editedUser.lastName && editedUser.email && editedUser.contactNumber) {
      if (onSave) {
        onSave(editedUser, user, newProfilePicture || undefined);
      }
    } else {
      alert('Please fill in all required fields');
    }
  };

  const handleCancelEdit = () => {
    setEditedUser({ ...user });
    setAgeError('');
    setNewProfilePicture(null);
    setPreviewUrl('');
    if (onCancelEdit) onCancelEdit();
  };

  const handleReject = () => {
    if (!window.confirm('Are you sure you want to reject this user? This action cannot be undone.')) return;
    if (onReject) onReject(user._id);
  };

  const birthdayConstraints = getBirthdayConstraints();
  const displayPictureUrl = previewUrl || editedUser.profilePicture || user.profilePicture || '';
  const canEditPicture = isEditMode && (user.status === 'Pending' || user.status === 'Approved');
  const canEditUser = user.status === 'Pending' || user.status === 'Approved';
  const canPrintID = user.status === 'Approved' && user.skIdNumber && !user.idPrinted;

  const InfoField = ({ label, value, icon: Icon, field, type = 'text', options }: { 
    label: string; 
    value: string | number | undefined; 
    icon?: any;
    field?: keyof UserData;
    type?: 'text' | 'email' | 'tel' | 'date' | 'select' | 'checkbox';
    options?: string[];
  }) => {
    const canEdit = field ? isFieldEditable(field) : false;

    if (isEditMode && field && canEdit) {
      if (type === 'select' && options) {
        return (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              {Icon && <Icon className="w-3 h-3" />}
              {label}
            </label>
            <select
              key={`${field}-select`}
              value={editedUser[field] as string || ''}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full font-medium text-gray-900 bg-white px-3 py-2.5 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select...</option>
              {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );
      }

      if (type === 'date') {
        const dateValue = editedUser[field] 
          ? new Date(editedUser[field] as Date).toISOString().split('T')[0] 
          : '';
        return (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              {Icon && <Icon className="w-3 h-3" />}
              {label}
            </label>
            <input
              key={`${field}-date`}
              type="date"
              value={dateValue}
              onChange={(e) => handleInputChange(field, new Date(e.target.value))}
              min={birthdayConstraints.min}
              max={birthdayConstraints.max}
              className={`w-full font-medium text-gray-900 bg-white px-3 py-2.5 rounded-lg border-2 focus:outline-none ${
                ageError && field === 'birthday'
                  ? 'border-red-500 focus:border-red-600'
                  : 'border-blue-300 focus:border-blue-500'
              }`}
            />
            {ageError && field === 'birthday' && (
              <p className="text-sm text-red-600 font-medium">{ageError}</p>
            )}
          </div>
        );
      }

      if (type === 'checkbox') {
        return (
          <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-gray-600">{label}</span>
              <input
                key={`${field}-checkbox`}
                type="checkbox"
                checked={editedUser[field] as boolean || false}
                onChange={(e) => handleInputChange(field, e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
        );
      }

      const isRequired = ['firstName', 'lastName'].includes(field);
      return (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
            {Icon && <Icon className="w-3 h-3" />}
            {label}
            {isRequired && <span className="text-red-600">*</span>}
          </label>
          <input
            key={`${field}-input`}
            type={type}
            defaultValue={editedUser[field] as string || ''}
            onBlur={(e) => handleInputChange(field, e.target.value)}
            required={isRequired}
            className="w-full font-medium text-gray-900 bg-white px-3 py-2.5 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:outline-none"
          />
        </div>
      );
    }

    const isProtected = isEditMode && field && !canEdit;
    return (
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          {Icon && <Icon className="w-3 h-3" />}
          {label}
          {isProtected && <span className="text-orange-600 text-[10px]">(Protected)</span>}
        </label>
        <div className={`font-medium px-3 py-2.5 rounded-lg border ${
          isProtected 
            ? 'text-gray-500 bg-gray-100 border-2 border-gray-300' 
            : 'text-gray-900 bg-gray-50 border border-gray-200'
        }`}>
          {value || "N/A"}
        </div>
      </div>
    );
  };

  const renderProfileTab = () => (
    <div className="overflow-y-auto flex-1 p-8">
      {/* Profile Header Section */}
      <div className="flex flex-col sm:flex-row gap-6 items-start mb-8 pb-8 border-b border-gray-200">
        {/* Profile Picture */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {displayPictureUrl ? (
              <img 
                src={displayPictureUrl}
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow-lg"
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&size=200&background=3b82f6&color=fff`;
                }}
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-5xl font-bold border-4 border-white shadow-lg">
                {user.firstName ? user.firstName.charAt(0) : '?'}
              </div>
            )}
            
            {previewUrl && canEditPicture && (
              <button
                type="button"
                onClick={removePicture}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition shadow-lg"
                title="Remove picture"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {canEditPicture && (
            <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-sm">
              <Camera className="w-4 h-4" />
              {displayPictureUrl ? 'Change Photo' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handlePictureChange}
                className="hidden"
              />
            </label>
          )}

          {canEditPicture && (
            <p className="text-xs text-gray-500 text-center">Max 5MB</p>
          )}
        </div>
        
        <div className="flex-1 space-y-3">
          <h3 className="text-3xl font-bold text-gray-900">
            {user.lastName}, {user.firstName} {user.middleName || ''} {user.suffix || ''}
          </h3>
          
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <Hash className="w-3.5 h-3.5 mr-1" />
              {user.skIdNumber || 'No ID Assigned'}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold border-2 ${
              user.status === 'Approved' 
                ? 'bg-green-50 text-green-700 border-green-300' 
                : user.status === 'Rejected'
                ? 'bg-red-50 text-red-700 border-red-300'
                : user.status === 'Archived'
                ? 'bg-orange-50 text-orange-700 border-orange-300'
                : 'bg-yellow-50 text-yellow-700 border-yellow-300'
            }`}>
              {user.status}
            </span>
            {user.points !== undefined && (
              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                <Award className="w-3.5 h-3.5 mr-1" />
                {user.points} Points
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="mb-8">
        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-blue-600" />
          Personal Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoField label="First Name" value={user.firstName} field="firstName" />
          <InfoField label="Last Name" value={user.lastName} field="lastName" />
          <InfoField label="Middle Name" value={user.middleName} field="middleName" />
          <InfoField label="Suffix" value={user.suffix} field="suffix" />
          <InfoField label="Sex" value={user.sex} field="sex" type="select" options={['Male', 'Female']} />
          <InfoField label="Birthday (Age 15-30)" value={user.birthday ? formatDate(user.birthday) : undefined} field="birthday" type="date" icon={Calendar} />
          <InfoField label="Age" value={user.age} />
          <InfoField label="Youth Age Group" value={user.youthAgeGroup} />
          <InfoField label="Civil Status" value={user.civilStatus} field="civilStatus" type="select" options={['Single', 'Married', 'Widowed', 'Separated', 'Live-in', 'Annulled', 'Others']} icon={Heart} />
        </div>
      </div>

      {/* Contact Information */}
      <div className="mb-8">
        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-600" />
          Contact Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField label="Email" value={user.email} field="email" type="email" icon={Mail} />
          <InfoField label="Contact Number" value={user.contactNumber} field="contactNumber" type="tel" icon={Phone} />
        </div>
      </div>

      {/* Address Information */}
      <div className="mb-8">
        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Address Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoField label="Block" value={user.block} field="block" />
          <InfoField label="Lot" value={user.lot} field="lot" />
          <InfoField label="House Number" value={user.houseNumber} field="houseNumber" />
          <InfoField label="Street" value={user.street} field="street" />
          <InfoField label="Purok" value={user.purok} field="purok" type="select" options={['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6', 'Purok 7']} icon={Home} />
        </div>
        <div className="mt-4">
          <InfoField label="Full Address" value={getFullAddress()} icon={MapPin} />
        </div>
      </div>

      {/* Education & Work */}
      <div className="mb-8">
        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-600" />
          Education & Employment
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoField 
            label="Educational Background" 
            value={user.educationalBackground} 
            field="educationalBackground"
            type="select"
            options={[
              'Elementary Level', 'Elementary Grad',
              'High School Level', 'High School Grad',
              'Vocational Grad',
              'College Level', 'College Grad',
              'Masters Level', 'Masters Grad',
              'Doctorate Level', 'Doctorate Graduate'
            ]}
            icon={GraduationCap} 
          />
          <InfoField 
            label="Youth Classification" 
            value={user.youthClassification}
            field="youthClassification"
            type="select"
            options={[
              'In School Youth', 'Out of School Youth',
              'Working Youth', 'Youth with Specific Needs'
            ]}
          />
          <InfoField 
            label="Work Status" 
            value={user.workStatus}
            field="workStatus"
            type="select"
            options={[
              'Employed', 'Unemployed', 'Self-Employed',
              'Currently looking for a Job',
              'Not Interested Looking for a Job'
            ]}
            icon={Briefcase} 
          />
        </div>
      </div>

      {/* Voter Registration & Special Categories */}
      <div className="mb-8">
        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          Registration & Categories
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {isEditMode && canEditUser ? (
            <>
              <InfoField label="SK Voter Registration" value={user.registeredSkVoter ? 'Yes' : 'No'} field="registeredSkVoter" type="checkbox" />
              <InfoField label="National Voter Registration" value={user.registeredNationalVoter ? 'Yes' : 'No'} field="registeredNationalVoter" type="checkbox" />
            </>
          ) : (
            <>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">SK Voter Registration</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user.registeredSkVoter ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {user.registeredSkVoter ? 'Registered' : 'Not Registered'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-600">National Voter Registration</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user.registeredNationalVoter ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {user.registeredNationalVoter ? 'Registered' : 'Not Registered'}
                  </span>
                </div>
              </div>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-700 uppercase mb-3">Special Categories</p>
            <div className="flex flex-wrap gap-2">
              {user.isPwd && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-300">
                  Person with Disability (PWD)
                </span>
              )}
              {user.isCicwl && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 border border-pink-300">
                  Children in Conflict with the Law (CICWL)
                </span>
              )}
              {user.isIndigenous && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-300">
                  Indigenous People (IP)
                </span>
              )}
              {!user.isPwd && !user.isCicwl && !user.isIndigenous && (
                <span className="text-sm text-gray-500 italic">No special categories</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderEventsTab = () => (
    <div className="overflow-y-auto flex-1 p-8">
      <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        Events Attended ({eventsAttended.length})
      </h4>

      {loadingEvents ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading events...</p>
        </div>
      ) : eventsAttended.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No events attended yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {eventsAttended.map((event) => (
            <div
              key={event.eventId}
              className={`p-4 rounded-lg border-2 ${
                event.attended
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h5 className="font-bold text-gray-900">{event.title}</h5>
                    {event.attended && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                        ✓ ATTENDED
                      </span>
                    )}
                    {!event.attended && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-bold rounded">
                        REGISTERED
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span>{formatDate(event.eventDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-purple-500" />
                      <span>{event.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold text-yellow-700">{event.pointsReward} points</span>
                    </div>
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
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        />
        
        <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
          
          {/* HEADER */}
          <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-500 shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              {isEditMode ? 'Edit Youth Profile' : 'Youth Profile Details'}
            </h2>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* TABS */}
          {!isEditMode && (
            <div className="bg-white border-b border-gray-200 px-6 shrink-0">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-3 font-semibold transition-colors relative ${
                    activeTab === 'profile'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('events')}
                  className={`px-4 py-3 font-semibold transition-colors relative flex items-center gap-2 ${
                    activeTab === 'events'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Events Attended
                  {eventsAttended.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {eventsAttended.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* BODY */}
          {activeTab === 'profile' ? renderProfileTab() : renderEventsTab()}

          {/* FOOTER */}
          <div className="bg-gray-50 px-8 py-5 border-t border-gray-300 flex justify-between items-center shrink-0">
            {isEditMode ? (
              <>
                <button 
                  onClick={handleCancelEdit}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!!ageError}
                  className={`px-8 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors shadow-md ${
                    ageError ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={onClose}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
                >
                  Close
                </button>

                <div className="flex gap-3">
                  {canPrintID && (
                    <button 
                      onClick={() => setShowPrintModal(true)}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-md flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print ID
                    </button>
                  )}
                  {onEdit && canEditUser && (
                    <button 
                      onClick={() => onEdit(user._id)}
                      className="px-6 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 border-2 border-blue-300 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
                    >
                      Edit Profile
                    </button>
                  )}
                  {onReject && user.status === 'Pending' && (
                    <button 
                      onClick={handleReject}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-md"
                    >
                      Reject User
                    </button>
                  )}
                  {onApprove && user.status === 'Pending' && (
                    <button 
                      onClick={() => onApprove(user._id)}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-md"
                    >
                      Approve User
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Print ID Modal */}
      {showPrintModal && (
        <PrintIDModule 
          user={user}
          onClose={() => setShowPrintModal(false)}
          onPrintComplete={onPrintComplete}
        />
      )}
    </>
  );

  return createPortal(modalContent, document.body);
};

export default UserViewModal;