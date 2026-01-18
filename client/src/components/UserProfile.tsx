import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
//import QRCode from 'react-qr-code';
import { User, MapPin, LogOut, CheckCircle, Clock } from 'lucide-react';

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 1. Get user data from Local Storage
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      navigate('/login'); // Kick them out if not logged in
      return;
    }
    
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null; // Don't render anything while checking

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex justify-center">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <h2 className="font-bold text-gray-800">My Profile</h2>
          <button 
            onClick={handleLogout} 
            className="text-red-500 text-sm flex items-center gap-1 hover:text-red-700 font-medium"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>

        {/* STATUS CARD LOGIC */}
        {user.status === 'Pending' ? (
          
          // --- VIEW 1: PENDING STATE ---
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-md shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <h3 className="text-lg font-bold text-yellow-800">Application Pending</h3>
            </div>
            <p className="text-yellow-700 text-sm">
              Your registration is currently under review by the SK Admin. 
              <br /><br />
              Please check back later. Once approved, your Digital ID will appear here automatically.
            </p>
          </div>

        ) : (
          
          // --- VIEW 2: APPROVED / ID CARD STATE ---
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 relative">
            {/* ID Header */}
            <div className="bg-blue-600 p-4 text-center text-white relative">
              <div className="absolute top-4 right-4 bg-white/20 p-1 rounded">
                {/* Small logo placeholder */}
                <div className="w-6 h-6 bg-white/50 rounded-full"></div>
              </div>
              <h1 className="text-xl font-bold tracking-wider">SK DIGITAL ID</h1>
              <p className="text-blue-100 text-xs uppercase tracking-widest">Republic of the Philippines</p>
            </div>

            {/* ID Body */}
            <div className="p-6 flex flex-col items-center">
              
              {/* Profile Pic Placeholder */}
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md">
                 <User className="w-12 h-12 text-gray-400" />
              </div>

              <h2 className="text-2xl font-bold text-gray-800 uppercase text-center">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-blue-600 font-medium mb-6 text-sm">{user.youthClassification}</p>

              {/* Data Grid */}
              <div className="w-full grid grid-cols-2 gap-4 text-sm mb-6">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-gray-400 text-xs uppercase">SK ID Number</p>
                  <p className="font-mono font-bold text-gray-800">{user.skIdNumber || "GENERATING..."}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-gray-400 text-xs uppercase">Civil Status</p>
                  <p className="font-medium text-gray-800">{user.civilStatus}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg col-span-2 flex items-center gap-2 border border-gray-100">
                   <MapPin className="w-5 h-5 text-red-500" />
                   <div>
                      <p className="text-gray-400 text-xs uppercase">Address</p>
                      <p className="font-medium text-gray-800">{user.purok}, {user.street || "Barangay XYZ"}</p>
                   </div>
                </div>
              </div>

              {/* QR Code Area */}
              <div className="bg-white p-3 border-2 border-dashed border-gray-300 rounded-lg">
                {/* Generates a QR based on their Database ID */}
                <QRCode value={user._id} size={120} />
              </div>
              <p className="text-xs text-gray-400 mt-2">Scan to verify identity</p>

            </div>

            {/* ID Footer */}
            <div className="bg-gray-50 p-3 text-center border-t border-gray-200">
              <p className="text-xs text-green-600 flex items-center justify-center gap-1 font-bold uppercase">
                <CheckCircle className="w-4 h-4" /> Officially Verified Member
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;