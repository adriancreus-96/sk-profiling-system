import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Filter, RefreshCcw, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserViewModal from '../modals/UserViewModal';

// Updated Interface to match full User model
interface UserData {
  _id: string;
  skIdNumber?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  suffix?: string;
  sex: 'Male' | 'Female';
  birthday: Date;
  profilePicture?: string;
  age?: number;
  youthAgeGroup?: string;
  
  block?: string;
  lot?: string;
  houseNumber?: string;
  street?: string;
  purok: string;
  
  email: string;
  contactNumber: string;
  status: 'Pending' | 'Approved';
  points?: number;
  qrCode?: string;
  
  civilStatus?: string;
  educationalBackground?: string;
  youthClassification?: string;
  workStatus?: string;
  
  registeredSkVoter?: boolean;
  registeredNationalVoter?: boolean;
  isPwd?: boolean;
  isCicwl?: boolean;
  isIndigenous?: boolean;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurok, setSelectedPurok] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved'>('All');

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) { navigate('/admin'); return; }

      try {
        const response = await axios.get('http://localhost:5000/api/admin/users');
        setAllUsers(response.data);
        setFilteredUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error", error);
        setLoading(false);
      }
    };
    fetchUsers();
  }, [navigate]);

  // --- 2. FILTER LOGIC (Intersection) ---
  useEffect(() => {
    let result = allUsers;

    // A. Apply Search (Name or ID)
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.lastName.toLowerCase().includes(lowerQuery) ||
        user.firstName.toLowerCase().includes(lowerQuery) ||
        (user.skIdNumber && user.skIdNumber.toLowerCase().includes(lowerQuery))
      );
    }

    // B. Apply Purok Filter
    if (selectedPurok !== 'All') {
      const fullPurokName = selectedPurok === 'P1' ? 'Purok 1' :
                            selectedPurok === 'P2' ? 'Purok 2' :
                            selectedPurok === 'P3' ? 'Purok 3' :
                            selectedPurok === 'P4' ? 'Purok 4' :
                            selectedPurok === 'P5' ? 'Purok 5' :
                            selectedPurok === 'P6' ? 'Purok 6' : 
                            selectedPurok === 'P7' ? 'Purok 7' : selectedPurok;
      
      result = result.filter(user => user.purok === fullPurokName);
    }

    // C. Apply Status Filter
    if (statusFilter !== 'All') {
      result = result.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(result);
  }, [searchQuery, selectedPurok, statusFilter, allUsers]);

  // --- HANDLERS ---
  
  const handleView = (user: UserData) => {
    console.log("OPENING MODAL FOR:", user);
    setSelectedUser(user);
    setIsEditMode(false);
  };

  const handleEdit = (userId: string) => {
    setIsEditMode(true);
  };

  const handleSaveEdit = async (updatedUser: UserData, originalUser: UserData) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Not authenticated');
      return;
    }

    try {
      const response = await axios.put(
        `http://localhost:5000/api/admin/users/${updatedUser._id}`,
        updatedUser,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state with the updated user
      setAllUsers(prev => prev.map(u => 
        u._id === updatedUser._id ? response.data : u
      ));

      // Update selectedUser to reflect changes
      setSelectedUser(response.data);
      
      // Exit edit mode
      setIsEditMode(false);
      
      alert('User updated successfully!');
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert(`Failed to update user: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleApprove = async (userId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Not authenticated');
      return;
    }

    if (!window.confirm('Are you sure you want to approve this user? This will generate their SK ID number.')) {
      return;
    }

    try {
      console.log('Approving user:', userId);
      console.log('Token:', token);
      
      const response = await axios.put(
        `http://localhost:5000/api/admin/approve/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Approval response:', response.data);
      
      // Update the local state with the new data from the server
      setAllUsers(prev => prev.map(u => 
        u._id === userId ? { 
          ...u, 
          status: 'Approved' as const,
          skIdNumber: response.data.skIdNumber,
          qrCode: response.data.skIdNumber
        } : u
      ));
      
      // Update selectedUser if it's still open
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser({
          ...selectedUser,
          status: 'Approved',
          skIdNumber: response.data.skIdNumber,
          qrCode: response.data.skIdNumber
        });
      }
      
      alert(`User approved successfully! SK ID: ${response.data.skIdNumber}`);
    } catch (error: any) {
      console.error('Error approving user:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert(`Failed to approve user: ${error.response?.data?.message || error.message}`);
    }
  };
  
  // Cycle Status: All -> Pending -> Approved -> All
  const cycleStatusFilter = () => {
    if (statusFilter === 'All') setStatusFilter('Pending');
    else if (statusFilter === 'Pending') setStatusFilter('Approved');
    else setStatusFilter('All');
  };

  // Reset Everything
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedPurok('All');
    setStatusFilter('All');
  };

  const PUROK_TABS = ['All', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'];

  if (loading) return <div className="p-10 text-center">Loading Profiles...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      
      {/* 1. TITLE */}
      <h1 className="text-4xl font-extrabold text-black mb-8 text-center tracking-tight">
        Youth Profiles
      </h1>

      {/* 2. CONTROLS BAR */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-4">
        
        {/* Purok Tabs (Left) */}
        <div className="flex bg-gray-200 p-1 rounded-lg overflow-x-auto">
          {PUROK_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedPurok(tab)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                selectedPurok === tab 
                  ? 'bg-white text-black shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Export (Right) */}
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
          <button className="bg-gray-300 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-400">
            Export
          </button>
        </div>
      </div>

      {/* 3. TABLE */}
      <div className="bg-transparent overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 mb-2 text-center font-bold text-xs uppercase tracking-wide text-gray-600">
          <div className="col-span-2 bg-teal-100 p-3 rounded-lg flex items-center justify-center">ID No.</div>
          <div className="col-span-2 bg-teal-100 p-3 rounded-lg flex items-center justify-center">Surname</div>
          <div className="col-span-2 bg-teal-100 p-3 rounded-lg flex items-center justify-center">First Name</div>
          <div className="col-span-2 bg-teal-100 p-3 rounded-lg flex items-center justify-center">Middle Name</div>
          <div className="col-span-2 bg-teal-100 p-3 rounded-lg flex items-center justify-center">Address</div>
          
          {/* Status Filter Button */}
          <button 
            onClick={cycleStatusFilter}
            className={`col-span-1 p-3 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              statusFilter === 'All' ? 'bg-teal-100 hover:bg-teal-200' : 
              statusFilter === 'Pending' ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' : 
              'bg-green-100 hover:bg-green-200 text-green-800'
            }`}
          >
            {statusFilter === 'All' ? 'Status' : statusFilter} <Filter className="w-3 h-3" />
          </button>

          {/* View / Reset Button */}
          <button 
            onClick={resetFilters}
            className="col-span-1 bg-teal-100 hover:bg-red-100 hover:text-red-600 p-3 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            title="Click to Reset All Filters"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Table Rows */}
        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
             <div className="text-center py-10 text-gray-400 bg-gray-100 rounded-lg">No profiles found matching filters</div>
          ) : (
             filteredUsers.map((user) => (
              <div key={user._id} className="grid grid-cols-12 gap-2 text-center text-sm items-center">
                <div className="col-span-2 bg-gray-100 p-3 rounded-lg font-mono text-xs truncate">
                  {user.skIdNumber || "---"}
                </div>
                <div className="col-span-2 bg-gray-100 p-3 rounded-lg font-semibold truncate">{user.lastName}</div>
                <div className="col-span-2 bg-gray-100 p-3 rounded-lg truncate">{user.firstName}</div>
                <div className="col-span-2 bg-gray-100 p-3 rounded-lg truncate">{user.middleName || "-"}</div>
                <div className="col-span-2 bg-gray-100 p-3 rounded-lg text-xs truncate">
                  {user.purok} {user.street ? `, ${user.street}` : ''}
                </div>
                
                {/* Status Badge */}
                <div className={`col-span-1 p-3 rounded-lg font-bold text-xs ${
                  user.status === 'Approved' ? 'bg-gray-100 text-green-600' : 'bg-gray-100 text-yellow-600'
                }`}>
                  {user.status}
                </div>

                {/* View Button */}
                <button 
                  onClick={() => handleView(user)}
                  className="col-span-1 bg-gray-200 hover:bg-gray-300 p-3 rounded-lg flex items-center justify-center font-bold text-gray-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* The Modal Component */}
      <UserViewModal 
        user={selectedUser} 
        isOpen={!!selectedUser} 
        onClose={() => {
          setSelectedUser(null);
          setIsEditMode(false);
        }}
        isEditMode={isEditMode}
        onEdit={handleEdit}
        onSave={handleSaveEdit}
        onApprove={handleApprove}
      />
    </div>
  );
};

export default AdminDashboard;