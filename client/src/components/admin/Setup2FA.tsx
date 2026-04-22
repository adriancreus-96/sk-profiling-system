import React, { useState } from 'react';
import axios from 'axios';
import { Smartphone, Key, CheckCircle, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173";

interface Setup2FAProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const Setup2FA: React.FC<Setup2FAProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState<'qrcode' | 'verify' | 'success'>('qrcode');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('adminToken');

  React.useEffect(() => { handleSetup(); }, []);

  const handleSetup = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/api/admin/2fa/setup`, {},
        { headers: { Authorization: `Bearer ${token}` } });
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/admin/2fa/enable`,
        { token: verificationCode },
        { headers: { Authorization: `Bearer ${token}` } });
      setStep('success');
      setTimeout(() => { onSuccess?.(); onClose?.(); }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const stepIcons: Record<string, React.ReactNode> = {
    qrcode: <Smartphone className="w-7 h-7 text-[#007EA7]" />,
    verify: <Key className="w-7 h-7 text-[#007EA7]" />,
    success: <CheckCircle className="w-8 h-8 text-[#007EA7]" />,
  };

  const stepTitles: Record<string, string> = {
    qrcode: 'Scan QR Code',
    verify: 'Verify Setup',
    success: '2FA Enabled!',
  };

  return (
    /* Faux overlay — normal-flow div so it contributes height */
    <div style={{ minHeight: '100vh', background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>

      <div className="bg-white rounded-2xl shadow-2xl px-7 py-8 w-full max-w-sm lg:max-w-md lg:px-10 lg:py-10 relative">

        {/* Close */}
        {onClose && (
          <button onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Loading spinner (initial fetch) */}
        {isLoading && !qrCode && step === 'qrcode' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#007EA7] mx-auto mb-4" />
            <p className="text-gray-400 text-sm font-work">Setting up 2FA...</p>
          </div>
        )}

        {/* Step content — only show once we have data or moved past qrcode */}
        {!(isLoading && !qrCode && step === 'qrcode') && (
          <>
            {/* Icon + heading */}
            <div className="flex justify-center mb-4">
              <div className="bg-[#EAF4F7] p-3 rounded-full">
                {stepIcons[step]}
              </div>
            </div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 lg:text-3xl font-fugaz [filter:drop-shadow(0px_2px_50px_#000000)]">
                {stepTitles[step]}
              </h2>
              {step === 'qrcode' && (
                <p className="text-gray-400 text-xs mt-1 font-work">
                  Use Google Authenticator or Authy to scan this QR code
                </p>
              )}
              {step === 'verify' && (
                <p className="text-gray-400 text-xs mt-1 font-work">
                  Enter the 6-digit code from your authenticator app
                </p>
              )}
              {step === 'success' && (
                <p className="text-gray-400 text-xs mt-1 font-work">
                  Your account is now protected with two-factor authentication
                </p>
              )}
            </div>

            {/* ── Step 1: QR Code ── */}
            {step === 'qrcode' && qrCode && (
              <>
                <div className="border border-gray-200 rounded-xl p-4 mb-4 flex justify-center">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 object-contain" />
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                  <p className="text-xs font-medium text-[#00171F] mb-2 font-work">
                    Can't scan? Enter this code manually:
                  </p>
                  <p className="font-mono text-xs break-all text-center text-gray-600 bg-white border border-gray-200 rounded-lg p-3">
                    {secret}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-4 py-3 mb-4 font-work">
                    {error}
                  </div>
                )}

                <button
                  onClick={() => setStep('verify')}
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em]"
                  style={{ background: '#003459' }}
                  onMouseOver={e => (e.currentTarget.style.background = '#00171F')}
                  onMouseOut={e => (e.currentTarget.style.background = '#003459')}
                >
                  I've Scanned the Code
                </button>
              </>
            )}

            {/* ── Step 2: Verify ── */}
            {step === 'verify' && (
              <form onSubmit={handleVerify} className="space-y-4">
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
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    autoFocus
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-4 py-3 font-work">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                  style={{ background: '#003459' }}
                  onMouseOver={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#00171F'; }}
                  onMouseOut={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Verifying...
                    </>
                  ) : 'Enable 2FA'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('qrcode')}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition duration-200 font-work"
                >
                  Back
                </button>
              </form>
            )}

            {/* ── Step 3: Success ── */}
            {step === 'success' && (
              <div className="bg-[#EAF4F7] border border-[#B3D9E5] rounded-xl p-4">
                <p className="text-xs text-[#003459] font-work leading-relaxed">
                  <strong>Important:</strong> Keep your authenticator app safe. If you lose access,
                  contact your system administrator.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Setup2FA;