import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, CheckCircle, Clock, Edit2, Save, X, Camera, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173";

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

const inp = 'block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition bg-white';
const readOnly = 'block w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-700';

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [newProfilePicture, setNewProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showRequestEditConfirm, setShowRequestEditConfirm] = useState(false);
  const [requestingEdit, setRequestingEdit] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (!token || !storedUser) { navigate('/login'); return; }
      try {
        const response = await fetch(`${API_URL}/api/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const completeUser = await response.json();
          setUser(completeUser); setEditedUser(completeUser);
          localStorage.setItem('user', JSON.stringify(completeUser));
        } else {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser); setEditedUser(parsedUser);
        }
      } catch {
        const parsedUser = JSON.parse(storedUser!);
        setUser(parsedUser); setEditedUser(parsedUser);
      } finally {
        setFetching(false);
      }
    };
    fetchUserProfile();
  }, [navigate]);

  const handleEditToggle = () => {
    if (isEditMode) { setEditedUser(user); setNewProfilePicture(null); setPreviewUrl(''); }
    setIsEditMode(!isEditMode);
  };

  const handleInputChange = (field: keyof UserData, value: any) => {
    if (editedUser) setEditedUser({ ...editedUser, [field]: value });
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

  // Approved user confirms → call endpoint to flip status to Pending
  const handleRequestEdit = async () => {
    setRequestingEdit(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/user/request-edit`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser); setEditedUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setShowRequestEditConfirm(false);
        setIsEditMode(true); // status is now Pending, edit mode opens normally
      } else {
        const data = await response.json();
        alert(`Failed: ${data.message}`);
      }
    } catch {
      alert('Error requesting edit. Please try again.');
    } finally {
      setRequestingEdit(false);
    }
  };

  const handleSave = async () => {
    if (!editedUser) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let response;
      if (newProfilePicture) {
        const formData = new FormData();
        Object.entries(editedUser).forEach(([key, value]) => {
          if (key !== 'profilePicture' && key !== '_id') formData.append(key, String(value));
        });
        formData.append('profilePicture', newProfilePicture);
        response = await fetch(`${API_URL}/api/user/update-profile`, {
          method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: formData
        });
      } else {
        response = await fetch(`${API_URL}/api/user/update-profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(editedUser)
        });
      }
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser); setEditedUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setIsEditMode(false); setNewProfilePicture(null); setPreviewUrl('');
        alert('Profile updated successfully!');
      } else {
        const data = await response.json();
        alert(`Failed to update: ${data.message}`);
      }
    } catch {
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-white/60 text-sm font-work">Loading profile...</p>
      </div>
    );
  }

  if (!user || !editedUser) return null;

  const isPending = user.status === 'Pending';
  const canEdit = isPending;
  const displayPictureUrl = previewUrl || user.profilePicture || '';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

      {/* Confirmation Dialog */}
      {showRequestEditConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm font-fugaz">Request Profile Edit?</h3>
                <p className="text-xs text-gray-500 font-work mt-1 leading-relaxed">
                  Your profile status will be reset to <strong className="text-yellow-600">Pending</strong> and will require re-approval from the SK Admin before becoming active again.
                </p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleRequestEdit}
                disabled={requestingEdit}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] disabled:opacity-50"
                style={{ background: '#003459' }}
                onMouseOver={(e) => { const b = e.currentTarget as HTMLButtonElement; if (!b.disabled) b.style.background = '#00171F'; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}
              >
                {requestingEdit ? 'Processing...' : 'Yes, Request Edit'}
              </button>
              <button
                onClick={() => setShowRequestEditConfirm(false)}
                disabled={requestingEdit}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-semibold transition font-fugaz"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Banner */}
      <div className={`rounded-2xl p-4 border flex items-center justify-between ${
        isPending
          ? 'bg-yellow-400/10 border-yellow-400/30'
          : 'bg-green-400/10 border-green-400/30'
      }`}>
        <div className="flex items-center gap-3">
          {isPending
            ? <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            : <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />}
          <div>
            <h3 className={`font-bold text-sm font-fugaz ${isPending ? 'text-yellow-300' : 'text-green-300'}`}>
              {isPending ? 'Application Pending' : 'Profile Approved'}
            </h3>
            <p className={`text-xs font-work ${isPending ? 'text-yellow-400/70' : 'text-green-400/70'}`}>
              {isPending ? 'Under review by SK Admin' : `SK ID: ${user.skIdNumber || 'Generating...'}`}
            </p>
          </div>
        </div>

        {/* Pending: normal Edit button */}
        {canEdit && !isEditMode && (
          <button
            onClick={handleEditToggle}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em]"
            style={{ background: '#003459' }}
            onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#00171F')}
            onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#003459')}
          >
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
        )}

        {/* Approved: Request to Edit button triggers confirmation */}
        {!isPending && !isEditMode && (
          <button
            onClick={() => setShowRequestEditConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-yellow-800 bg-yellow-100 hover:bg-yellow-200 transition duration-200 font-fugaz tracking-[0.05em]"
          >
            <Edit2 className="w-3.5 h-3.5" /> Request Edit
          </button>
        )}
      </div>

      {/* Profile Picture */}
      <div className="bg-white rounded-2xl shadow-xl p-5">
        <h3 className="font-bold text-gray-900 text-sm mb-4 font-fugaz">Profile Picture</h3>
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {displayPictureUrl ? (
              <img src={displayPictureUrl} alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-4 border-gray-100 shadow"
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/200?text=No+Image'; }}
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gray-50 flex items-center justify-center border-4 border-gray-100 shadow-inner">
                <User className="w-12 h-12 text-gray-300" />
              </div>
            )}
            {previewUrl && isEditMode && canEdit && (
              <button type="button" onClick={() => { setNewProfilePicture(null); setPreviewUrl(''); }}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {isEditMode && canEdit && (
            <>
              <label
                className="cursor-pointer flex items-center gap-2 py-2.5 px-5 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em]"
                style={{ background: '#003459' }}
                onMouseOver={(e) => ((e.currentTarget as HTMLLabelElement).style.background = '#00171F')}
                onMouseOut={(e) => ((e.currentTarget as HTMLLabelElement).style.background = '#003459')}
              >
                <Camera className="w-4 h-4" />
                {displayPictureUrl ? 'Change Photo' : 'Upload Photo'}
                <input type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
              </label>
              <p className="text-xs text-gray-400 font-work">JPG, PNG, GIF · Max 5MB</p>
            </>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {isEditMode && canEdit && (
          <div className="px-5 py-4 border-b border-gray-100 flex gap-3">
            <button
              onClick={handleSave} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] disabled:opacity-50"
              style={{ background: '#003459' }}
              onMouseOver={(e) => { const b = e.currentTarget as HTMLButtonElement; if (!b.disabled) b.style.background = '#00171F'; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}
            >
              <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleEditToggle}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-5 space-y-6">

          <Section title="Personal Information" icon={<User className="w-4 h-4 text-[#003459]" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="First Name"  value={editedUser.firstName}  onChange={(v) => handleInputChange('firstName', v)}  editable={isEditMode && canEdit} />
              <Field label="Last Name"   value={editedUser.lastName}   onChange={(v) => handleInputChange('lastName', v)}   editable={isEditMode && canEdit} />
              <Field label="Middle Name" value={editedUser.middleName || ''} onChange={(v) => handleInputChange('middleName', v)} editable={isEditMode && canEdit} />
              <Field label="Suffix"      value={editedUser.suffix || ''} onChange={(v) => handleInputChange('suffix', v)}   editable={isEditMode && canEdit} />
              <SelectField label="Sex" value={editedUser.sex} options={['Male','Female']}
                onChange={(v) => handleInputChange('sex', v)} editable={isEditMode && canEdit} />
              <Field label="Birthday" type="date" value={editedUser.birthday?.split('T')[0] || ''}
                onChange={(v) => handleInputChange('birthday', v)} editable={isEditMode && canEdit} />
              <SelectField label="Civil Status" value={editedUser.civilStatus}
                options={['Single','Married','Widowed','Separated','Live-in','Annulled','Others']}
                onChange={(v) => handleInputChange('civilStatus', v)} editable={isEditMode && canEdit} />
              <SelectField label="Educational Background" value={editedUser.educationalBackground}
                options={['Elementary Level','Elementary Grad','High School Level','High School Grad','Vocational Grad','College Level','College Grad','Masters Level','Masters Grad','Doctorate Level','Doctorate Graduate']}
                onChange={(v) => handleInputChange('educationalBackground', v)} editable={isEditMode && canEdit} />
            </div>
          </Section>

          <Section title="Address" icon={<MapPin className="w-4 h-4 text-[#003459]" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField label="Purok" value={editedUser.purok}
                options={['Purok 1','Purok 2','Purok 3','Purok 4','Purok 5','Purok 6','Purok 7']}
                onChange={(v) => handleInputChange('purok', v)} editable={isEditMode && canEdit} />
              <Field label="Block No."  value={editedUser.block || ''}       onChange={(v) => handleInputChange('block', v)}       editable={isEditMode && canEdit} />
              <Field label="Lot No."    value={editedUser.lot || ''}         onChange={(v) => handleInputChange('lot', v)}         editable={isEditMode && canEdit} />
              <Field label="House No."  value={editedUser.houseNumber || ''} onChange={(v) => handleInputChange('houseNumber', v)} editable={isEditMode && canEdit} />
              <Field label="Street" value={editedUser.street || ''} onChange={(v) => handleInputChange('street', v)}
                editable={isEditMode && canEdit} className="sm:col-span-2" />
            </div>
          </Section>

          <Section title="Classification">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField label="Youth Classification" value={editedUser.youthClassification}
                options={['In School Youth','Out of School Youth','Working Youth','Youth with Specific Needs']}
                onChange={(v) => handleInputChange('youthClassification', v)} editable={isEditMode && canEdit} />
              <SelectField label="Work Status" value={editedUser.workStatus}
                options={['Employed','Unemployed','Self-Employed','Currently looking for a Job','Not Interested Looking for a Job']}
                onChange={(v) => handleInputChange('workStatus', v)} editable={isEditMode && canEdit} />
            </div>
          </Section>

          <Section title="Additional Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <CheckboxField label="Registered SK Voter"          checked={editedUser.registeredSkVoter}       onChange={(v) => handleInputChange('registeredSkVoter', v)}       editable={isEditMode && canEdit} />
              <CheckboxField label="Registered National Voter"    checked={editedUser.registeredNationalVoter} onChange={(v) => handleInputChange('registeredNationalVoter', v)}  editable={isEditMode && canEdit} />
              <CheckboxField label="Person with Disability (PWD)" checked={editedUser.isPwd}                   onChange={(v) => handleInputChange('isPwd', v)}                   editable={isEditMode && canEdit} />
              <CheckboxField label="Child in Conflict with Law"   checked={editedUser.isCicwl}                 onChange={(v) => handleInputChange('isCicwl', v)}                 editable={isEditMode && canEdit} />
              <CheckboxField label="Indigenous Person"            checked={editedUser.isIndigenous}            onChange={(v) => handleInputChange('isIndigenous', v)}            editable={isEditMode && canEdit} />
            </div>
          </Section>

          <Section title="Contact Information">
            <div className="bg-[#003459]/5 border border-[#003459]/20 rounded-xl p-3 mb-3">
              <p className="text-xs text-[#003459] font-work">To update your email or contact number, please contact SK Admin directly.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Email"          value={editedUser.email}         editable={false} />
              <Field label="Contact Number" value={editedUser.contactNumber} editable={false} />
            </div>
          </Section>

        </div>
      </div>
    </div>
  );
};

const Section = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h3 className="font-bold text-gray-900 text-sm font-fugaz">{title}</h3>
    </div>
    <div className="border-t border-gray-100 pt-3">{children}</div>
  </div>
);

const Field = ({ label, value, onChange, editable = false, type = 'text', className = '' }: {
  label: string; value: string; onChange?: (v: string) => void;
  editable?: boolean; type?: string; className?: string;
}) => (
  <div className={className}>
    <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">{label}</label>
    {editable
      ? <input type={type} value={value} onChange={(e) => onChange?.(e.target.value)} className={inp} />
      : <p className={readOnly}>{value || '—'}</p>}
  </div>
);

const SelectField = ({ label, value, options, onChange, editable = false }: {
  label: string; value: string; options: string[];
  onChange?: (v: string) => void; editable?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">{label}</label>
    {editable
      ? <select value={value} onChange={(e) => onChange?.(e.target.value)} className={inp}>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      : <p className={readOnly}>{value}</p>}
  </div>
);

const CheckboxField = ({ label, checked, onChange, editable = false }: {
  label: string; checked: boolean;
  onChange?: (v: boolean) => void; editable?: boolean;
}) => (
  <label className={`flex items-center gap-2.5 p-3 border rounded-lg text-sm transition ${
    editable
      ? 'cursor-pointer hover:border-[#003459]/30 hover:bg-gray-50 border-gray-200'
      : 'bg-gray-50 border-gray-100'
  }`}>
    <input
      type="checkbox" checked={checked} onChange={(e) => onChange?.(e.target.checked)}
      disabled={!editable} className="w-4 h-4 rounded"
      style={{ accentColor: '#003459' }}
    />
    <span className="text-gray-700 font-work">{label}</span>
  </label>
);

export default UserProfile;