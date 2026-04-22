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
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
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
    <div className="min-h-screen w-full flex flex-col items-center justify-between py-10 px-4"
      style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #5CB0B3 37%, #007EA7 100%)' }}>

      {/* Branding */}
      <div className="flex flex-col items-center mb-6 mt-4 w-full max-w-sm px-6">
        <span className="block w-full">
          <svg viewBox="0 0 620 130" xmlns="http://www.w3.org/2000/svg"
            className="overflow-visible block w-full">
            <defs>
              <linearGradient id="strokeGradLogin" x1="45%" y1="100%" x2="55%" y2="0%">
                <stop offset="0%" stopColor="#0B5A73" stopOpacity="0.32" />
                <stop offset="25%" stopColor="#15AAD9" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.32" />
              </linearGradient>
            </defs>
            <text x="50%" y="100" textAnchor="middle" fill="none"
              stroke="url(#strokeGradLogin)" strokeWidth="30"
              style={{
                fontFamily: "'Fugaz One', Impact, sans-serif", fontSize: '150px',
                fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0em',
                filter: 'drop-shadow(0px 8px 4px #003459)'
              }}>
              SIGLA
            </text>
            <text x="50%" y="100" textAnchor="middle" fill="#00171F" stroke="#00171F" strokeWidth="2"
              style={{
                fontFamily: "'Fugaz One', Impact, sans-serif", fontSize: '150px',
                fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0em'
              }}>
              SIGLA
            </text>
          </svg>
        </span>
        <p className="text-white text-[10px] mt-2 text-center italic opacity-90 font-fugaz [filter:drop-shadow(0px_2px_2px_#003459)] whitespace-nowrap">          <span className="font-bold text-[#00171F]">S</span>K{' '}
          <span className="font-bold text-[#00171F]">I</span>nfosystem for{' '}
          <span className="font-bold text-[#00171F]">G</span>rowth,{' '}
          <span className="font-bold text-[#00171F]">L</span>eadership, and{' '}
          <span className="font-bold text-[#00171F]">A</span>chievement
        </p>

      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl px-7 py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 font-fugaz [filter:drop-shadow(0px_2px_50px_#000000)]">
            Member Login
          </h2>
          <p className="text-gray-400 text-xs mt-1 font-work">Log in to your SIGLA Account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#00171F] mb-1 font-work">Email Address</label>
            <input type="email"
              className="block w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
              value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-[#00171F] font-work">Password</label>
              <Link to="/forgot-password" className="text-xs text-[#003459] hover:underline font-work">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'}
                className="block w-full rounded-lg border border-gray-300 p-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit"
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white transition duration-200 mt-2 font-fugaz tracking-[0.05em]"
            style={{ background: '#003459' }}
            onMouseOver={e => ((e.currentTarget as HTMLButtonElement).style.background = '#00171F')}
            onMouseOut={e => ((e.currentTarget as HTMLButtonElement).style.background = '#003459')}>
            Sign in
          </button>
        </form>

        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-3 text-gray-400 text-xs">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <p className="text-center text-xs text-gray-500 font-work">
          Not registered yet?{' '}
          <Link to="/register" className="text-[#003459] font-semibold hover:underline font-work">
            Create an account
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 mb-2">
        <p className="text-white text-xs italic opacity-70 leading-relaxed font-fugaz">
          Sangguniang Kabataan<br />Calumpang Cerca, Indang, Cavite
        </p>
      </div>
    </div>
  );
};

export default LoginForm;