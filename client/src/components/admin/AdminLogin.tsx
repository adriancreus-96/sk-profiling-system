import React, { useState } from 'react';
import axios from 'axios';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL
console.log('🔍 API_URL:', API_URL); 

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const response = await axios.post(`${API_URL}/api/admin/login`, {
        username,
        password
        });

        // 1. Save Token
        localStorage.setItem('adminToken', response.data.token);
        
        // 2. DEBUG: Check if this line runs
        console.log("Login Success! Redirecting to admin landing page...");

        // 3. Redirect to NEW admin landing page
        navigate('/admin'); 
        
    } catch (error) {
        console.error("Login Error:", error); // See the real error in Console (F12)
        alert('Access Denied');
    }
    };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <Shield className="w-8 h-8 text-blue-800" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Admin Portal</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input 
              type="text" 
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              type="password" 
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-gray-800 text-white py-2 rounded-md hover:bg-gray-700">
            Enter Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;