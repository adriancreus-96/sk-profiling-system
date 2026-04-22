  import { Routes, Route, Navigate} from 'react-router-dom';
  import LoginForm from './components/client/LoginForm';
  import RegistrationForm from './components/client/RegistrationForm';
  import ResetPasswordForm from './components/client/ResetPasswordForm';
  import AdminLogin from './components/admin/AdminLogin';
  import AdminLanding from './components/admin/AdminLanding';
  import AdminProfiles from './components/admin/AdminProfiles';
  import CreateProfile from './components/admin/CreateAnnouncement';
  import PostEvent from './components/admin/PostEvent';
  import ViewEvents from './components/admin/ViewEvents';
  import HomePage from './components/client/HomePage';
  import Setup2FA from './components/admin/Setup2FA';
  import ForgotPasswordForm from './components/client/ForgotPasswordForm';

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
  /*const AuthLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col">

      {/* Centred card area }
      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-lg">{children}</div>
      </main>
    </div>
  );
  */

  // ---------------------------------------------------------------------------
  // Forgot-Password form  (lives here for now; move to its own file if you like)
  // Sends the email to your existing backend — wire up the endpoint as needed.
  // ---------------------------------------------------------------------------


  // ---------------------------------------------------------------------------
  // App — route definitions
  // ---------------------------------------------------------------------------
  function App() {
    return (
      <Routes>
        {/* ── Public / Auth routes (landing page) ── */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginForm />} />

        <Route path="/register" element={<RegistrationForm />} />

        <Route path="/forgot-password" element={<ForgotPasswordForm />} />

        <Route path="/reset-password" element={<ResetPasswordForm />} />

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