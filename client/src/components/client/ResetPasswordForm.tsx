import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL

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

  // If someone navigates here without a token/email, show an error immediately
  if (!token || !email) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 text-center space-y-4">
        <h2 className="text-xl font-bold text-red-600">Invalid Link</h2>
        <p className="text-gray-500 text-sm">
          This reset link is missing required information. Please request a new one.
        </p>
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Request a new link
        </Link>
      </div>
    );
  }

  // Password validation function
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
    return newPassword && confirmPassword && newPassword === confirmPassword;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const password = e.target.value;
    setNewPassword(password);
    validatePassword(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordStrong()) {
      setError('Please ensure your password meets all the requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

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

  // ── Success state ──
  if (success) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 text-center space-y-4">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800">Password Reset Successfully</h2>
        <p className="text-gray-500 text-sm">
          You can now log in with your new password.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center justify-center w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition duration-200"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  // ── Input state ──
  return (
    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
        <p className="text-gray-500 text-sm mt-1">Enter a new password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={newPassword}
              onChange={handlePasswordChange}
              required
              className="pl-10 pr-12 block w-full rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent p-2.5"
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
          {newPassword && (
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`pl-10 pr-12 block w-full rounded-lg border shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent p-2.5 ${
                confirmPassword && passwordsMatch() ? 'border-green-500 bg-green-50' : 
                confirmPassword && !passwordsMatch() ? 'border-red-500 bg-red-50' : 
                'border-gray-300'
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

        {/* Error message */}
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !isPasswordStrong() || !passwordsMatch()}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-sm transition duration-200"
        >
          {loading ? 'Resetting…' : 'Reset Password'}
        </button>
      </form>

      <Link
        to="/login"
        className="flex items-center justify-center gap-1 text-blue-600 hover:underline text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </Link>
    </div>
  );
};

export default ResetPasswordForm;