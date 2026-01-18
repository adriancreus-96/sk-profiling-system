import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';

// Import your components
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import LoginForm from './components/LoginForm';
import RegistrationForm from './components/RegistrationForm';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* NAVIGATION BAR */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center mb-8">
        <div className="font-bold text-xl text-blue-800">SK System</div>
        <div className="flex gap-4">
          <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">Youth Login</Link>
          <Link to="/register" className="text-gray-600 hover:text-blue-600 font-medium">Register</Link>
          <div className="border-l border-gray-300 mx-2"></div>
          {/* This Button takes you to the Admin Page */}
          <Link to="/admin" className="text-red-600 hover:text-red-800 font-medium">Admin Portal</Link>
        </div>
      </nav>

      {/* ROUTES */}
      <div className="container mx-auto px-4">
        <Routes>
          {/* Youth Routes */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegistrationForm />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>

    </div>
  );
}

export default App;