import React, { useState } from 'react';
import axios from 'axios';
import { Lock, Mail, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      // 1. Persist token & user (same as before)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // 2. Status-aware feedback  (fixed syntax — was broken template literals)
      const user = response.data.user;
      if (user.status === 'Pending') {
        alert('Login Successful! But your account is still PENDING approval.');
      } else {
        alert(`Welcome back, ${user.firstName}! Your SK ID is: ${user.skIdNumber}`);
      }

      // 3. Go to the protected home page
      navigate('/home');
    } catch (error: any) {
      alert('Login Failed: ' + (error.response?.data?.message || 'Server Error'));
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Member Login</h2>
        <p className="text-gray-500 text-sm">Access your SK Profile</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              className="pl-10 block w-full rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent p-2.5"
              placeholder="juan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="password"
              className="pl-10 block w-full rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent p-2.5"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Sign In button */}
        <button
          type="submit"
          className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center">
        <div className="flex-1 border-t border-gray-200"></div>
        <span className="px-3 text-gray-400 text-sm">or</span>
        <div className="flex-1 border-t border-gray-200"></div>
      </div>

      {/* Register link */}
      <p className="text-center text-sm text-gray-600">
        Not registered yet?{' '}
        <Link to="/register" className="text-blue-600 font-semibold hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;