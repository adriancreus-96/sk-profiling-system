import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Filter, RefreshCcw, Eye, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserViewModal from '../../modals/UserViewModal';
import ArchiveModal from '../../modals/ArchiveModal';

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
  status: 'Pending' | 'Approved' | 'Rejected' | 'Archived' | string;
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

const API_URL = import.meta.env.VITE_API_URL || "localhost:5173";

const AdminProfiles = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [archivedUsers, setArchivedUsers] = useState<UserData[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedArchivedUser, setSelectedArchivedUser] = useState<UserData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurok, setSelectedPurok] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved'>('All');
  const [archiveStatusFilter, setArchiveStatusFilter] = useState<'All' | 'Rejected' | 'Archived'>('All');

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) { navigate('/admin/login'); return; }
      try {
        const response = await axios.get(`${API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const active = response.data.filter((u: UserData) => u.status !== 'Rejected' && u.status !== 'Archived');
        const archived = response.data.filter((u: UserData) => u.status === 'Rejected' || u.status === 'Archived');
        setAllUsers(active);
        setFilteredUsers(active);
        setArchivedUsers(archived);
        setLoading(false);
        const state = location.state as any;
        if (state?.openUserId) {
          const userToOpen = active.find((u: UserData) => u._id === state.openUserId);
          if (userToOpen) setSelectedUser(userToOpen);
          navigate(location.pathname, { replace: true });
        }
      } catch (error: any) {
        console.error('Error', error);
        if (error.response?.status === 401) { localStorage.removeItem('adminToken'); navigate('/admin/login'); }
        setLoading(false);
      }
    };
    fetchUsers();
  }, [navigate, location]);

  useEffect(() => {
    let result = showArchive ? archivedUsers : allUsers;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(user =>
        user.lastName.toLowerCase().includes(lowerQuery) ||
        user.firstName.toLowerCase().includes(lowerQuery) ||
        (user.skIdNumber && user.skIdNumber.toLowerCase().includes(lowerQuery))
      );
    }
    if (selectedPurok !== 'All') {
      const fullPurokName = `Purok ${selectedPurok.replace('P', '')}`;
      result = result.filter(user => user.purok === fullPurokName);
    }
    if (showArchive) {
      if (archiveStatusFilter !== 'All') result = result.filter(user => user.status === archiveStatusFilter);
    } else {
      if (statusFilter !== 'All') result = result.filter(user => user.status === statusFilter);
    }
    setFilteredUsers(result);
  }, [searchQuery, selectedPurok, statusFilter, archiveStatusFilter, allUsers, archivedUsers, showArchive]);

  const handleView = (user: UserData) => {
    if (showArchive) { setSelectedArchivedUser(user); }
    else { setSelectedUser(user); setIsEditMode(false); }
  };
  const handleEdit = (_userId: string) => setIsEditMode(true);
  const handleCancelEdit = () => setIsEditMode(false);

  const handleSaveEdit = async (updatedUser: UserData, _originalUser: UserData, newProfilePicture?: File) => {
    const token = localStorage.getItem('adminToken');
    if (!token) { alert('Not authenticated'); return; }
    try {
      let response;
      if (newProfilePicture) {
        const formData = new FormData();
        const skipFields = ['_id', 'profilePicture', 'eventRegistrations', 'eventParticipations', 'qrCode', 'points', 'skIdNumber', 'status', 'passwordHash'];
        Object.entries(updatedUser).forEach(([key, value]) => {
          if (skipFields.includes(key) || value === undefined || value === null || Array.isArray(value)) return;
          if (typeof value === 'object' && !(value instanceof Date)) return;
          formData.append(key, String(value));
        });
        formData.append('profilePicture', newProfilePicture);
        response = await axios.put(`${API_URL}/api/admin/update-user/${updatedUser._id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        response = await axios.put(`${API_URL}/api/admin/update-user/${updatedUser._id}`, updatedUser, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      }
      const savedUser = response.data;
      setAllUsers(prev => prev.map(u => u._id === savedUser._id ? savedUser : u));
      setSelectedUser(savedUser);
      setIsEditMode(false);
      alert('User updated successfully!');
    } catch (error: any) {
      if (error.response?.status === 401) { localStorage.removeItem('adminToken'); navigate('/admin/login'); return; }
      alert(`Failed to update user: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleApprove = async (userId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) { alert('Not authenticated'); return; }
    if (!window.confirm('Are you sure you want to approve this user? This will generate their SK ID number.')) return;
    try {
      const response = await axios.put(`${API_URL}/api/admin/approve/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setAllUsers(prev => prev.map(u => u._id === userId ? { ...u, status: 'Approved' as const, skIdNumber: response.data.skIdNumber, qrCode: response.data.skIdNumber } : u));
      if (selectedUser && selectedUser._id === userId) setSelectedUser({ ...selectedUser, status: 'Approved', skIdNumber: response.data.skIdNumber, qrCode: response.data.skIdNumber });
      alert(`User approved successfully! SK ID: ${response.data.skIdNumber}`);
    } catch (error: any) {
      if (error.response?.status === 401) { localStorage.removeItem('adminToken'); navigate('/admin/login'); return; }
      alert(`Failed to approve user: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleReject = async (userId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) { alert('Not authenticated'); return; }
    try {
      const response = await axios.put(`${API_URL}/api/admin/reject/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const rejectedUser = { ...response.data, status: 'Rejected' };
      setAllUsers(prev => prev.filter(u => u._id !== userId));
      setArchivedUsers(prev => [...prev, rejectedUser]);
      setSelectedUser(null);
      alert('User rejected and moved to archive.');
    } catch (error: any) {
      if (error.response?.status === 401) { localStorage.removeItem('adminToken'); navigate('/admin/login'); return; }
      alert(`Failed to reject user: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRestore = async (userId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) { alert('Not authenticated'); return; }
    try {
      const response = await axios.put(`${API_URL}/api/admin/restore/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const restoredUser = { ...response.data, status: 'Pending' };
      setArchivedUsers(prev => prev.filter(u => u._id !== userId));
      setAllUsers(prev => [...prev, restoredUser]);
      setSelectedArchivedUser(null);
      alert('User restored successfully!');
    } catch (error: any) {
      if (error.response?.status === 401) { localStorage.removeItem('adminToken'); navigate('/admin/login'); return; }
      alert(`Failed to restore user: ${error.response?.data?.message || error.message}`);
    }
  };

  const handlePermanentDelete = async (userId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) { alert('Not authenticated'); return; }
    try {
      await axios.delete(`${API_URL}/api/admin/permanent-delete/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      setArchivedUsers(prev => prev.filter(u => u._id !== userId));
      setSelectedArchivedUser(null);
      alert('User permanently deleted from the system.');
    } catch (error: any) {
      if (error.response?.status === 401) { localStorage.removeItem('adminToken'); navigate('/admin/login'); return; }
      alert(`Failed to delete user: ${error.response?.data?.message || error.message}`);
    }
  };

  const cycleStatusFilter = () => {
    if (statusFilter === 'All') setStatusFilter('Pending');
    else if (statusFilter === 'Pending') setStatusFilter('Approved');
    else setStatusFilter('All');
  };
  const cycleArchiveStatusFilter = () => {
    if (archiveStatusFilter === 'All') setArchiveStatusFilter('Rejected');
    else if (archiveStatusFilter === 'Rejected') setArchiveStatusFilter('Archived');
    else setArchiveStatusFilter('All');
  };
  const resetFilters = () => { setSearchQuery(''); setSelectedPurok('All'); setStatusFilter('All'); setArchiveStatusFilter('All'); };

  const PUROK_TABS = ['All', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'];

  if (loading) return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #5CB0B3 37%, #007EA7 100%)' }}
    >
      <p className="text-white/70 text-sm font-work">Loading Profiles...</p>
    </div>
  );

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #5CB0B3 37%, #007EA7 100%)' }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/15 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-1.5 text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] px-3 py-2 rounded-lg"
            style={{ background: 'rgba(0,52,89,0.35)' }}
            onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,23,31,0.5)')}
            onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,52,89,0.35)')}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </button>
          <h1 className="text-lg font-bold text-white font-fugaz">
            Youth Profiles {showArchive && '— Archive'}
          </h1>
          <button
            onClick={() => setShowArchive(!showArchive)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] px-3 py-2 rounded-lg"
            style={{ background: 'rgba(0,52,89,0.35)' }}
            onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,23,31,0.5)')}
            onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,52,89,0.35)')}
          >
            {showArchive ? 'Active Profiles' : 'View Archive'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-4">

        {/* Profile Count Badge */}
        <div className="flex items-center justify-between">
          <span className="px-4 py-1.5 bg-white/20 text-white text-sm font-semibold rounded-full font-work border border-white/30">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'Profile' : 'Profiles'} Found
            {selectedPurok !== 'All' && ` · ${selectedPurok}`}
            {!showArchive && statusFilter !== 'All' && ` · ${statusFilter}`}
            {showArchive && archiveStatusFilter !== 'All' && ` · ${archiveStatusFilter}`}
            {searchQuery && ` · "${searchQuery}"`}
          </span>
        </div>

        {/* Filters row */}
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          {/* Purok tabs */}
          <div className="flex bg-white/20 border border-white/30 p-1 rounded-xl overflow-x-auto gap-1">
            {PUROK_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedPurok(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all font-fugaz ${
                  selectedPurok === tab
                    ? 'bg-white text-[#003459] shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search + Export */}
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or SK ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 pl-9 pr-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition bg-white"
              />
            </div>
            <button
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em]"
              style={{ background: '#003459' }}
              onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#00171F')}
              onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#003459')}
            >
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-0 text-center font-bold text-xs uppercase tracking-wide text-[#003459] border-b border-gray-100">
            <div className="col-span-2 py-3 px-3 bg-[#003459]/5">ID No.</div>
            <div className="col-span-2 py-3 px-3 bg-[#003459]/5">Surname</div>
            <div className="col-span-2 py-3 px-3 bg-[#003459]/5">First Name</div>
            <div className="col-span-2 py-3 px-3 bg-[#003459]/5">Middle Name</div>
            <div className="col-span-2 py-3 px-3 bg-[#003459]/5">Address</div>
            <button
              onClick={showArchive ? cycleArchiveStatusFilter : cycleStatusFilter}
              className={`col-span-1 py-3 px-2 flex items-center justify-center gap-1 transition-colors text-xs font-bold font-fugaz border-l border-gray-100 ${
                showArchive ? (
                  archiveStatusFilter === 'All' ? 'bg-[#003459]/5 text-[#003459]' :
                  archiveStatusFilter === 'Rejected' ? 'bg-red-50 text-red-700' :
                  'bg-gray-50 text-gray-700'
                ) : (
                  statusFilter === 'All' ? 'bg-[#003459]/5 text-[#003459]' :
                  statusFilter === 'Pending' ? 'bg-yellow-50 text-yellow-700' :
                  'bg-green-50 text-green-700'
                )
              }`}
            >
              {showArchive ? archiveStatusFilter : statusFilter} <Filter className="w-3 h-3" />
            </button>
            <button
              onClick={resetFilters}
              className="col-span-1 py-3 px-2 bg-[#003459]/5 hover:bg-red-50 hover:text-red-500 text-[#003459] flex items-center justify-center transition-colors border-l border-gray-100"
              title="Reset All Filters"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-50">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-10 text-gray-400 font-work text-sm">
                No {showArchive ? 'archived' : 'active'} profiles found
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user._id} className="grid grid-cols-12 gap-0 text-center text-sm items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-2 py-3 px-3 font-mono text-xs text-gray-500 truncate">{user.skIdNumber || '—'}</div>
                  <div className="col-span-2 py-3 px-3 font-semibold text-gray-800 font-work truncate">{user.lastName}</div>
                  <div className="col-span-2 py-3 px-3 text-gray-700 font-work truncate">{user.firstName}</div>
                  <div className="col-span-2 py-3 px-3 text-gray-500 font-work truncate">{user.middleName || '—'}</div>
                  <div className="col-span-2 py-3 px-3 text-xs text-gray-500 font-work truncate">
                    {user.purok}{user.street ? `, ${user.street}` : ''}
                  </div>
                  <div className={`col-span-1 py-3 px-2 font-bold text-xs font-fugaz ${
                    user.status === 'Approved' ? 'text-green-600' :
                    user.status === 'Rejected' ? 'text-red-600' :
                    user.status === 'Archived' ? 'text-orange-500' :
                    'text-yellow-600'
                  }`}>
                    {user.status}
                  </div>
                  <button
                    onClick={() => handleView(user)}
                    className="col-span-1 py-3 px-2 flex items-center justify-center text-[#003459] hover:text-white hover:bg-[#003459] transition-colors duration-200"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <UserViewModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => { setSelectedUser(null); setIsEditMode(false); }}
        isEditMode={isEditMode}
        onEdit={handleEdit}
        onSave={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      <ArchiveModal
        user={selectedArchivedUser}
        isOpen={!!selectedArchivedUser}
        onClose={() => setSelectedArchivedUser(null)}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
      />
    </div>
  );
};

export default AdminProfiles;