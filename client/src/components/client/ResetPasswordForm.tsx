import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173";

const inp =
  'block w-full rounded-lg border border-gray-300 p-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition';

// ── SIGLA SVG wordmark ──
const SiglaWordmark = () => (
  <svg
    viewBox="0 0 620 130"
    xmlns="http://www.w3.org/2000/svg"
    style={{ overflow: 'visible', display: 'block', width: '100%' }}
  >
    <defs>
      <linearGradient id="strokeGradReset" x1="45%" y1="100%" x2="55%" y2="0%">
        <stop offset="0%" stopColor="#0B5A73" stopOpacity="0.32" />
        <stop offset="25%" stopColor="#15AAD9" stopOpacity="0.32" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.32" />
      </linearGradient>
    </defs>
    <text
      x="50%" y="100"
      textAnchor="middle"
      fill="none"
      stroke="url(#strokeGradReset)"
      strokeWidth="30"
      strokeLinejoin="round"
      style={{
        fontFamily: "'Fugaz One', Impact, sans-serif",
        fontSize: '150px',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '-0.01em',
        filter: 'drop-shadow(0px 6px 0px rgba(0,0,0,0.3))',
      }}
    >
      SIGLA
    </text>
    <text
      x="50%" y="100"
      textAnchor="middle"
      fill="#00171F"
      stroke="#00171F"
      strokeWidth="2"
      style={{
        fontFamily: "'Fugaz One', Impact, sans-serif",
        fontSize: '150px',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '-0.02em',
      }}
    >
      SIGLA
    </text>
  </svg>
);

// ── Shared page wrapper ──
const Wrapper = ({ subtitle, children }: { subtitle: string; children: React.ReactNode }) => (
  <div
    className="min-h-screen w-full flex flex-col items-center justify-center py-10 px-4"
    style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #5CB0B3 37%, #007EA7 100%)' }}
  >
    <div className="mb-6 text-center w-full max-w-xs">
      <SiglaWordmark />
      <p className="text-white text-xs mt-2 text-center italic opacity-90 font-fugaz [filter:drop-shadow(0px_2px_2px_#003459)]">
        <span className="font-bold text-[#00171F]">S</span>K{' '}
        <span className="font-bold text-[#00171F]">I</span>nfosystem for{' '}
        <span className="font-bold text-[#00171F]">G</span>rowth,{' '}
        <span className="font-bold text-[#00171F]">L</span>eadership, and{' '}
        <span className="font-bold text-[#00171F]">A</span>chievement
      </p>
      <p className="text-white/60 text-xs mt-2 font-fugaz italic">{subtitle}</p>
    </div>
    <div className="w-full max-w-sm lg:max-w-md">{children}</div>
    <div className="text-center mt-8">
      <p className="text-white text-xs italic opacity-70 leading-relaxed font-fugaz">
        Sangguniang Kabataan
        <br />
        Calumpang Cerca, Indang, Cavite
      </p>
    </div>
  </div>
);

const ResetPasswordForm = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading]               = useState(false);
  const [success, setSuccess]               = useState(false);
  const [error, setError]                   = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasLetter: false,
    hasNumber: false,
  });

  const validatePassword = (password: string) => {
    setPasswordValidation({
      hasMinLength: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    });
  };

  const isPasswordStrong = () => Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = () => newPassword && confirmPassword && newPassword === confirmPassword;

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    validatePassword(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isPasswordStrong()) { setError('Please ensure your password meets all the requirements.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword }),
      });
      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        setError(data.message || 'Something went wrong.');
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Invalid link ──
  if (!token || !email) {
    return (
      <Wrapper subtitle="Reset your password">
        <div className="w-full bg-white rounded-2xl shadow-2xl px-7 py-8 lg:px-10 lg:py-10 text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 font-fugaz mb-2">Invalid Link</h2>
          <p className="text-gray-400 text-sm font-work mb-6">
            This reset link is missing required information. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em]"
            style={{ background: '#003459' }}
            onMouseOver={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = '#00171F')}
            onMouseOut={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = '#003459')}
          >
            <ArrowLeft className="w-4 h-4" /> Request a new link
          </Link>
        </div>
      </Wrapper>
    );
  }

  // ── Success state ──
  if (success) {
    return (
      <Wrapper subtitle="Reset your password">
        <div className="w-full bg-white rounded-2xl shadow-2xl px-7 py-8 lg:px-10 lg:py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#003459]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-[#003459]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 font-fugaz mb-2">Password Reset!</h2>
          <p className="text-gray-400 text-sm font-work mb-6">
            You can now log in with your new password.
          </p>
          <Link
            to="/login"
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em]"
            style={{ background: '#003459' }}
            onMouseOver={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = '#00171F')}
            onMouseOut={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = '#003459')}
          >
            Go to Login
          </Link>
        </div>
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-white/30" />
          <span className="px-3 text-white/60 text-xs font-work">or</span>
          <div className="flex-1 border-t border-white/30" />
        </div>
        <p className="text-center text-xs text-white/70 font-work">
          Need help?{' '}
          <Link to="/forgot-password" className="text-[#00171F] font-semibold hover:underline font-work">Request another link</Link>
        </p>
      </Wrapper>
    );
  }

  // ── Input state ──
  return (
    <Wrapper subtitle="Reset your password">
      <div className="w-full bg-white rounded-2xl shadow-2xl px-7 py-8 lg:px-10 lg:py-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 lg:text-3xl font-fugaz">Reset Password</h2>
          <p className="text-gray-400 text-xs mt-1 font-work">Enter a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">New Password *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={handlePasswordChange}
                required
                className={`${inp} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-2 bg-gray-50 rounded-lg p-2.5 space-y-1 text-xs border border-gray-100">
                {[
                  { key: 'hasMinLength', label: 'At least 8 characters' },
                  { key: 'hasLetter',    label: 'Contains a letter (A-Z or a-z)' },
                  { key: 'hasNumber',    label: 'Contains a number (0-9)' },
                ].map(r => (
                  <div
                    key={r.key}
                    className={`flex items-center gap-1.5 font-work ${
                      passwordValidation[r.key as keyof typeof passwordValidation] ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    <span>{passwordValidation[r.key as keyof typeof passwordValidation] ? '✓' : '○'}</span>
                    <span>{r.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Confirm Password *</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`${inp} pr-10 ${
                  confirmPassword && passwordsMatch()  ? 'border-green-400 bg-green-50' :
                  confirmPassword && !passwordsMatch() ? 'border-red-400 bg-red-50'    : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
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

          {/* Error */}
          {error && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 font-work">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !isPasswordStrong() || !passwordsMatch()}
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 mt-2 font-fugaz tracking-[0.05em] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#003459' }}
            onMouseOver={(e) => { const b = e.currentTarget as HTMLButtonElement; if (!b.disabled) b.style.background = '#00171F'; }}
            onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-3 text-gray-400 text-xs">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <p className="text-center text-xs text-gray-500 font-work">
          Remembered your password?{' '}
          <Link to="/login" className="text-[#003459] font-semibold hover:underline font-work">
            Sign in
          </Link>
        </p>
      </div>
    </Wrapper>
  );
};

export default ResetPasswordForm;