import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, CheckCircle, Clock, Edit2, Save, X, Camera } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL

interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  sex: 'Male' | 'Female';
  birthday: string;
  civilStatus: string;
  educationalBackground: string;
  youthClassification: string;
  workStatus: string;
  purok: string;
  block?: string;
  lot?: string;
  houseNumber?: string;
  street?: string;
  email: string;
  contactNumber: string;
  skIdNumber?: string;
  status: string;
  registeredSkVoter: boolean;
  registeredNationalVoter: boolean;
  isPwd: boolean;
  isCicwl: boolean;
  isIndigenous: boolean;
  profilePicture?: string;
}

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [newProfilePicture, setNewProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token || !storedUser) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const completeUser = await response.json();
          setUser(completeUser);
          setEditedUser(completeUser);
          localStorage.setItem('user', JSON.stringify(completeUser));
        } else {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setEditedUser(parsedUser);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        const parsedUser = JSON.parse(storedUser!);
        setUser(parsedUser);
        setEditedUser(parsedUser);
      } finally {
        setFetching(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleEditToggle = () => {
    if (isEditMode) {
      setEditedUser(user);
      setNewProfilePicture(null);
      setPreviewUrl('');
    }
    setIsEditMode(!isEditMode);
  };

  const handleInputChange = (field: keyof UserData, value: any) => {
    if (editedUser) {
      setEditedUser({ ...editedUser, [field]: value });
    }
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setNewProfilePicture(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePicture = () => {
    setNewProfilePicture(null);
    setPreviewUrl('');
  };

  const handleSave = async () => {
    if (!editedUser) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // If there's a new profile picture, use FormData
      if (newProfilePicture) {
        const formData = new FormData();
        
        // Append all user data
        Object.entries(editedUser).forEach(([key, value]) => {
          if (key !== 'profilePicture' && key !== '_id') {
            formData.append(key, String(value));
          }
        });
        
        // Append the new profile picture
        formData.append('profilePicture', newProfilePicture);
        
        const response = await fetch(`${API_URL}/api/user/update-profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          const updatedUser = await response.json();
          setUser(updatedUser);
          setEditedUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setIsEditMode(false);
          setNewProfilePicture(null);
          setPreviewUrl('');
          alert('Profile updated successfully!');
        } else {
          const data = await response.json();
          alert(`Failed to update: ${data.message}`);
        }
      } else {
        // No new picture, send JSON
        const response = await fetch(`${API_URL}/api/user/update-profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(editedUser)
        });

        if (response.ok) {
          const updatedUser = await response.json();
          setUser(updatedUser);
          setEditedUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setIsEditMode(false);
          alert('Profile updated successfully!');
        } else {
          const data = await response.json();
          alert(`Failed to update: ${data.message}`);
        }
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-full bg-gray-50 p-4 flex justify-center items-center">
        <div className="text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!user || !editedUser) return null;

  const isPending = user.status === 'Pending';
  const canEdit = isPending;

  // Get the display URL (preview if uploading new, current if exists, placeholder otherwise)
  const displayPictureUrl = previewUrl || user.profilePicture || '';

  return (
    <div className="min-h-full bg-gray-50 p-4 flex justify-center">
      <div className="max-w-2xl w-full space-y-6 py-6">
        
        <div className="space-y-4">
          {/* Status Banner */}
          <div className={`${isPending ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-400'} border-l-4 p-4 rounded-md shadow-sm`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isPending ? (
                  <Clock className="w-6 h-6 text-yellow-600" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                )}
                <div>
                  <h3 className={`font-bold ${isPending ? 'text-yellow-800' : 'text-green-800'}`}>
                    {isPending ? 'Application Pending' : 'Profile Approved'}
                  </h3>
                  <p className={`text-sm ${isPending ? 'text-yellow-700' : 'text-green-700'}`}>
                    {isPending ? 'Under review by SK Admin' : `SK ID: ${user.skIdNumber || 'Generating...'}`}
                  </p>
                </div>
              </div>
              {canEdit && !isEditMode && (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Picture Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4">Profile Picture</h3>
            
            <div className="flex flex-col items-center gap-4">
              {/* Profile Picture Display */}
              <div className="relative">
                {displayPictureUrl ? (
                  <img 
                    src={displayPictureUrl}
                    alt="Profile" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/200?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                
                {/* Remove button for new upload preview */}
                {previewUrl && isEditMode && canEdit && (
                  <button
                    type="button"
                    onClick={removePicture}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                    title="Remove picture"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload Button - Only shown when editing and pending */}
              {isEditMode && canEdit && (
                <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-6 py-2 rounded-lg font-medium transition flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  {displayPictureUrl ? 'Change Picture' : 'Upload Picture'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePictureChange}
                    className="hidden"
                  />
                </label>
              )}
              
              {isEditMode && canEdit && (
                <p className="text-xs text-gray-500 text-center">
                  Accepted: JPG, PNG, GIF (Max 5MB)
                </p>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            
            {/* Edit Mode Controls */}
            {isEditMode && canEdit && (
              <div className="flex gap-3 pb-4 border-b border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors"
                >
                  <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleEditToggle}
                  className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Personal Information */}
            <Section title="Personal Information" icon={<User className="w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="First Name" value={editedUser.firstName} onChange={(v) => handleInputChange('firstName', v)} editable={isEditMode && canEdit} />
                <Field label="Last Name" value={editedUser.lastName} onChange={(v) => handleInputChange('lastName', v)} editable={isEditMode && canEdit} />
                <Field label="Middle Name" value={editedUser.middleName || ''} onChange={(v) => handleInputChange('middleName', v)} editable={isEditMode && canEdit} />
                <Field label="Suffix" value={editedUser.suffix || ''} onChange={(v) => handleInputChange('suffix', v)} editable={isEditMode && canEdit} />
                
                <SelectField 
                  label="Sex" 
                  value={editedUser.sex} 
                  options={['Male', 'Female']}
                  onChange={(v) => handleInputChange('sex', v)} 
                  editable={isEditMode && canEdit} 
                />
                
                <Field 
                  label="Birthday" 
                  type="date"
                  value={editedUser.birthday?.split('T')[0] || ''} 
                  onChange={(v) => handleInputChange('birthday', v)} 
                  editable={isEditMode && canEdit} 
                />
                
                <SelectField 
                  label="Civil Status" 
                  value={editedUser.civilStatus} 
                  options={['Single', 'Married', 'Widowed', 'Separated', 'Live-in', 'Annulled', 'Others']}
                  onChange={(v) => handleInputChange('civilStatus', v)} 
                  editable={isEditMode && canEdit} 
                />
                
                <SelectField 
                  label="Educational Background" 
                  value={editedUser.educationalBackground} 
                  options={[
                    'Elementary Level', 'Elementary Grad',
                    'High School Level', 'High School Grad',
                    'Vocational Grad',
                    'College Level', 'College Grad',
                    'Masters Level', 'Masters Grad',
                    'Doctorate Level', 'Doctorate Graduate'
                  ]}
                  onChange={(v) => handleInputChange('educationalBackground', v)} 
                  editable={isEditMode && canEdit} 
                />
              </div>
            </Section>

            {/* Address */}
            <Section title="Address" icon={<MapPin className="w-5 h-5" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField 
                  label="Purok" 
                  value={editedUser.purok} 
                  options={['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6', 'Purok 7']}
                  onChange={(v) => handleInputChange('purok', v)} 
                  editable={isEditMode && canEdit} 
                />
                <Field label="Block No." value={editedUser.block || ''} onChange={(v) => handleInputChange('block', v)} editable={isEditMode && canEdit} />
                <Field label="Lot No." value={editedUser.lot || ''} onChange={(v) => handleInputChange('lot', v)} editable={isEditMode && canEdit} />
                <Field label="House No." value={editedUser.houseNumber || ''} onChange={(v) => handleInputChange('houseNumber', v)} editable={isEditMode && canEdit} />
                <Field label="Street" value={editedUser.street || ''} onChange={(v) => handleInputChange('street', v)} editable={isEditMode && canEdit} className="md:col-span-2" />
              </div>
            </Section>

            {/* Classification */}
            <Section title="Classification">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField 
                  label="Youth Classification" 
                  value={editedUser.youthClassification} 
                  options={['In School Youth', 'Out of School Youth', 'Working Youth', 'Youth with Specific Needs']}
                  onChange={(v) => handleInputChange('youthClassification', v)} 
                  editable={isEditMode && canEdit} 
                />
                <SelectField 
                  label="Work Status" 
                  value={editedUser.workStatus} 
                  options={['Employed', 'Unemployed', 'Self-Employed', 'Currently looking for a Job', 'Not Interested Looking for a Job']}
                  onChange={(v) => handleInputChange('workStatus', v)} 
                  editable={isEditMode && canEdit} 
                />
              </div>
            </Section>

            {/* Additional Information */}
            <Section title="Additional Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <CheckboxField label="Registered SK Voter" checked={editedUser.registeredSkVoter} onChange={(v) => handleInputChange('registeredSkVoter', v)} editable={isEditMode && canEdit} />
                <CheckboxField label="Registered National Voter" checked={editedUser.registeredNationalVoter} onChange={(v) => handleInputChange('registeredNationalVoter', v)} editable={isEditMode && canEdit} />
                <CheckboxField label="Person with Disability (PWD)" checked={editedUser.isPwd} onChange={(v) => handleInputChange('isPwd', v)} editable={isEditMode && canEdit} />
                <CheckboxField label="Child in Conflict with Law (CICWL)" checked={editedUser.isCicwl} onChange={(v) => handleInputChange('isCicwl', v)} editable={isEditMode && canEdit} />
                <CheckboxField label="Indigenous Person" checked={editedUser.isIndigenous} onChange={(v) => handleInputChange('isIndigenous', v)} editable={isEditMode && canEdit} />
              </div>
            </Section>

            {/* Contact Information - Always read-only */}
            <Section title="Contact Information">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  📧 To update your email or contact number, please contact SK Admin directly.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Email" value={editedUser.email} editable={false} />
                <Field label="Contact Number" value={editedUser.contactNumber} editable={false} />
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Helper Components ──

const Section = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h3 className="font-bold text-gray-800">{title}</h3>
    </div>
    {children}
  </div>
);

const Field = ({ label, value, onChange, editable = false, type = 'text', className = '' }: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  editable?: boolean;
  type?: string;
  className?: string;
}) => (
  <div className={className}>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    {editable ? (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      />
    ) : (
      <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">{value || '—'}</p>
    )}
  </div>
);

const SelectField = ({ label, value, options, onChange, editable = false }: {
  label: string;
  value: string;
  options: string[];
  onChange?: (value: string) => void;
  editable?: boolean;
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    {editable ? (
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    ) : (
      <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">{value}</p>
    )}
  </div>
);

const CheckboxField = ({ label, checked, onChange, editable = false }: {
  label: string;
  checked: boolean;
  onChange?: (value: boolean) => void;
  editable?: boolean;
}) => (
  <label className={`flex items-center gap-2 p-3 border rounded-lg ${editable ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-50'}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange?.(e.target.checked)}
      disabled={!editable}
      className="w-4 h-4 text-blue-600 rounded"
    />
    <span className="text-sm text-gray-700">{label}</span>
  </label>
);

export default UserProfile;