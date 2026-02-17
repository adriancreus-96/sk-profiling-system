import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, MapPin, User as UserIcon, Calendar, Hash, Mail, Phone, 
  GraduationCap, Briefcase, Heart, CheckCircle, Award, Home, RotateCcw, Archive
} from 'lucide-react';

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
}

interface ArchiveModalProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  onRestore?: (id: string) => Promise<void>;
  onPermanentDelete?: (id: string) => Promise<void>;
}

const ArchiveModal: React.FC<ArchiveModalProps> = ({ 
  user, 
  isOpen, 
  onClose,
  onRestore,
  onPermanentDelete
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !user || !mounted) return null;

  // Format birthday
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Build full address
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
    if (!window.confirm('Are you sure you want to restore this user to active status?')) {
      return;
    }

    if (onRestore) {
      onRestore(user._id);
    }
  };

  const handlePermanentDelete = () => {
    if (!window.confirm('⚠️ WARNING: This will permanently delete this user from the system. This action CANNOT be undone. Are you absolutely sure?')) {
      return;
    }

    // Double confirmation for safety
    const confirmText = prompt('Type "DELETE" in all caps to confirm permanent deletion:');
    if (confirmText !== 'DELETE') {
      alert('Deletion cancelled. Text did not match.');
      return;
    }

    if (onPermanentDelete) {
      onPermanentDelete(user._id);
    }
  };

  const InfoField = ({ label, value, icon: Icon }: { 
    label: string; 
    value: string | number | undefined; 
    icon?: any;
  }) => {
    return (
      <div className="space-y-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          {Icon && <Icon className="w-3 h-3" />}
          {label}
        </label>
        <div className="font-medium text-gray-900 bg-gray-50 px-3 py-2.5 rounded-lg border border-gray-200">
          {value || "N/A"}
        </div>
      </div>
    );
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* The Card - Scrollable */}
      <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
        
        {/* HEADER - Fixed */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-gray-700 to-gray-800 border-b border-gray-600 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Archive className="w-5 h-5" />
            Archived Youth Profile
          </h2>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY - Scrollable */}
        <div className="overflow-y-auto flex-1 p-8">
          
          {/* Archive Notice Banner */}
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            user.status === 'Rejected' 
              ? 'bg-red-50 border-red-300' 
              : user.status === 'Archived'
              ? 'bg-orange-50 border-orange-300'
              : 'bg-gray-100 border-gray-300'
          }`}>
            <div className="flex items-center gap-3">
              <Archive className={`w-5 h-5 shrink-0 ${
                user.status === 'Rejected' ? 'text-red-600' : 
                user.status === 'Archived' ? 'text-orange-600' : 
                'text-gray-600'
              }`} />
              <div>
                <p className={`font-bold text-sm ${
                  user.status === 'Rejected' ? 'text-red-800' : 
                  user.status === 'Archived' ? 'text-orange-800' :
                  'text-gray-800'
                }`}>
                  {user.status === 'Rejected' 
                    ? '⚠️ This profile was rejected and archived' 
                    : user.status === 'Archived'
                    ? '📅 This profile was automatically archived (Age 31 or older)'
                    : 'This profile is currently archived'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {user.status === 'Archived' 
                    ? 'Users are automatically archived when they turn 31 years old. You can restore this profile or permanently delete it.'
                    : 'You can restore this profile to return it to active status, or permanently delete it from the system.'}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Header Section with Picture */}
          <div className="flex flex-col sm:flex-row gap-6 items-start mb-8 pb-8 border-b border-gray-200">
            {/* Profile Picture - Greyed out for archived */}
            <div className="shrink-0">
              {user.profilePicture ? (
                <img 
                  src={user.profilePicture}
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-300 shadow-lg opacity-60 grayscale"
                  onError={(e) => {
                    // Fallback to initials avatar
                    const target = e.currentTarget as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 text-white flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg opacity-60"
                style={{ display: user.profilePicture ? 'none' : 'flex' }}
              >
                {user.firstName ? user.firstName.charAt(0) : '?'}
              </div>
            </div>
            
            <div className="flex-1 space-y-3">
              <h3 className="text-3xl font-bold text-gray-900">
                {user.lastName}, {user.firstName} {user.middleName || ''} {user.suffix || ''}
              </h3>
              
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300">
                  <Hash className="w-3.5 h-3.5 mr-1" />
                  {user.skIdNumber || 'No ID Assigned'}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold border-2 ${
                  user.status === 'Rejected' 
                    ? 'bg-red-50 text-red-700 border-red-300' 
                    : user.status === 'Archived'
                    ? 'bg-orange-50 text-orange-700 border-orange-300'
                    : 'bg-gray-100 text-gray-700 border-gray-300'
                }`}>
                  {user.status}
                </span>
                {user.points !== undefined && (
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 border border-gray-300">
                    <Award className="w-3.5 h-3.5 mr-1" />
                    {user.points} Points
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rest of the content remains the same */}
          {/* Personal Information */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-gray-600" />
              Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoField label="Sex" value={user.sex} />
              <InfoField label="Birthday" value={user.birthday ? formatDate(user.birthday) : undefined} icon={Calendar} />
              <InfoField label="Age" value={user.age} />
              <InfoField label="Youth Age Group" value={user.youthAgeGroup} />
              <InfoField label="Civil Status" value={user.civilStatus} icon={Heart} />
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Phone className="w-5 h-5 text-gray-600" />
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField label="Email" value={user.email} icon={Mail} />
              <InfoField label="Contact Number" value={user.contactNumber} icon={Phone} />
            </div>
          </div>

          {/* Address Information */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-600" />
              Address Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoField label="Block" value={user.block} />
              <InfoField label="Lot" value={user.lot} />
              <InfoField label="House Number" value={user.houseNumber} />
              <InfoField label="Street" value={user.street} />
              <InfoField label="Purok" value={user.purok} icon={Home} />
            </div>
            <div className="mt-4">
              <InfoField label="Full Address" value={getFullAddress()} icon={MapPin} />
            </div>
          </div>

          {/* Education & Work */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-gray-600" />
              Education & Employment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField 
                label="Educational Background" 
                value={user.educationalBackground} 
                icon={GraduationCap} 
              />
              <InfoField 
                label="Youth Classification" 
                value={user.youthClassification}
              />
              <InfoField 
                label="Work Status" 
                value={user.workStatus}
                icon={Briefcase} 
              />
            </div>
          </div>

          {/* Voter Registration & Special Categories */}
          <div className="mb-8">
            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-gray-600" />
              Registration & Categories
            </h4>
            
            {/* Voter Registration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            </div>

            {/* Special Categories */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Special Categories</p>
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
          </div>

        </div>

        {/* FOOTER - Fixed */}
        <div className="bg-gray-50 px-8 py-5 border-t border-gray-300 flex justify-between items-center shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
          >
            Close
          </button>

          <div className="flex gap-3">
            {onPermanentDelete && (
              <button 
                onClick={handlePermanentDelete}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-md flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Permanently Delete
              </button>
            )}
            {onRestore && (
              <button 
                onClick={handleRestore}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restore Profile
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