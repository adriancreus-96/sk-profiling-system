import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowLeft } from 'lucide-react';

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
      <linearGradient id="strokeGradForgot" x1="45%" y1="100%" x2="55%" y2="0%">
        <stop offset="0%" stopColor="#0B5A73" stopOpacity="0.32" />
        <stop offset="25%" stopColor="#15AAD9" stopOpacity="0.32" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.32" />
      </linearGradient>
    </defs>
    <text
      x="50%" y="100"
      textAnchor="middle"
      fill="none"
      stroke="url(#strokeGradForgot)"
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

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        alert(data.message || 'Something went wrong.');
      }
    } catch {
      // Don't reveal whether the email exists
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──
  if (submitted) {
    return (
      <Wrapper subtitle="Recover your account">
        <div className="w-full bg-white rounded-2xl shadow-2xl px-7 py-8 lg:px-10 lg:py-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#003459]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-[#003459]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 font-fugaz mb-2">Check Your Email</h2>
          <p className="text-gray-400 text-sm font-work leading-relaxed mb-6">
            If an account with that email exists, we've sent a password-reset link.
            Please check your inbox and spam folder.
          </p>
          <Link
            to="/login"
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em]"
            style={{ background: '#003459' }}
            onMouseOver={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = '#00171F')}
            onMouseOut={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = '#003459')}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Login
          </Link>
        </div>
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-white/30" />
          <span className="px-3 text-white/60 text-xs font-work">or</span>
          <div className="flex-1 border-t border-white/30" />
        </div>
        <p className="text-center text-xs text-white/70 font-work">
          Didn't receive an email?{' '}
          <button
            onClick={() => setSubmitted(false)}
            className="text-[#00171F] font-semibold hover:underline font-work"
          >
            Try again
          </button>
        </p>
      </Wrapper>
    );
  }

  // ── Input state ──
  return (
    <Wrapper subtitle="Recover your account">
      <div className="w-full bg-white rounded-2xl shadow-2xl px-7 py-8 lg:px-10 lg:py-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 lg:text-3xl font-fugaz">Forgot Password</h2>
          <p className="text-gray-400 text-xs mt-1 font-work">
            Enter your registered email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inp}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 mt-2 font-fugaz tracking-[0.05em] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#003459' }}
            onMouseOver={(e) => { const b = e.currentTarget as HTMLButtonElement; if (!b.disabled) b.style.background = '#00171F'; }}
            onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#003459'; }}
          >
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-3 text-gray-400 text-xs">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <p className="text-center text-xs text-gray-500 font-work">
          Remember your password?{' '}
          <Link to="/login" className="text-[#003459] font-semibold hover:underline font-work">
            Sign in
          </Link>
        </p>
      </div>
    </Wrapper>
  );
};

export default ForgotPasswordForm;