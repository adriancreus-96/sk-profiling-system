import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'localhost:5173';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const user = response.data.user;
      if (user.status === 'Pending') {
        alert('Login Successful! But your account is still PENDING approval.');
      } else {
        alert(`Welcome back, ${user.firstName}! Your SK ID is: ${user.skIdNumber}`);
      }

      navigate('/home');
    } catch (error: any) {
      alert('Login Failed: ' + (error.response?.data?.message || 'Server Error'));
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #4fc3c3 0%, #2a8a8a 40%, #1a5f6e 70%, #0d3d4f 100%)',
      }}
    >
      <div className="flex-1 flex flex-col lg:flex-row">

        {/* ── LEFT PANEL: branding, desktop only ── */}
        <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center px-16 py-12">
          <div className="mb-6 text-center">
            <span
              className="text-white font-black uppercase block"
              style={{
                fontSize: '6rem',
                fontFamily: "'Arial Black', Impact, sans-serif",
                textShadow: '6px 6px 0px rgba(0,0,0,0.3)',
                letterSpacing: '0.1em',
                lineHeight: 1,
              }}
            >
              SIGLA
            </span>
            <div
              className="h-0.5 bg-white opacity-50 mt-2 mx-auto"
              style={{ width: '80%', transform: 'skewX(-15deg)' }}
            />
          </div>

          <p
            className="text-white text-base text-center italic opacity-90 leading-relaxed max-w-xs"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <span className="font-bold not-italic">S</span>angguniang{' '}
            <span className="font-bold not-italic">K</span>abataan for{' '}
            <span className="font-bold not-italic">G</span>rowth,{' '}
            <span className="font-bold not-italic">L</span>eadership, and{' '}
            <span className="font-bold not-italic">A</span>chievement
          </p>

          <div className="mt-16 text-center">
            <p
              className="text-white text-sm italic opacity-70 leading-relaxed"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Sangguniang Kabataan
              <br />
              Calumpang Cerca, Indang, Cavite
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL: form ── */}
        <div className="flex-1 lg:w-1/2 flex flex-col items-center justify-between py-10 px-4 lg:justify-center lg:py-0">

          {/* Mobile-only logo */}
          <div className="lg:hidden flex flex-col items-center mb-6 mt-4">
            <span
              className="text-white font-black uppercase"
              style={{
                fontSize: '3.5rem',
                fontFamily: "'Arial Black', Impact, sans-serif",
                textShadow: '4px 4px 0px rgba(0,0,0,0.3)',
                letterSpacing: '0.12em',
                lineHeight: 1,
              }}
            >
              SIGLA
            </span>
            <div
              className="h-0.5 bg-white opacity-50 mt-1"
              style={{ width: '90%', transform: 'skewX(-15deg)' }}
            />
            <p
              className="text-white text-xs mt-2 text-center italic opacity-90"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              <span className="font-bold not-italic">S</span>angguniang{' '}
              <span className="font-bold not-italic">K</span>abataan for{' '}
              <span className="font-bold not-italic">G</span>rowth,{' '}
              <span className="font-bold not-italic">L</span>eadership, and{' '}
              <span className="font-bold not-italic">A</span>chievement
            </p>
          </div>

          {/* Card */}
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl px-7 py-8 lg:max-w-md lg:px-10 lg:py-10">
            <div className="text-center mb-6">
              <h2
                className="text-2xl font-bold text-gray-900 lg:text-3xl"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Member Login
              </h2>
              <p className="text-gray-400 text-xs mt-1">Log in to your SIGLA Account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <Link to="/forgot-password" className="text-xs text-teal-600 hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full rounded-lg border border-gray-300 p-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In */}
              <button
                type="submit"
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 mt-2"
                style={{ background: 'linear-gradient(135deg, #1a5f7a 0%, #0d3d52 100%)' }}
                onMouseOver={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    'linear-gradient(135deg, #1e6d8a 0%, #0f4760 100%)')
                }
                onMouseOut={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    'linear-gradient(135deg, #1a5f7a 0%, #0d3d52 100%)')
                }
              >
                Sign In
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-gray-200" />
              <span className="px-3 text-gray-400 text-xs">or</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            {/* Register */}
            <p className="text-center text-xs text-gray-500">
              Not registered yet?{' '}
              <Link to="/register" className="text-teal-600 font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          {/* Mobile-only footer */}
          <div className="lg:hidden text-center mt-6 mb-2">
            <p
              className="text-white text-xs italic opacity-80 leading-relaxed"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Sangguniang Kabataan
              <br />
              Calumpang Cerca, Indang, Cavite
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginForm;