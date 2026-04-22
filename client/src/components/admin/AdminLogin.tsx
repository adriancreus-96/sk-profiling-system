import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173";

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
        twoFactorToken: twoFactorToken || undefined,
      });
      if (response.data.requires2FA) {
        setRequires2FA(true);
        setIsLoading(false);
        return;
      }
      localStorage.setItem('adminToken', response.data.token);
      navigate('/admin');
    } catch (error: any) {
      if (error.response?.status === 429) {
        alert('Too many login attempts. Please try again later.');
      } else {
        alert(error.response?.data?.message || 'Access Denied');
      }
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #5CB0B3 37%, #007EA7 100%)' }}
    >
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* LEFT PANEL — desktop only */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-16 py-12">
          <div className="mb-6 text-center">
            <svg viewBox="0 0 620 130" xmlns="http://www.w3.org/2000/svg"
              style={{ overflow: 'visible', display: 'block', width: '100%' }}>
              <defs>
                <linearGradient id="strokeGradAdmin" x1="45%" y1="100%" x2="55%" y2="0%">
                  <stop offset="0%" stopColor="#0B5A73" stopOpacity="0.32" />
                  <stop offset="25%" stopColor="#15AAD9" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.32" />
                </linearGradient>
              </defs>
              <text x="50%" y="100" textAnchor="middle" fill="none"
                stroke="url(#strokeGradAdmin)" strokeWidth="30" strokeLinejoin="round"
                style={{ fontFamily: "'Fugaz One', Impact, sans-serif", fontSize: '200px',
                  fontWeight: 900, letterSpacing: '-0.01em',
                  filter: 'drop-shadow(0px 6px 0px rgba(0,0,0,0.3))' }}>
                SIGLA
              </text>
              <text x="50%" y="100" textAnchor="middle" fill="#00171F" stroke="#00171F" strokeWidth="2"
                style={{ fontFamily: "'Fugaz One', Impact, sans-serif", fontSize: '200px',
                  fontWeight: 900, letterSpacing: '-0.02em' }}>
                SIGLA
              </text>
            </svg>
          </div>

          <p className="text-white text-base text-center italic opacity-90 leading-relaxed max-w-xs font-fugaz">
            <span className="font-bold text-[#00171F]">S</span>K{' '}
            <span className="font-bold text-[#00171F]">I</span>nfosystem for{' '}
            <span className="font-bold text-[#00171F]">G</span>rowth,{' '}
            <span className="font-bold text-[#00171F]">L</span>eadership, and{' '}
            <span className="font-bold text-[#00171F]">A</span>chievement
          </p>

          <div className="mt-16 text-center">
            <p className="text-white text-sm italic opacity-70 leading-relaxed font-fugaz">
              Sangguniang Kabataan<br />Calumpang Cerca, Indang, Cavite
            </p>
          </div>
        </div>

        {/* RIGHT PANEL — form */}
        <div className="flex-1 lg:w-1/2 flex flex-col items-center justify-between py-10 px-4 lg:justify-center lg:py-0">

          {/* Mobile branding */}
          <div className="lg:hidden flex flex-col items-center mb-6 mt-4 w-full px-6">
            <svg viewBox="0 0 620 130" xmlns="http://www.w3.org/2000/svg"
              className="overflow-visible block w-full">
              <defs>
                <linearGradient id="strokeGradAdminMobile" x1="45%" y1="100%" x2="55%" y2="0%">
                  <stop offset="0%" stopColor="#0B5A73" stopOpacity="0.32" />
                  <stop offset="25%" stopColor="#15AAD9" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.32" />
                </linearGradient>
              </defs>
              <text x="50%" y="100" textAnchor="middle" fill="none"
                stroke="url(#strokeGradAdminMobile)" strokeWidth="30"
                style={{ fontFamily: "'Fugaz One', Impact, sans-serif", fontSize: '150px',
                  fontWeight: 900, filter: 'drop-shadow(0px 8px 4px #003459)' }}>
                SIGLA
              </text>
              <text x="50%" y="100" textAnchor="middle" fill="#00171F" stroke="#00171F" strokeWidth="2"
                style={{ fontFamily: "'Fugaz One', Impact, sans-serif", fontSize: '150px', fontWeight: 900 }}>
                SIGLA
              </text>
            </svg>
            <p className="text-white text-xs mt-2 text-center italic opacity-90 font-fugaz [filter:drop-shadow(0px_2px_2px_#003459)]">
              <span className="font-bold text-[#00171F]">S</span>K{' '}
              <span className="font-bold text-[#00171F]">I</span>nfosystem for{' '}
              <span className="font-bold text-[#00171F]">G</span>rowth,{' '}
              <span className="font-bold text-[#00171F]">L</span>eadership, and{' '}
              <span className="font-bold text-[#00171F]">A</span>chievement
            </p>
          </div>

          {/* Card */}
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl px-7 py-8 lg:max-w-md lg:px-10 lg:py-10">

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="bg-[#EAF4F7] p-3 rounded-full">
                {requires2FA
                  ? <Lock className="w-7 h-7 text-[#007EA7]" />
                  : <Shield className="w-7 h-7 text-[#007EA7]" />}
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 lg:text-3xl font-fugaz [filter:drop-shadow(0px_2px_50px_#000000)]">
                {requires2FA ? 'Verification' : 'Admin Portal'}
              </h2>
              <p className="text-gray-400 text-xs mt-1 font-work">
                {requires2FA
                  ? 'Enter the 6-digit code from your authenticator app'
                  : 'Restricted access — authorized personnel only'}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {!requires2FA ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">
                      Username
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="block w-full rounded-lg border border-gray-300 p-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
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
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      className="block w-full rounded-lg border border-gray-300 p-3 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                      value={twoFactorToken}
                      onChange={e => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      required
                      autoFocus
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-400 mt-2 text-center font-work">
                      Logged in as: <strong className="text-[#00171F]">{username}</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setRequires2FA(false); setTwoFactorToken(''); }}
                    className="w-full py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition duration-200 font-work"
                    disabled={isLoading}
                  >
                    Back to Login
                  </button>
                </>
              )}

              <button
                type="submit"
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 mt-2 font-fugaz tracking-[0.05em] disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                style={{ background: '#003459' }}
                onMouseOver={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#00171F'; }}
                onMouseOut={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}
                disabled={isLoading || (requires2FA && twoFactorToken.length !== 6)}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Verifying...
                  </>
                ) : requires2FA ? 'Verify & Enter' : 'Enter Dashboard'}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-5 font-work">
              Limited to 5 login attempts per 15 minutes
            </p>
          </div>

          {/* Mobile footer */}
          <div className="lg:hidden text-center mt-6 mb-2">
            <p className="text-white text-xs italic opacity-70 leading-relaxed font-fugaz">
              Sangguniang Kabataan<br />Calumpang Cerca, Indang, Cavite
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminLogin;