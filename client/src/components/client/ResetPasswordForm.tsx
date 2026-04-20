import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173";

const inp =
  'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition';

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

  // ── SHARED WRAPPER ──
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center py-10 px-4"
      style={{ background: 'linear-gradient(160deg, #0a2a3a 0%, #0d4a5c 40%, #1a7a8a 100%)' }}
    >
      {/* Logo */}
      <div className="mb-6 text-center">
        <p className="text-cyan-300 text-sm font-medium tracking-widest uppercase mb-1">Reset your</p>
        <h1 className="text-white font-black text-5xl tracking-tight leading-none" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
          SIGLA
        </h1>
        <p className="text-cyan-300 text-sm font-medium tracking-widest uppercase mt-1">password</p>
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );

  // ── Invalid link ──
  if (!token || !email) {
    return (
      <Wrapper>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Invalid Link</h2>
            <p className="text-gray-500 text-sm">
              This reset link is missing required information. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1 text-cyan-600 hover:underline text-sm font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Request a new link
            </Link>
          </div>
        </div>
      </Wrapper>
    );
  }

  // ── Success state ──
  if (success) {
    return (
      <Wrapper>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-8 text-center space-y-4">
            <CheckCircle className="w-14 h-14 text-cyan-500 mx-auto" />
            <h2 className="text-lg font-bold text-gray-800">Password Reset Successfully</h2>
            <p className="text-gray-500 text-sm">
              You can now log in with your new password.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl text-sm transition shadow-lg"
            >
              Go to Login
            </Link>
          </div>
        </div>
        <p className="text-center text-xs text-white/60 mt-4">
          Need help?{' '}
          <Link to="/forgot-password" className="text-cyan-300 font-semibold hover:underline">Request another link</Link>
        </p>
      </Wrapper>
    );
  }

  // ── Input state ──
  return (
    <Wrapper>
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-500" /> Reset Password
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Enter a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">New Password *</label>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Requirements */}
            {newPassword && (
              <div className="mt-2 bg-gray-50 rounded-lg p-2.5 space-y-1 text-xs">
                {[
                  { key: 'hasMinLength', label: 'At least 8 characters' },
                  { key: 'hasLetter',    label: 'Contains a letter (A-Z or a-z)' },
                  { key: 'hasNumber',    label: 'Contains a number (0-9)' },
                ].map(r => (
                  <div
                    key={r.key}
                    className={`flex items-center gap-1.5 ${
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
            <label className="block text-xs font-semibold text-gray-500 mb-1">Confirm Password *</label>
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
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

          {/* Error */}
          {error && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !isPasswordStrong() || !passwordsMatch()}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition shadow-lg"
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        <div className="px-6 pb-6">
          <Link
            to="/login"
            className="flex items-center justify-center gap-1 text-cyan-600 hover:text-cyan-700 text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
      </div>

      <p className="text-center text-xs text-white/60 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-cyan-300 font-semibold hover:underline">Sign in</Link>
      </p>
    </Wrapper>
  );
};

export default ResetPasswordForm;