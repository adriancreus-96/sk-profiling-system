import React, { useState } from 'react';
import { User, MapPin, Briefcase, Lock, Flag, Camera, X, Eye, EyeOff, Mail, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL

const RegistrationForm = () => {
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

  // Email verification state
  const [emailVerification, setEmailVerification] = useState({
    isEmailVerified: false,
    verificationCode: '',
    sentCode: '',
    isCodeSent: false,
    isSending: false,
    isVerifying: false,
    timer: 0,
  });

  // Password visibility and validation state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasLetter: false,
    hasNumber: false,
  });

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: finalValue });

    // If email changes, reset verification
    if (name === 'email') {
      setEmailVerification({
        isEmailVerified: false,
        verificationCode: '',
        sentCode: '',
        isCodeSent: false,
        isSending: false,
        isVerifying: false,
        timer: 0,
      });
    }

    // Validate password on change
    if (name === 'password') {
      validatePassword(value);
    }
  };

  // Password validation function (simplified)
  const validatePassword = (password: string) => {
    setPasswordValidation({
      hasMinLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });
  };

  // Check if password is strong enough
  const isPasswordStrong = () => {
    return Object.values(passwordValidation).every(v => v === true);
  };

  // Check if passwords match
  const passwordsMatch = () => {
    return formData.password && confirmPassword && formData.password === confirmPassword;
  };

  // Send verification code to email
  const sendVerificationCode = async () => {
    if (!formData.email) {
      alert('Please enter your email address first');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    setEmailVerification(prev => ({ ...prev, isSending: true }));

    try {
      const response = await fetch(`${API_URL}/api/auth/send-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Verification code sent to your email!');
        setEmailVerification(prev => ({
          ...prev,
          isCodeSent: true,
          isSending: false,
          timer: 60, // 60 second cooldown
        }));

        // Start countdown timer
        let timeLeft = 60;
        const countdown = setInterval(() => {
          timeLeft -= 1;
          setEmailVerification(prev => ({ ...prev, timer: timeLeft }));
          if (timeLeft <= 0) {
            clearInterval(countdown);
          }
        }, 1000);
      } else {
        alert('Error: ' + (data.message || 'Failed to send verification code'));
        setEmailVerification(prev => ({ ...prev, isSending: false }));
      }
    } catch (error) {
      console.error(error);
      alert('Error: Failed to send verification code');
      setEmailVerification(prev => ({ ...prev, isSending: false }));
    }
  };

  // Verify the code entered by user
  const verifyCode = async () => {
    if (!emailVerification.verificationCode) {
      alert('Please enter the verification code');
      return;
    }

    setEmailVerification(prev => ({ ...prev, isVerifying: true }));

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: emailVerification.verificationCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Email verified successfully!');
        setEmailVerification(prev => ({
          ...prev,
          isEmailVerified: true,
          isVerifying: false,
        }));
      } else {
        alert('Error: ' + (data.message || 'Invalid verification code'));
        setEmailVerification(prev => ({ ...prev, isVerifying: false }));
      }
    } catch (error) {
      console.error(error);
      alert('Error: Failed to verify code');
      setEmailVerification(prev => ({ ...prev, isVerifying: false }));
    }
  };

  // Handle profile picture selection
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
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePicture = () => {
    setProfilePicture(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check email verification
    if (!emailVerification.isEmailVerified) {
      alert('Please verify your email address before registering');
      return;
    }

    // Check password strength
    if (!isPasswordStrong()) {
      alert('Please ensure your password meets all the requirements');
      return;
    }

    // Check passwords match
    if (!passwordsMatch()) {
      alert('Passwords do not match');
      return;
    }

    const birthDate = new Date(formData.birthday);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const exactAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

    if (exactAge < 15 || exactAge > 30) {
      alert('You must be between 15 and 30 years old to register.');
      return;
    }

    try {
      const submitData = new FormData();
      
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, String(value));
      });
      
      if (profilePicture) {
        submitData.append('profilePicture', profilePicture);
      }

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        body: submitData,
      });

      if (response.ok) {
        alert('Registration Successful! Please wait for Admin Approval.');
        window.location.href = '/login';
      } else {
        const data = await response.json();
        alert('Error: ' + (data.message || 'Something went wrong'));
      }
    } catch (error) {
      console.error(error);
      alert('Error: Something went wrong');
    }
  };

  const inp =
    'w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* ── PROFILE PICTURE SECTION ── */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-500" /> Profile Picture (Optional)
        </h3>
        
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {previewUrl ? (
              <div className="relative">
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
              </div>
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

      {/* ── SECTION 1: PERSONAL INFO ── */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-500" /> Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} required className={inp} />
          <input type="text" name="lastName"  placeholder="Last Name"  onChange={handleChange} required className={inp} />
          <input type="text" name="middleName" placeholder="Middle Name (Optional)" onChange={handleChange} className={inp} />
          <input type="text" name="suffix"     placeholder="Suffix (e.g. Jr.)"      onChange={handleChange} className={inp} />

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

      {/* ── SECTION 2: ADDRESS & EDUCATION ── */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-500" /> Address &amp; Education
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">Purok</label>
            <select name="purok" onChange={handleChange} className={inp}>
              {[1,2,3,4,5,6,7].map(n => <option key={n} value={`Purok ${n}`}>{`Purok ${n}`}</option>)}
            </select>
          </div>

          <input type="text" name="block"       placeholder="Block No."   onChange={handleChange} className={inp} />
          <input type="text" name="lot"         placeholder="Lot No."     onChange={handleChange} className={inp} />
          <input type="text" name="houseNumber" placeholder="House No."   onChange={handleChange} className={inp} />
          <input type="text" name="street"      placeholder="Street Name" onChange={handleChange} className={inp} />

          <div className="md:col-span-2 mt-2">
            <label className="block text-sm text-gray-600 mb-1">Educational Background</label>
            <select name="educationalBackground" onChange={handleChange} className={inp}>
              {[
                'Elementary Level','Elementary Grad',
                'High School Level','High School Grad',
                'Vocational Grad',
                'College Level','College Grad',
                'Masters Level','Masters Grad',
                'Doctorate Level','Doctorate Graduate',
              ].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: CLASSIFICATION ── */}
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

      {/* ── SECTION 4: OTHER INFO (checkboxes) ── */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Flag className="w-5 h-5 text-blue-500" /> Other Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: 'registeredSkVoter',       label: 'Registered SK Voter?' },
            { name: 'registeredNationalVoter', label: 'Registered National Voter?' },
            { name: 'isPwd',                   label: 'Person with Disability (PWD)?' },
            { name: 'isCicwl',                 label: 'Child in Conflict with Law (CICWL)?' },
            { name: 'isIndigenous',            label: 'Indigenous Person?' },
          ].map((item) => (
            <label key={item.name} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" name={item.name} onChange={handleChange} className="h-5 w-5 text-blue-600 rounded" />
              <span className="text-gray-700 font-medium text-sm">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── SECTION 5: ACCOUNT SECURITY ── */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-blue-500" /> Account Security
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <input 
            type="tel" 
            name="contactNumber" 
            placeholder="Mobile Number" 
            onChange={handleChange} 
            required 
            className={inp} 
          />

          {/* Email with Verification */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input 
                type="email" 
                name="email" 
                placeholder="Email Address" 
                onChange={handleChange} 
                required 
                disabled={emailVerification.isEmailVerified}
                className={`${inp} ${emailVerification.isEmailVerified ? 'bg-green-50 border-green-500' : ''}`}
              />
              {!emailVerification.isEmailVerified && (
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={emailVerification.isSending || emailVerification.timer > 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {emailVerification.isSending ? 'Sending...' : 
                   emailVerification.timer > 0 ? `${emailVerification.timer}s` : 
                   'Send Code'}
                </button>
              )}
            </div>

            {emailVerification.isEmailVerified && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <Shield className="w-4 h-4" />
                <span>Email verified successfully!</span>
              </div>
            )}

            {emailVerification.isCodeSent && !emailVerification.isEmailVerified && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={emailVerification.verificationCode}
                  onChange={(e) => setEmailVerification(prev => ({
                    ...prev,
                    verificationCode: e.target.value.replace(/\D/g, ''),
                  }))}
                  className={inp}
                />
                <button
                  type="button"
                  onClick={verifyCode}
                  disabled={emailVerification.isVerifying || emailVerification.verificationCode.length !== 6}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {emailVerification.isVerifying ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            )}
          </div>

          {/* Password with Validation */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                name="password" 
                placeholder="Create Password" 
                onChange={handleChange} 
                required 
                className={`${inp} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                <p className="font-semibold text-gray-700 mb-2">Password must contain:</p>
                <div className={`flex items-center gap-2 ${passwordValidation.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                  <span>{passwordValidation.hasMinLength ? '✓' : '○'}</span>
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasLetter ? 'text-green-600' : 'text-gray-500'}`}>
                  <span>{passwordValidation.hasLetter ? '✓' : '○'}</span>
                  <span>At least one letter (A-Z or a-z)</span>
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                  <span>{passwordValidation.hasNumber ? '✓' : '○'}</span>
                  <span>At least one number (0-9)</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="block text-sm text-gray-600 mb-1">Confirm Password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password" 
                required 
                className={`${inp} pr-12 ${
                  confirmPassword && passwordsMatch() ? 'border-green-500 bg-green-50' : 
                  confirmPassword && !passwordsMatch() ? 'border-red-500 bg-red-50' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {confirmPassword && (
              <div className={`flex items-center gap-2 text-sm ${
                passwordsMatch() ? 'text-green-600' : 'text-red-600'
              }`}>
                <span>{passwordsMatch() ? '✓' : '✗'}</span>
                <span>{passwordsMatch() ? 'Passwords match' : 'Passwords do not match'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Submit ── */}
      <button
        onClick={handleSubmit}
        disabled={!emailVerification.isEmailVerified || !isPasswordStrong() || !passwordsMatch()}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Register Account
      </button>

      {/* ── Already have an account? ── */}
      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegistrationForm;