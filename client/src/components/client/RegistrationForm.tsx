import React, { useState } from 'react';
import { User, MapPin, Lock, Flag, Camera, X, Eye, EyeOff, Mail, Shield, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173";

const STEPS = [
  { id: 1, label: 'Profile Picture' },
  { id: 2, label: 'Personal Information' },
  { id: 3, label: 'Address & Education' },
  { id: 4, label: 'Other Information' },
  { id: 5, label: 'Account Security' },
];

const inp =
  'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition';

const RegistrationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);

  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 15, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  const minDate = new Date(today.getFullYear() - 31, today.getMonth(), today.getDate() + 1).toISOString().split('T')[0];

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

  const [emailVerification, setEmailVerification] = useState({
    isEmailVerified: false,
    verificationCode: '',
    isCodeSent: false,
    isSending: false,
    isVerifying: false,
    timer: 0,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({ hasMinLength: false, hasLetter: false, hasNumber: false });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({ ...formData, [name]: finalValue });
    if (name === 'email') {
      setEmailVerification({ isEmailVerified: false, verificationCode: '', isCodeSent: false, isSending: false, isVerifying: false, timer: 0 });
    }
    if (name === 'password') validatePassword(value);
  };

  const validatePassword = (password: string) => {
    setPasswordValidation({
      hasMinLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });
  };

  const isPasswordStrong = () => Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = () => formData.password && confirmPassword && formData.password === confirmPassword;

  const sendVerificationCode = async () => {
    if (!formData.email) { alert('Please enter your email address first'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { alert('Please enter a valid email address'); return; }
    setEmailVerification(prev => ({ ...prev, isSending: true }));
    try {
      const response = await fetch(`${API_URL}/api/auth/send-verification-code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Verification code sent to your email!');
        setEmailVerification(prev => ({ ...prev, isCodeSent: true, isSending: false, timer: 60 }));
        let timeLeft = 60;
        const countdown = setInterval(() => {
          timeLeft -= 1;
          setEmailVerification(prev => ({ ...prev, timer: timeLeft }));
          if (timeLeft <= 0) clearInterval(countdown);
        }, 1000);
      } else {
        alert('Error: ' + (data.message || 'Failed to send verification code'));
        setEmailVerification(prev => ({ ...prev, isSending: false }));
      }
    } catch {
      alert('Error: Failed to connect to server.');
      setEmailVerification(prev => ({ ...prev, isSending: false }));
    }
  };

  const verifyCode = async () => {
    if (!emailVerification.verificationCode) { alert('Please enter the verification code'); return; }
    setEmailVerification(prev => ({ ...prev, isVerifying: true }));
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, code: emailVerification.verificationCode }),
      });
      const data = await response.json();
      if (response.ok) {
        setEmailVerification(prev => ({ ...prev, isEmailVerified: true, isVerifying: false }));
      } else {
        alert('Error: ' + (data.message || 'Invalid verification code'));
        setEmailVerification(prev => ({ ...prev, isVerifying: false }));
      }
    } catch {
      alert('Error: Failed to verify code');
      setEmailVerification(prev => ({ ...prev, isVerifying: false }));
    }
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) { alert('Please select a valid image file'); return; }
      if (file.size > 5 * 1024 * 1024) { alert('Image size should be less than 5MB'); return; }
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removePicture = () => { setProfilePicture(null); setPreviewUrl(''); };

  const handleSubmit = async () => {
    if (!emailVerification.isEmailVerified) { alert('Please verify your email address'); return; }
    if (!isPasswordStrong()) { alert('Password does not meet requirements'); return; }
    if (!passwordsMatch()) { alert('Passwords do not match'); return; }
    const birthDate = new Date(formData.birthday);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    const exactAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
    if (exactAge < 15 || exactAge > 30) { alert('You must be between 15 and 30 years old.'); return; }
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => submitData.append(key, String(value)));
      if (profilePicture) submitData.append('profilePicture', profilePicture);
      const response = await fetch(`${API_URL}/api/auth/register`, { method: 'POST', body: submitData });
      if (response.ok) {
        setIsSuccess(true);
      } else {
        const data = await response.json();
        alert('Error: ' + (data.message || 'Something went wrong'));
      }
    } catch {
      alert('Error: Something went wrong');
    }
  };

  const nextStep = () => { if (currentStep < STEPS.length) setCurrentStep(s => s + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(s => s - 1); };

  // ── BACKGROUND WRAPPER ──
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start py-8 px-4"
      style={{ background: 'linear-gradient(160deg, #0a2a3a 0%, #0d4a5c 40%, #1a7a8a 100%)' }}
    >
      {/* Logo / Header */}
      <div className="mb-6 text-center">
        <p className="text-cyan-300 text-sm font-medium tracking-widest uppercase mb-1">Register a</p>
        <h1 className="text-white font-black text-5xl tracking-tight leading-none" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
          SIGLA
        </h1>
        <p className="text-cyan-300 text-sm font-medium tracking-widest uppercase mt-1">account</p>
      </div>

      {/* Step Indicator */}
      {!isSuccess && (
        <div className="flex items-center gap-1 mb-6">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  currentStep > step.id
                    ? 'bg-cyan-400 text-white'
                    : currentStep === step.id
                    ? 'bg-white text-teal-800 ring-2 ring-cyan-300'
                    : 'bg-white/20 text-white/50'
                }`}
              >
                {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id}
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 w-6 rounded transition-all duration-300 ${currentStep > step.id ? 'bg-cyan-400' : 'bg-white/20'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-md">

        {/* SUCCESS SCREEN */}
        {isSuccess && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-10 text-center shadow-2xl border border-white/20">
            <div className="mb-6">
              <p className="text-cyan-300 text-sm font-medium tracking-widest uppercase mb-1">Register a</p>
              <h1 className="text-white font-black text-5xl tracking-tight leading-none" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                SIGLA
              </h1>
              <p className="text-cyan-300 text-sm font-medium tracking-widest uppercase mt-1">account</p>
              <p className="text-white/60 text-xs mt-2">A program for Youth Empowerment, Leadership, and Advocacy</p>
            </div>
            <div className="mb-8">
              <CheckCircle className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
              <h2 className="text-white text-2xl font-bold mb-2">Registration Successful!</h2>
              <p className="text-white/70 text-sm">Your account has been submitted for admin approval.</p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold px-8 py-3 rounded-lg transition text-sm w-full justify-center"
            >
              ➜ Back to Login
            </Link>
          </div>
        )}

        {/* STEP 1: Profile Picture */}
        {!isSuccess && currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-white px-6 pt-6 pb-2">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-500" /> Profile Picture
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Upload an optional profile photo</p>
            </div>
            <div className="px-6 py-6 flex flex-col items-center gap-4">
              <div className="relative">
                {previewUrl ? (
                  <div className="relative">
                    <img src={previewUrl} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-cyan-100 shadow" />
                    <button type="button" onClick={removePicture}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-cyan-50 flex items-center justify-center border-4 border-cyan-100 shadow-inner">
                    <User className="w-14 h-14 text-cyan-300" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition flex items-center gap-2 shadow">
                <Camera className="w-4 h-4" />
                {previewUrl ? 'Change Photo' : 'Upload Photo'}
                <input type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
              </label>
              <p className="text-xs text-gray-400">JPG, PNG, GIF · Max 5MB</p>
            </div>
            <StepNav step={currentStep} total={STEPS.length} onBack={prevStep} onNext={nextStep} />
          </div>
        )}

        {/* STEP 2: Personal Information */}
        {!isSuccess && currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-white px-6 pt-6 pb-2">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-500" /> Personal Information
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Fill in all required fields</p>
            </div>
            <div className="px-6 py-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">First Name *</label>
                <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Middle Name</label>
                <input type="text" name="middleName" placeholder="Middle Name" value={formData.middleName} onChange={handleChange} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Last Name *</label>
                <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Suffix</label>
                <input type="text" name="suffix" placeholder="e.g. Jr." value={formData.suffix} onChange={handleChange} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Sex</label>
                <select name="sex" value={formData.sex} onChange={handleChange} className={inp}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Birthday (Age 15–30) *</label>
                <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} required min={minDate} max={maxDate} className={inp} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <select name="civilStatus" value={formData.civilStatus} onChange={handleChange} className={inp}>
                  {['Single','Married','Widowed','Separated','Live-in','Annulled','Others'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <StepNav step={currentStep} total={STEPS.length} onBack={prevStep} onNext={nextStep} />
          </div>
        )}

        {/* STEP 3: Address & Education */}
        {!isSuccess && currentStep === 3 && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-white px-6 pt-6 pb-2">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-500" /> Address &amp; Education
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Your location and academic background</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="font-semibold text-xs text-gray-500 uppercase tracking-wider mt-1">Address</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Purok</label>
                  <select name="purok" value={formData.purok} onChange={handleChange} className={inp}>
                    {[1,2,3,4,5,6,7].map(n => <option key={n} value={`Purok ${n}`}>Purok {n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Block No.</label>
                  <input type="text" name="block" placeholder="Block No." value={formData.block} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Lot No.</label>
                  <input type="text" name="lot" placeholder="Lot No." value={formData.lot} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">House No.</label>
                  <input type="text" name="houseNumber" placeholder="House No." value={formData.houseNumber} onChange={handleChange} className={inp} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Street</label>
                  <input type="text" name="street" placeholder="Street Name" value={formData.street} onChange={handleChange} className={inp} />
                </div>
              </div>
              <div className="font-semibold text-xs text-gray-500 uppercase tracking-wider mt-2">Education</div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Educational Background</label>
                <select name="educationalBackground" value={formData.educationalBackground} onChange={handleChange} className={inp}>
                  {['Elementary Level','Elementary Grad','High School Level','High School Grad','Vocational Grad','College Level','College Grad','Masters Level','Masters Grad','Doctorate Level','Doctorate Graduate'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Classification</label>
                <select name="youthClassification" value={formData.youthClassification} onChange={handleChange} className={inp}>
                  {['In School Youth','Out of School Youth','Working Youth','Youth with Specific Needs'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Employment</label>
                <select name="workStatus" value={formData.workStatus} onChange={handleChange} className={inp}>
                  {['Employed','Unemployed','Self-Employed','Currently looking for a Job','Not Interested Looking for a Job'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <StepNav step={currentStep} total={STEPS.length} onBack={prevStep} onNext={nextStep} />
          </div>
        )}

        {/* STEP 4: Other Information */}
        {!isSuccess && currentStep === 4 && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-white px-6 pt-6 pb-2">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Flag className="w-4 h-4 text-cyan-500" /> Other Information
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Select all that apply to you</p>
            </div>
            <div className="px-6 py-4 space-y-3">
              {[
                { name: 'registeredSkVoter', label: 'Registered SK Voter' },
                { name: 'registeredNationalVoter', label: 'Registered National Voter' },
                { name: 'isPwd', label: 'Person With Disability (PWD)' },
                { name: 'isCicwl', label: 'Child in Conflict with Law (CICWL)' },
                { name: 'isIndigenous', label: 'Indigenous Person' },
              ].map(item => (
                <label key={item.name} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-cyan-50/50 cursor-pointer transition group">
                  <input
                    type="checkbox"
                    name={item.name}
                    checked={formData[item.name as keyof typeof formData] as boolean}
                    onChange={handleChange}
                    className="w-4 h-4 text-cyan-500 rounded accent-cyan-500"
                  />
                  <span className="text-sm text-gray-700 font-medium group-hover:text-cyan-700 transition">{item.label}</span>
                </label>
              ))}
            </div>
            <StepNav step={currentStep} total={STEPS.length} onBack={prevStep} onNext={nextStep} />
          </div>
        )}

        {/* STEP 5: Account Security */}
        {!isSuccess && currentStep === 5 && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-white px-6 pt-6 pb-2">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-500" /> Account Security
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Set your contact details and password</p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mobile Number *</label>
                <input type="tel" name="contactNumber" placeholder="Mobile Number" value={formData.contactNumber} onChange={handleChange} required className={inp} />
              </div>

              {/* Email + verification */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address *</label>
                <div className="flex gap-2">
                  <input
                    type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required
                    disabled={emailVerification.isEmailVerified}
                    className={`${inp} flex-1 ${emailVerification.isEmailVerified ? 'bg-green-50 border-green-400' : ''}`}
                  />
                  {!emailVerification.isEmailVerified && (
                    <button type="button" onClick={sendVerificationCode}
                      disabled={emailVerification.isSending || emailVerification.timer > 0}
                      className="px-3 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-1 transition shadow">
                      <Mail className="w-3 h-3" />
                      {emailVerification.isSending ? '...' : emailVerification.timer > 0 ? `${emailVerification.timer}s` : 'Send Code'}
                    </button>
                  )}
                </div>
                {emailVerification.isEmailVerified && (
                  <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                    <Shield className="w-3.5 h-3.5" /> Email verified!
                  </div>
                )}
                {emailVerification.isCodeSent && !emailVerification.isEmailVerified && (
                  <div className="flex gap-2">
                    <input type="text" placeholder="Verification Code" maxLength={6}
                      value={emailVerification.verificationCode}
                      onChange={(e) => setEmailVerification(prev => ({ ...prev, verificationCode: e.target.value.replace(/\D/g,'') }))}
                      className={`${inp} flex-1`}
                    />
                    <button type="button" onClick={verifyCode}
                      disabled={emailVerification.isVerifying || emailVerification.verificationCode.length !== 6}
                      className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap transition shadow">
                      {emailVerification.isVerifying ? '...' : 'Verify'}
                    </button>
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Password *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Create Password"
                    value={formData.password} onChange={handleChange} required className={`${inp} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-2.5 space-y-1 text-xs">
                    {[
                      { key: 'hasMinLength', label: 'At least 8 characters' },
                      { key: 'hasLetter', label: 'Contains a letter' },
                      { key: 'hasNumber', label: 'Contains a number' },
                    ].map(r => (
                      <div key={r.key} className={`flex items-center gap-1.5 ${passwordValidation[r.key as keyof typeof passwordValidation] ? 'text-green-600' : 'text-gray-400'}`}>
                        <span>{passwordValidation[r.key as keyof typeof passwordValidation] ? '✓' : '○'}</span>
                        <span>{r.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Confirm Password *</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                    className={`${inp} pr-10 ${confirmPassword && passwordsMatch() ? 'border-green-400 bg-green-50' : confirmPassword && !passwordsMatch() ? 'border-red-400 bg-red-50' : ''}`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${passwordsMatch() ? 'text-green-600' : 'text-red-500'}`}>
                    <span>{passwordsMatch() ? '✓' : '✗'}</span>
                    {passwordsMatch() ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>
            </div>

            {/* Register Button */}
            <div className="px-6 pb-6">
              <button
                type="button" onClick={handleSubmit}
                disabled={!emailVerification.isEmailVerified || !isPasswordStrong() || !passwordsMatch()}
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition shadow-lg"
              >
                Register
              </button>
              <div className="flex justify-start mt-3">
                <button type="button" onClick={prevStep}
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm transition">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Already have account */}
        {!isSuccess && (
          <p className="text-center text-xs text-white/60 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-300 font-semibold hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
};

// ── Navigation Buttons ──
const StepNav = ({
  step, onBack, onNext,
}: { step: number; total: number; onBack: () => void; onNext: () => void }) => (
  <div className="px-6 pb-6 flex items-center justify-between">
    {step > 1 ? (
      <button type="button" onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
    ) : <div />}
    <button type="button" onClick={onNext}
      className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition shadow">
      Next <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

export default RegistrationForm;