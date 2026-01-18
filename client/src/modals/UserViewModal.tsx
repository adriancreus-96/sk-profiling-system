import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, MapPin, User as UserIcon, Calendar, Hash, Mail, Phone, 
  GraduationCap, Briefcase, Heart, CheckCircle, Award, Home
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
  status: 'Pending' | 'Approved' | string;
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

interface UserViewModalProps {
  user: UserData | null;
  isOpen: boolean;
  onClose: () => void;
  isEditMode?: boolean;
  onEdit?: (id: string) => void;
  onSave?: (updatedUser: UserData, originalUser: UserData) => Promise<void>;
  onApprove?: (id: string) => Promise<void>;
}

const UserViewModal: React.FC<UserViewModalProps> = ({ 
  user, 
  isOpen, 
  onClose,
  isEditMode = false,
  onEdit,
  onSave,
  onApprove
}) => {
  const [mounted, setMounted] = useState(false);
  const [editedUser, setEditedUser] = useState<UserData | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Initialize editedUser when user changes or edit mode is entered
  useEffect(() => {
    if (user) {
      setEditedUser({ ...user });
    }
  }, [user, isEditMode]);

  if (!isOpen || !user || !mounted || !editedUser) return null;

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
  };

  const handleSave = () => {
    if (onSave && editedUser) {
      onSave(editedUser, user);
    }
  };

  const handleCancelEdit = () => {
    setEditedUser({ ...user });
    // Just close - parent will reset isEditMode
    onClose();
  };

  const InfoField = ({ label, value, icon: Icon, field, type = 'text', options }: { 
    label: string; 
    value: string | number | undefined; 
    icon?: any;
    field?: keyof UserData;
    type?: 'text' | 'email' | 'tel' | 'date' | 'select' | 'checkbox';
    options?: string[];
  }) => {
    if (isEditMode && field) {
      // Edit mode - show input fields
      if (type === 'select' && options) {
        return (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              {Icon && <Icon className="w-3 h-3" />}
              {label}
            </label>
            <select
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
              type="date"
              value={dateValue}
              onChange={(e) => handleInputChange(field, new Date(e.target.value))}
              className="w-full font-medium text-gray-900 bg-white px-3 py-2.5 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
        );
      }

      if (type === 'checkbox') {
        return (
          <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-semibold text-gray-600">{label}</span>
              <input
                type="checkbox"
                checked={editedUser[field] as boolean || false}
                onChange={(e) => handleInputChange(field, e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
        );
      }

      // Protected field - SK ID cannot be edited
      if (field === 'skIdNumber' && user.skIdNumber) {
        return (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              {Icon && <Icon className="w-3 h-3" />}
              {label} <span className="text-red-600">(Protected)</span>
            </label>
            <div className="font-medium text-gray-500 bg-gray-100 px-3 py-2.5 rounded-lg border-2 border-gray-300 cursor-not-allowed">
              {value || "N/A"}
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
            {Icon && <Icon className="w-3 h-3" />}
            {label}
          </label>
          <input
            type={type}
            value={editedUser[field] as string || ''}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full font-medium text-gray-900 bg-white px-3 py-2.5 rounded-lg border-2 border-blue-300 focus:border-blue-500 focus:outline-none"
          />
        </div>
      );
    }

    // View mode - show static field
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

        {/* BODY - Scrollable */}
        <div className="overflow-y-auto flex-1 p-8">
          
          {/* Profile Header Section */}
          <div className="flex flex-col sm:flex-row gap-6 items-start mb-8 pb-8 border-b border-gray-200">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg shrink-0">
              {user.firstName ? user.firstName.charAt(0) : '?'}
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
              <InfoField label="Sex" value={user.sex} field="sex" type="select" options={['Male', 'Female']} />
              <InfoField label="Birthday" value={user.birthday ? formatDate(user.birthday) : undefined} field="birthday" type="date" icon={Calendar} />
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
                  'Elementary Level',
                  'Elementary Grad',
                  'High School Level',
                  'High School Grad',
                  'Vocational Grad',
                  'College Level',
                  'College Grad',
                  'Masters Level',
                  'Masters Grad',
                  'Doctorate Level',
                  'Doctorate Graduate'
                ]}
                icon={GraduationCap} 
              />
              <InfoField 
                label="Youth Classification" 
                value={user.youthClassification}
                field="youthClassification"
                type="select"
                options={[
                  'In School Youth',
                  'Out of School Youth',
                  'Working Youth',
                  'Youth with Specific Needs'
                ]}
              />
              <InfoField 
                label="Work Status" 
                value={user.workStatus}
                field="workStatus"
                type="select"
                options={[
                  'Employed',
                  'Unemployed',
                  'Self-Employed',
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
            
            {/* Voter Registration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {isEditMode ? (
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

            {/* Special Categories */}
            {isEditMode ? (
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

        {/* FOOTER - Fixed */}
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
                className="px-8 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
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
                {onEdit && (
                  <button 
                    onClick={() => onEdit(user._id)}
                    className="px-6 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 border-2 border-blue-300 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
                  >
                    Edit Profile
                  </button>
                )}
                {onApprove && user.status !== 'Approved' && (
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
  );

  return createPortal(modalContent, document.body);
};

export default UserViewModal;