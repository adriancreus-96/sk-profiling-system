import React, { useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import LoginForm from './components/client/LoginForm';
import RegistrationForm from './components/client/RegistrationForm';
import ResetPasswordForm from './components/client/ResetPasswordForm';
import AdminLogin from './components/admin/AdminLogin';
import AdminLanding from './components/admin/AdminLanding';
import AdminProfiles from './components/admin/AdminProfiles';
import CreateProfile from './components/admin/CreateProfile';
import PostEvent from './components/admin/PostEvent';
import ViewEvents from './components/admin/ViewEvents';
import HomePage from './components/client/HomePage';
import Setup2FA from './components/admin/Setup2FA';

const API_URL = import.meta.env.VITE_API_URL

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

// Admin-specific protection - checks for adminToken instead
const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const adminToken = localStorage.getItem('adminToken');
  return adminToken ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

// ---------------------------------------------------------------------------
// Layout shared by the unauthenticated landing pages (login / register).
// Full-viewport, vertically centred card with a subtle header.
// ---------------------------------------------------------------------------
const AuthLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col">
    {/* Minimal top bar — just the brand */}
    <header className="px-6 py-5">
      <div className="max-w-screen-lg mx-auto">
        <h1 className="text-2xl font-extrabold text-blue-800 tracking-tight">
          SK <span className="text-blue-500">System</span>
        </h1>
      </div>
    </header>

    {/* Centred card area */}
    <main className="flex-1 flex items-center justify-center px-4 pb-12">
      <div className="w-full max-w-lg">{children}</div>
    </main>
  </div>
);

// ---------------------------------------------------------------------------
// Forgot-Password form  (lives here for now; move to its own file if you like)
// Sends the email to your existing backend — wire up the endpoint as needed.
// ---------------------------------------------------------------------------
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
      // Show success anyway — don't reveal whether the email exists
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──
  if (submitted) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 text-center space-y-4">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800">Check Your Email</h2>
        <p className="text-gray-500 text-sm">
          If an account with that email exists, we've sent a password-reset link.
          Please check your inbox (and spam folder).
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
      </div>
    );
  }

  // ── Input state ──
  return (
    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Forgot Password</h2>
        <p className="text-gray-500 text-sm mt-1">
          Enter your registered email/contact number and we'll send you a reset link on your registerd email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              placeholder="juan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10 block w-full rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent p-2.5"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg shadow-sm transition duration-200"
        >
          {loading ? 'Sending…' : 'Send Reset Link'}
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

// ---------------------------------------------------------------------------
// App — route definitions
// ---------------------------------------------------------------------------
function App() {
  return (
    <Routes>
      {/* ── Public / Auth routes (landing page) ── */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={
          <AuthLayout>
            <LoginForm />
          </AuthLayout>
        }
      />

      <Route
        path="/register"
        element={
          <AuthLayout>
            <RegistrationForm />
          </AuthLayout>
        }
      />

      <Route path="/forgot-password" element={
        <AuthLayout>
          <ForgotPasswordForm />
        </AuthLayout>
      } />

      <Route path="/reset-password" element={
        <AuthLayout>
          <ResetPasswordForm />
        </AuthLayout>
      } />

      {/* ── Admin routes ── */}
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route 
        path="/admin/setup-2fa" 
        element={
          <AdminProtectedRoute>
            <Setup2FA />
          </AdminProtectedRoute>
        }
      />

      {/* Admin Landing Page (Main Dashboard) */}
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminLanding />
          </AdminProtectedRoute>
        }
      />

      {/* View Profiles (formerly /admin/dashboard) */}
      <Route
        path="/admin/profiles"
        element={
          <AdminProtectedRoute>
            <AdminProfiles />
          </AdminProtectedRoute>
        }
      />

      {/* Create New Profile */}
      <Route
        path="/admin/create-profile"
        element={
          <AdminProtectedRoute>
            <CreateProfile />
          </AdminProtectedRoute>
        }
      />

      {/* Post New Event */}
      <Route
        path="/admin/post-event"
        element={
          <AdminProtectedRoute>
            <PostEvent />
          </AdminProtectedRoute>
        }
      />

      {/* View Events */}
      <Route
        path="/admin/events"
        element={
          <AdminProtectedRoute>
            <ViewEvents />
          </AdminProtectedRoute>
        }
      />

      {/* Legacy route redirect - for backwards compatibility */}
      <Route path="/admin/dashboard" element={<Navigate to="/admin/profiles" replace />} />

      {/* ── Protected / Home route ── */}
      {/* Replace <div> placeholder with your real <HomePage /> component */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;