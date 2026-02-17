import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, MapPin, Briefcase, Flag, ArrowLeft, UserPlus, Camera, X } from 'lucide-react';

const CreateProfile = () => {
  const navigate = useNavigate();
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate())
    .toISOString().split('T')[0];
  const minDate = new Date(today.getFullYear() - 31, today.getMonth(), today.getDate() + 1)
    .toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', middleName: '', suffix: '',
    email: '', password: '', contactNumber: '',
    birthday: '', sex: 'Male',
    purok: 'Purok 1', block: '', lot: '', houseNumber: '', street: '',
    civilStatus: 'Single',
    educationalBackground: 'Elementary Level',
    youthClassification: 'In School Youth',
    workStatus: 'Unemployed',
    registeredSkVoter: false,
    registeredNationalVoter: false,
    isPwd: false,
    isCicwl: false,
    isIndigenous: false,
  });

  const [loading, setLoading] = useState(false);

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: finalValue });
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
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removePicture = () => {
    setProfilePicture(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Age validation
    const birthDate = new Date(formData.birthday);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const exactAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (exactAge < 15 || exactAge > 30) {
      alert('Youth member must be between 15 and 30 years old.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Admin authentication required');
        navigate('/admin/login');
        return;
      }

      // Use FormData to support profile picture upload
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, String(value));
      });
      if (profilePicture) {
        submitData.append('profilePicture', profilePicture);
      }

      const response = await fetch('http://localhost:5000/api/admin/approve-and-create-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // DO NOT set Content-Type — browser sets it automatically with boundary
        },
        body: submitData,
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Profile created successfully! SK ID: ${data.skIdNumber}`);
        navigate('/admin/profiles', { state: { openUserId: data.userId } });
      } else {
        const data = await response.json();
        alert('Error: ' + (data.message || 'Something went wrong'));
      }
    } catch (error) {
      console.error(error);
      alert('Error: Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Page Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
            <UserPlus className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Youth Profile</h1>
            <p className="text-sm text-gray-500">Profile will be auto-approved upon creation</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl mx-auto">

        {/* SECTION 0: PROFILE PICTURE */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-500" /> Profile Picture (Optional)
          </h3>

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-100"
                  />
                  <button
                    type="button"
                    onClick={removePicture}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                    title="Remove picture"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-6 py-2 rounded-lg font-medium transition flex items-center gap-2">
              <Camera className="w-4 h-4" />
              {previewUrl ? 'Change Picture' : 'Upload Picture'}
              <input
                type="file"
                accept="image/*"
                onChange={handlePictureChange}
                className="hidden"
              />
            </label>

            <p className="text-xs text-gray-500 text-center">
              Accepted: JPG, PNG, GIF (Max 5MB)
            </p>
          </div>
        </div>

        {/* SECTION 1: PERSONAL INFO */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" /> Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} required className={inp} />
            <input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} required className={inp} />
            <input type="text" name="middleName" placeholder="Middle Name (Optional)" onChange={handleChange} className={inp} />
            <input type="text" name="suffix" placeholder="Suffix (e.g. Jr.)" onChange={handleChange} className={inp} />

            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Birthday (Age 15–30 only)</label>
              <input type="date" name="birthday" onChange={handleChange} required min={minDate} max={maxDate} className={inp} />
            </div>

            <select name="sex" onChange={handleChange} className={inp}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select name="civilStatus" onChange={handleChange} className={inp}>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
              <option value="Live-in">Live-in</option>
              <option value="Annulled">Annulled</option>
              <option value="Others">Others</option>
            </select>
          </div>
        </div>

        {/* SECTION 2: ADDRESS & EDUCATION */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" /> Address &amp; Education
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Purok</label>
              <select name="purok" onChange={handleChange} className={inp}>
                {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={`Purok ${n}`}>{`Purok ${n}`}</option>)}
              </select>
            </div>

            <input type="text" name="block" placeholder="Block No." onChange={handleChange} className={inp} />
            <input type="text" name="lot" placeholder="Lot No." onChange={handleChange} className={inp} />
            <input type="text" name="houseNumber" placeholder="House No." onChange={handleChange} className={inp} />
            <input type="text" name="street" placeholder="Street Name" onChange={handleChange} className={inp} />

            <div className="md:col-span-2 mt-2">
              <label className="block text-sm text-gray-600 mb-1">Educational Background</label>
              <select name="educationalBackground" onChange={handleChange} className={inp}>
                {[
                  'Elementary Level', 'Elementary Grad',
                  'High School Level', 'High School Grad',
                  'Vocational Grad',
                  'College Level', 'College Grad',
                  'Masters Level', 'Masters Grad',
                  'Doctorate Level', 'Doctorate Graduate',
                ].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: CLASSIFICATION */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" /> Classification
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select name="youthClassification" onChange={handleChange} className={inp}>
              <option value="In School Youth">In School Youth</option>
              <option value="Out of School Youth">Out of School Youth</option>
              <option value="Working Youth">Working Youth</option>
              <option value="Youth with Specific Needs">Youth with Specific Needs</option>
            </select>

            <select name="workStatus" onChange={handleChange} className={inp}>
              <option value="Employed">Employed</option>
              <option value="Unemployed">Unemployed</option>
              <option value="Self-Employed">Self-Employed</option>
              <option value="Currently looking for a Job">Currently looking for a Job</option>
              <option value="Not Interested Looking for a Job">Not Interested Looking for a Job</option>
            </select>
          </div>
        </div>

        {/* SECTION 4: OTHER INFO */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5 text-blue-500" /> Other Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: 'registeredSkVoter', label: 'Registered SK Voter?' },
              { name: 'registeredNationalVoter', label: 'Registered National Voter?' },
              { name: 'isPwd', label: 'Person with Disability (PWD)?' },
              { name: 'isCicwl', label: 'Child in Conflict with Law (CICWL)?' },
              { name: 'isIndigenous', label: 'Indigenous Person?' },
            ].map((item) => (
              <label key={item.name} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" name={item.name} onChange={handleChange} className="h-5 w-5 text-blue-600 rounded" />
                <span className="text-gray-700 font-medium text-sm">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* SECTION 5: ACCOUNT CREDENTIALS */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-500" /> Account Credentials
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <input type="tel" name="contactNumber" placeholder="Mobile Number" onChange={handleChange} required className={inp} />
            <input type="email" name="email" placeholder="Email Address" onChange={handleChange} required className={inp} />
            <input type="password" name="password" placeholder="Initial Password" onChange={handleChange} required className={inp} />
            <p className="text-xs text-gray-500">User can change their password after first login</p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-md transition duration-200 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          {loading ? 'Creating Profile...' : 'Create Profile & Auto-Approve'}
        </button>
      </form>
    </div>
  );
};

export default CreateProfile;