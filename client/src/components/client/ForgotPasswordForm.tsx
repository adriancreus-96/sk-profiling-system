import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173";

const inp =
  'w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition';

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <div
    className="min-h-screen w-full flex flex-col items-center justify-center py-10 px-4"
    style={{ background: 'linear-gradient(160deg, #0a2a3a 0%, #0d4a5c 40%, #1a7a8a 100%)' }}
  >
    <div className="mb-6 text-center">
      <p className="text-cyan-300 text-sm font-medium tracking-widest uppercase mb-1">Recover your</p>
      <h1
        className="text-white font-black text-5xl tracking-tight leading-none"
        style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}
      >
        SIGLA
      </h1>
      <p className="text-cyan-300 text-sm font-medium tracking-widest uppercase mt-1">account</p>
    </div>
    <div className="w-full max-w-md">{children}</div>
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
      <Wrapper>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 py-8 text-center space-y-4">
            <CheckCircle className="w-14 h-14 text-cyan-500 mx-auto" />
            <h2 className="text-lg font-bold text-gray-800">Check Your Email</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              If an account with that email exists, we've sent a password-reset link.
              Please check your inbox and spam folder.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl text-sm transition shadow-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
            </Link>
          </div>
        </div>
        <p className="text-center text-xs text-white/60 mt-4">
          Didn't receive an email?{' '}
          <button
            onClick={() => setSubmitted(false)}
            className="text-cyan-300 font-semibold hover:underline"
          >
            Try again
          </button>
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
            <Mail className="w-4 h-4 text-cyan-500" /> Forgot Password
          </h3>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            Enter your registered email and we'll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="email"
                placeholder="juan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`${inp} pl-9`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition shadow-lg"
          >
            {loading ? 'Sending…' : 'Send Reset Link'}
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
        Remember your password?{' '}
        <Link to="/login" className="text-cyan-300 font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </Wrapper>
  );
};

export default ForgotPasswordForm;