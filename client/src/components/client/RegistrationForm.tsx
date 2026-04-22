import React, { useState } from 'react';
import { User, Camera, X, Eye, EyeOff, Mail, Shield, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
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
  'block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition';

const SiglaWordmark = () => (
  <svg viewBox="0 0 620 130" xmlns="http://www.w3.org/2000/svg"
    style={{ overflow: 'visible', display: 'block', width: '100%' }}>
    <defs>
      <linearGradient id="strokeGradReg" x1="45%" y1="100%" x2="55%" y2="0%">
        <stop offset="0%" stopColor="#0B5A73" stopOpacity="0.32" />
        <stop offset="25%" stopColor="#15AAD9" stopOpacity="0.32" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.32" />
      </linearGradient>
    </defs>
    <text x="50%" y="100" textAnchor="middle" fill="none"
      stroke="url(#strokeGradReg)" strokeWidth="30" strokeLinejoin="round"
      style={{
        fontFamily: "'Fugaz One', Impact, sans-serif", fontSize: '150px',
        fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0em',
        filter: 'drop-shadow(0px 8px 4px #003459)'
      }}>
      SIGLA
    </text>
    <text x="50%" y="100" textAnchor="middle" fill="#00171F" stroke="#00171F" strokeWidth="2"
      style={{
        fontFamily: "'Fugaz One', Impact, sans-serif", fontSize: '150px',
        fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0em'
      }}>
      SIGLA
    </text>
  </svg>
);

const StepNav = ({
  step, onBack, onNext, nextLabel = 'Next', nextDisabled = false,
}: {
  step: number; onBack: () => void; onNext: () => void;
  nextLabel?: string; nextDisabled?: boolean;
}) => (
  <div className={`flex items-center mt-6 ${step > 1 ? 'justify-between' : 'justify-center'}`}>
    {step > 1 && (
      <button type="button" onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition font-work">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
    )}
    <button type="button" onClick={onNext} disabled={nextDisabled}
      className="flex items-center gap-2 py-2.5 px-6 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] disabled:cursor-default"
      style={{ background: nextDisabled ? '#9ca3af' : '#003459' }}
      onMouseOver={e => { if (!nextDisabled) (e.currentTarget as HTMLButtonElement).style.background = '#00171F'; }}
      onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = nextDisabled ? '#9ca3af' : '#003459'; }}>
      {nextLabel} <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

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
    isEmailVerified: false, verificationCode: '', isCodeSent: false,
    isSending: false, isVerifying: false, timer: 0,
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
    if (name === 'email') setEmailVerification({ isEmailVerified: false, verificationCode: '', isCodeSent: false, isSending: false, isVerifying: false, timer: 0 });
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { alert('Please enter a valid email address'); return; }
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
        let t = 60;
        const countdown = setInterval(() => {
          t -= 1;
          setEmailVerification(prev => ({ ...prev, timer: t }));
          if (t <= 0) clearInterval(countdown);
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
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Image size should be less than 5MB'); return; }
    setProfilePicture(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!emailVerification.isEmailVerified) { alert('Please verify your email address'); return; }
    if (!isPasswordStrong()) { alert('Password does not meet requirements'); return; }
    if (!passwordsMatch()) { alert('Passwords do not match'); return; }
    const birthDate = new Date(formData.birthday);
    const age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    const d = today.getDate() - birthDate.getDate();
    const exactAge = m < 0 || (m === 0 && d < 0) ? age - 1 : age;
    if (exactAge < 15 || exactAge > 30) { alert('You must be between 15 and 30 years old.'); return; }
    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => submitData.append(key, String(value)));
      if (profilePicture) submitData.append('profilePicture', profilePicture);
      const response = await fetch(`${API_URL}/api/auth/register`, { method: 'POST', body: submitData });
      if (response.ok) { setIsSuccess(true); }
      else { const data = await response.json(); alert('Error: ' + (data.message || 'Something went wrong')); }
    } catch { alert('Error: Something went wrong'); }
  };

  const nextStep = () => { if (currentStep < STEPS.length) setCurrentStep(s => s + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(s => s - 1); };

  const step2Complete =
    formData.firstName.trim() !== '' &&
    formData.lastName.trim() !== '' &&
    formData.birthday !== '';

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-between py-10 px-4"
      style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #5CB0B3 37%, #007EA7 100%)' }}>

      {/* Branding */}
      <div className="flex flex-col items-center mb-6 mt-4 w-full max-w-sm px-6">
        <span className="block w-full">
          <SiglaWordmark />
        </span>
        <p className="text-white text-xs mt-2 text-center italic opacity-90 font-fugaz [filter:drop-shadow(0px_2px_2px_#003459)]">
          <span className="font-bold text-[#00171F]">S</span>K{' '}
          <span className="font-bold text-[#00171F]">I</span>nfosystem for{' '}
          <span className="font-bold text-[#00171F]">G</span>rowth,<br />
          <span className="font-bold text-[#00171F]">L</span>eadership, and{' '}
          <span className="font-bold text-[#00171F]">A</span>chievement
        </p>

        {/* Step dots */}
        {!isSuccess && (
          <div className="flex items-center gap-1 mt-4">
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${currentStep > step.id ? 'bg-[#003459] text-white'
                    : currentStep === step.id ? 'bg-white text-[#003459] ring-2 ring-white/50'
                      : 'bg-white/25 text-white/60'
                  }`}>
                  {currentStep > step.id ? <CheckCircle className="w-3 h-3" /> : step.id}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 w-5 rounded transition-all duration-300 ${currentStep > step.id ? 'bg-[#003459]' : 'bg-white/25'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Card area */}
      <div className="w-full max-w-sm">

        {/* SUCCESS */}
        {isSuccess && (
          <div className="w-full bg-white rounded-2xl shadow-2xl px-7 py-10 text-center">
            <div className="mb-8">
              <div className="w-16 h-16 rounded-full bg-[#003459]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-9 h-9 text-[#003459]" />
              </div>
              <h2 className="text-gray-900 text-2xl font-bold font-fugaz mb-2">Registration Successful!</h2>
              <p className="text-gray-400 text-sm font-work">Your account has been submitted for admin approval.</p>
            </div>
            <Link to="/login"
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em]"
              style={{ background: '#003459' }}
              onMouseOver={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#00171F')}
              onMouseOut={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#003459')}>
              Back to Login
            </Link>
          </div>
        )}

        {/* STEP 1 */}
        {!isSuccess && currentStep === 1 && (
          <div className="w-full bg-white rounded-2xl shadow-2xl px-7 py-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 font-fugaz">Profile Picture</h2>
              <p className="text-gray-400 text-xs mt-1 font-work">Upload an optional profile photo</p>
            </div>
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative">
                {previewUrl ? (
                  <div className="relative">
                    <img src={previewUrl} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow" />
                    <button type="button" onClick={() => { setProfilePicture(null); setPreviewUrl(''); }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-50 flex items-center justify-center border-4 border-gray-100 shadow-inner">
                    <User className="w-14 h-14 text-gray-300" />
                  </div>
                )}
              </div>
              <label className="cursor-pointer flex justify-center items-center py-2.5 px-6 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] gap-2"
                style={{ background: '#003459' }}
                onMouseOver={e => ((e.currentTarget as HTMLLabelElement).style.background = '#00171F')}
                onMouseOut={e => ((e.currentTarget as HTMLLabelElement).style.background = '#003459')}>
                <Camera className="w-4 h-4" />
                {previewUrl ? 'Change Photo' : 'Upload Photo'}
                <input type="file" accept="image/*" onChange={handlePictureChange} className="hidden" />
              </label>
              <p className="text-xs text-gray-400 font-work">JPG, PNG, GIF · Max 5MB</p>
            </div>
            <StepNav
              step={currentStep} onBack={prevStep} onNext={nextStep}
              nextLabel={previewUrl ? 'Next' : 'Not Now'}
              nextDisabled={false}
            />
          </div>
        )}

        {/* STEP 2 */}
        {!isSuccess && currentStep === 2 && (
          <div className="w-full bg-white rounded-2xl shadow-2xl px-7 py-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 font-fugaz">Personal Info</h2>
              <p className="text-gray-400 text-xs mt-1 font-work">Fill in all required fields</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">First Name *</label>
                <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Middle Name</label>
                  <input type="text" name="middleName" placeholder="Middle Name" value={formData.middleName} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Last Name *</label>
                  <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required className={inp} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Suffix</label>
                  <input type="text" name="suffix" placeholder="e.g. Jr." value={formData.suffix} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Sex</label>
                  <select name="sex" value={formData.sex} onChange={handleChange} className={inp}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Birthday (Age 15–30) *</label>
                <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} required min={minDate} max={maxDate} className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Civil Status</label>
                <select name="civilStatus" value={formData.civilStatus} onChange={handleChange} className={inp}>
                  {['Single', 'Married', 'Widowed', 'Separated', 'Live-in', 'Annulled', 'Others'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <StepNav
              step={currentStep} onBack={prevStep} onNext={nextStep}
              nextDisabled={!step2Complete}
            />
          </div>
        )}

        {/* STEP 3 */}
        {!isSuccess && currentStep === 3 && (
          <div className="w-full bg-white rounded-2xl shadow-2xl px-7 py-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 font-fugaz">Address &amp; Education</h2>
              <p className="text-gray-400 text-xs mt-1 font-work">Your location and academic background</p>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold text-[#003459] uppercase tracking-wider font-work">Address</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Purok</label>
                  <select name="purok" value={formData.purok} onChange={handleChange} className={inp}>
                    {[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={`Purok ${n}`}>Purok {n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Block No.</label>
                  <input type="text" name="block" placeholder="Block No." value={formData.block} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Lot No.</label>
                  <input type="text" name="lot" placeholder="Lot No." value={formData.lot} onChange={handleChange} className={inp} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">House No.</label>
                  <input type="text" name="houseNumber" placeholder="House No." value={formData.houseNumber} onChange={handleChange} className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Street</label>
                <input type="text" name="street" placeholder="Street Name" value={formData.street} onChange={handleChange} className={inp} />
              </div>
              <p className="text-xs font-semibold text-[#003459] uppercase tracking-wider font-work pt-1">Education</p>
              <div>
                <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Educational Background</label>
                <select name="educationalBackground" value={formData.educationalBackground} onChange={handleChange} className={inp}>
                  {['Elementary Level', 'Elementary Grad', 'High School Level', 'High School Grad', 'Vocational Grad', 'College Level', 'College Grad', 'Masters Level', 'Masters Grad', 'Doctorate Level', 'Doctorate Graduate'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Youth Classification</label>
                <select name="youthClassification" value={formData.youthClassification} onChange={handleChange} className={inp}>
                  {['In School Youth', 'Out of School Youth', 'Working Youth', 'Youth with Specific Needs'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Employment Status</label>
                <select name="workStatus" value={formData.workStatus} onChange={handleChange} className={inp}>
                  {['Employed', 'Unemployed', 'Self-Employed', 'Currently looking for a Job', 'Not Interested Looking for a Job'].map(v => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <StepNav step={currentStep} onBack={prevStep} onNext={nextStep} />
          </div>
        )}

        {/* STEP 4 */}
        {!isSuccess && currentStep === 4 && (
          <div className="w-full bg-white rounded-2xl shadow-2xl px-7 py-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 font-fugaz">Other Information</h2>
              <p className="text-gray-400 text-xs mt-1 font-work">Select all that apply to you</p>
            </div>
            <div className="space-y-3">
              {[
                { name: 'registeredSkVoter', label: 'Registered SK Voter' },
                { name: 'registeredNationalVoter', label: 'Registered National Voter' },
                { name: 'isPwd', label: 'Person With Disability (PWD)' },
                { name: 'isCicwl', label: 'Child in Conflict with Law (CICWL)' },
                { name: 'isIndigenous', label: 'Indigenous Person' },
              ].map(item => (
                <label key={item.name}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-[#003459]/30 hover:bg-gray-50 cursor-pointer transition group">
                  <input type="checkbox" name={item.name}
                    checked={formData[item.name as keyof typeof formData] as boolean}
                    onChange={handleChange} className="w-4 h-4 rounded" style={{ accentColor: '#003459' }} />
                  <span className="text-sm text-gray-700 font-work group-hover:text-[#003459] transition">{item.label}</span>
                </label>
              ))}
            </div>
            <StepNav step={currentStep} onBack={prevStep} onNext={nextStep} />
          </div>
        )}

        {/* STEP 5 */}
        {!isSuccess && currentStep === 5 && (
          <div className="w-full bg-white rounded-2xl shadow-2xl px-7 py-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 font-fugaz">Account Security</h2>
              <p className="text-gray-400 text-xs mt-1 font-work">Set your contact details and password</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Mobile Number *</label>
                <input type="tel" name="contactNumber" placeholder="Mobile Number" value={formData.contactNumber} onChange={handleChange} required className={inp} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Email Address *</label>
                <div className="flex gap-2">
                  <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required
                    disabled={emailVerification.isEmailVerified}
                    className={`${inp} flex-1 ${emailVerification.isEmailVerified ? 'bg-green-50 border-green-400' : ''}`} />
                  {!emailVerification.isEmailVerified && (
                    <button type="button" onClick={sendVerificationCode}
                      disabled={emailVerification.isSending || emailVerification.timer > 0}
                      className="px-3 py-2.5 rounded-lg text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] flex items-center gap-1 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: '#003459' }}
                      onMouseOver={e => { if (!emailVerification.isSending) (e.currentTarget as HTMLButtonElement).style.background = '#00171F'; }}
                      onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}>
                      <Mail className="w-3 h-3" />
                      {emailVerification.isSending ? '...' : emailVerification.timer > 0 ? `${emailVerification.timer}s` : 'Send'}
                    </button>
                  )}
                </div>
                {emailVerification.isEmailVerified && (
                  <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium mt-1.5 font-work">
                    <Shield className="w-3.5 h-3.5" /> Email verified!
                  </div>
                )}
                {emailVerification.isCodeSent && !emailVerification.isEmailVerified && (
                  <div className="flex gap-2 mt-2">
                    <input type="text" placeholder="Verification Code" maxLength={6}
                      value={emailVerification.verificationCode}
                      onChange={e => setEmailVerification(prev => ({ ...prev, verificationCode: e.target.value.replace(/\D/g, '') }))}
                      className={`${inp} flex-1`} />
                    <button type="button" onClick={verifyCode}
                      disabled={emailVerification.isVerifying || emailVerification.verificationCode.length !== 6}
                      className="px-3 py-2.5 rounded-lg text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: '#003459' }}
                      onMouseOver={e => { if (!emailVerification.isVerifying) (e.currentTarget as HTMLButtonElement).style.background = '#00171F'; }}
                      onMouseOut={e => { (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}>
                      {emailVerification.isVerifying ? '...' : 'Verify'}
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Password *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Create Password"
                    value={formData.password} onChange={handleChange} required className={`${inp} pr-10`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-2.5 space-y-1 text-xs border border-gray-100">
                    {[
                      { key: 'hasMinLength', label: 'At least 8 characters' },
                      { key: 'hasLetter', label: 'Contains a letter' },
                      { key: 'hasNumber', label: 'Contains a number' },
                    ].map(r => (
                      <div key={r.key} className={`flex items-center gap-1.5 font-work ${passwordValidation[r.key as keyof typeof passwordValidation] ? 'text-green-600' : 'text-gray-400'}`}>
                        <span>{passwordValidation[r.key as keyof typeof passwordValidation] ? '✓' : '○'}</span>
                        <span>{r.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Confirm Password *</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                    className={`${inp} pr-10 ${confirmPassword && passwordsMatch() ? 'border-green-400 bg-green-50' : confirmPassword && !passwordsMatch() ? 'border-red-400 bg-red-50' : ''}`} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p className={`text-xs mt-1 flex items-center gap-1 font-work ${passwordsMatch() ? 'text-green-600' : 'text-red-500'}`}>
                    <span>{passwordsMatch() ? '✓' : '✗'}</span>
                    {passwordsMatch() ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6">
              <button type="button" onClick={handleSubmit}
                disabled={!emailVerification.isEmailVerified || !isPasswordStrong() || !passwordsMatch()}
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] disabled:cursor-not-allowed"
                style={{ background: !emailVerification.isEmailVerified || !isPasswordStrong() || !passwordsMatch() ? '#9ca3af' : '#003459' }}
                onMouseOver={e => { const b = e.currentTarget as HTMLButtonElement; if (!b.disabled) b.style.background = '#00171F'; }}
                onMouseOut={e => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.background = b.disabled ? '#9ca3af' : '#003459';
                }}>
                Create Account
              </button>
              <div className="flex justify-start mt-3">
                <button type="button" onClick={prevStep}
                  className="flex items-center gap-1 text-gray-400 hover:text-gray-600 text-sm transition font-work">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Already have account */}
        {!isSuccess && (
          <>
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-white/30" />
              <span className="px-3 text-white/60 text-xs font-work">or</span>
              <div className="flex-1 border-t border-white/30" />
            </div>
            <p className="text-center text-xs text-white/70 font-work">
              Already have an account?{' '}
              <Link to="/login" className="text-[#00171F] font-semibold hover:underline font-work">Sign in</Link>
            </p>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-6 mb-2">
        <p className="text-white text-xs italic opacity-70 leading-relaxed font-fugaz">
          Sangguniang Kabataan<br />Calumpang Cerca, Indang, Cavite
        </p>
      </div>
    </div>
  );
};

export default RegistrationForm;