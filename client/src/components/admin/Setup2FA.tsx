import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Smartphone, Key, CheckCircle, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

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

  // Get admin token from localStorage
  const token = localStorage.getItem('adminToken');

  // Generate QR Code on mount
  React.useEffect(() => {
    handleSetup();
  }, []);

  const handleSetup = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/api/admin/2fa/setup`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

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
      await axios.post(
        `${API_URL}/api/admin/2fa/enable`,
        { token: verificationCode },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setStep('success');
      
      // Call success callback after a delay
      setTimeout(() => {
        if (onSuccess) onSuccess();
        if (onClose) onClose();
      }, 2000);
      
    } catch (error: any) {
      setError(error.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative">
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Loading State */}
        {isLoading && !qrCode && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Setting up 2FA...</p>
          </div>
        )}

        {/* Step 1: Scan QR Code */}
        {step === 'qrcode' && qrCode && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <Smartphone className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
              Scan QR Code
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Use Google Authenticator or Authy to scan this QR code
            </p>

            {/* QR Code Display */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
              <img 
                src={qrCode} 
                alt="2FA QR Code" 
                className="w-full max-w-xs mx-auto"
              />
            </div>

            {/* Manual Entry Option */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Can't scan? Enter this code manually:
              </p>
              <div className="bg-white border border-gray-300 rounded p-3 font-mono text-sm break-all text-center">
                {secret}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <button
              onClick={() => setStep('verify')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              I've Scanned the Code
            </button>
          </>
        )}

        {/* Step 2: Verify Code */}
        {step === 'verify' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-purple-100 p-4 rounded-full">
                <Key className="w-12 h-12 text-purple-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
              Verify Setup
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Enter the 6-digit code from your authenticator app
            </p>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-gray-300 rounded-lg p-4 text-center text-3xl tracking-widest font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000000"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Enable 2FA'}
              </button>

              <button
                type="button"
                onClick={() => setStep('qrcode')}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                disabled={isLoading}
              >
                Back
              </button>
            </form>
          </>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
              2FA Enabled Successfully!
            </h2>
            <p className="text-center text-gray-600 mb-8">
              Your account is now protected with two-factor authentication. 
              You'll need your authenticator app to log in from now on.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Keep your authenticator app safe. If you lose access to it, 
                contact your system administrator.
              </p>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Setup2FA;