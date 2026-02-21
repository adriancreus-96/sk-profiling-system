import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;
console.log('🔍 API_URL:', API_URL);

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/admin/login`, {
        username,
        password,
        twoFactorToken: twoFactorToken || undefined
      });

      if (response.data.requires2FA) {
        setRequires2FA(true);
        setIsLoading(false);
        return;
      }

      localStorage.setItem('adminToken', response.data.token);
      console.log("Login Success! Redirecting to admin landing page...");
      navigate('/admin');

    } catch (error: any) {
      console.error("Login Error:", error);

      if (error.response?.status === 429) {
        alert('Too many login attempts. Please try again later.');
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Access Denied');
      }

      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setRequires2FA(false);
    setTwoFactorToken('');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full">
            {requires2FA ? (
              <Lock className="w-8 h-8 text-blue-800" />
            ) : (
              <Shield className="w-8 h-8 text-blue-800" />
            )}
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {requires2FA ? 'Two-Factor Authentication' : 'Admin Portal'}
        </h2>

        {requires2FA && (
          <p className="text-sm text-center text-gray-600 mb-6">
            Enter the 6-digit code from your authenticator app
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {!requires2FA ? (
            <>
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full border border-gray-300 rounded-md p-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 2FA Token Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  className="block w-full border border-gray-300 rounded-md p-3 text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={twoFactorToken}
                  onChange={e => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  autoFocus
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Logged in as: <strong>{username}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={handleBack}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isLoading}
              >
                Back to Login
              </button>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isLoading || (requires2FA && twoFactorToken.length !== 6)}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Verifying...
              </>
            ) : requires2FA ? (
              'Verify & Login'
            ) : (
              'Enter Dashboard'
            )}
          </button>
        </form>

        {/* Rate limit notice */}
        <p className="text-xs text-center text-gray-500 mt-4">
          Limited to 5 login attempts per 15 minutes
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;