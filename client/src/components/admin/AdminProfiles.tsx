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

  const API_URL = import.meta.env.VITE_API_URL

  // FETCH DATA
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }

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
        if (error.response?.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
        }
        setLoading(false);
      }
    };
    fetchUsers();
  }, [navigate, location]);

  // FILTER LOGIC
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
      const fullPurokName = selectedPurok === 'P1' ? 'Purok 1' :
        selectedPurok === 'P2' ? 'Purok 2' :
        selectedPurok === 'P3' ? 'Purok 3' :
        selectedPurok === 'P4' ? 'Purok 4' :
        selectedPurok === 'P5' ? 'Purok 5' :
        selectedPurok === 'P6' ? 'Purok 6' :
        selectedPurok === 'P7' ? 'Purok 7' : selectedPurok;
      result = result.filter(user => user.purok === fullPurokName);
    }

    if (showArchive) {
      if (archiveStatusFilter !== 'All') {
        result = result.filter(user => user.status === archiveStatusFilter);
      }
    } else {
      if (statusFilter !== 'All') {
        result = result.filter(user => user.status === statusFilter);
      }
    }

    setFilteredUsers(result);
  }, [searchQuery, selectedPurok, statusFilter, archiveStatusFilter, allUsers, archivedUsers, showArchive]);

  // HANDLERS
  const handleView = (user: UserData) => {
    if (showArchive) {
      setSelectedArchivedUser(user);
    } else {
      setSelectedUser(user);
      setIsEditMode(false);
    }
  };

  const handleEdit = (_userId: string) => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveEdit = async (updatedUser: UserData, _originalUser: UserData, newProfilePicture?: File) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Not authenticated');
      return;
    }

    try {
      let response;

      if (newProfilePicture) {
        const formData = new FormData();

        const skipFields = ['_id', 'profilePicture', 'eventRegistrations', 'eventParticipations', 'qrCode', 'points', 'skIdNumber', 'status', 'passwordHash'];
        Object.entries(updatedUser).forEach(([key, value]) => {
          if (skipFields.includes(key)) return;
          if (value === undefined || value === null) return;
          if (Array.isArray(value)) return;
          if (typeof value === 'object' && !(value instanceof Date)) return;
          formData.append(key, String(value));
        });

        formData.append('profilePicture', newProfilePicture);

        response = await axios.put(
          `${API_URL}/api/admin/update-user/${updatedUser._id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } else {
        response = await axios.put(
          `${API_URL}/api/admin/update-user/${updatedUser._id}`,
          updatedUser,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      const savedUser = response.data;

      setAllUsers(prev => prev.map(u =>
        u._id === savedUser._id ? savedUser : u
      ));

      setSelectedUser(savedUser);

      setIsEditMode(false);
      alert('User updated successfully!');
    } catch (error: any) {
      console.error('Error updating user:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
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
      const response = await axios.put(
        `${API_URL}/api/admin/approve/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAllUsers(prev => prev.map(u =>
        u._id === userId ? {
          ...u,
          status: 'Approved' as const,
          skIdNumber: response.data.skIdNumber,
          qrCode: response.data.skIdNumber
        } : u
      ));

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
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      alert(`Failed to approve user: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleReject = async (userId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Not authenticated');
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/admin/reject/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const rejectedUser = { ...response.data, status: 'Rejected' };
      setAllUsers(prev => prev.filter(u => u._id !== userId));
      setArchivedUsers(prev => [...prev, rejectedUser]);
      setSelectedUser(null);

      alert('User rejected and moved to archive.');
    } catch (error: any) {
      console.error('Error rejecting user:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      alert(`Failed to reject user: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleRestore = async (userId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Not authenticated');
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/admin/restore/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const restoredUser = { ...response.data, status: 'Pending' };
      setArchivedUsers(prev => prev.filter(u => u._id !== userId));
      setAllUsers(prev => [...prev, restoredUser]);
      setSelectedArchivedUser(null);

      alert('User restored successfully!');
    } catch (error: any) {
      console.error('Error restoring user:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
      alert(`Failed to restore user: ${error.response?.data?.message || error.message}`);
    }
  };

  const handlePermanentDelete = async (userId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Not authenticated');
      return;
    }

    try {
      await axios.delete(
        `${API_URL}/api/admin/permanent-delete/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setArchivedUsers(prev => prev.filter(u => u._id !== userId));
      setSelectedArchivedUser(null);

      alert('User permanently deleted from the system.');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
        return;
      }
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

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedPurok('All');
    setStatusFilter('All');
    setArchiveStatusFilter('All');
  };

  const PUROK_TABS = ['All', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'];

  if (loading) return <div className="p-10 text-center">Loading Profiles...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      <h1 className="text-4xl font-extrabold text-black mb-4 text-center tracking-tight">
        Youth Profiles {showArchive && '- Archive'}
      </h1>

      {/* Profile Count Badge */}
      <div className="flex justify-center mb-6">
        <span className="px-4 py-1.5 bg-teal-100 text-teal-800 text-sm font-semibold rounded-full">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'Profile' : 'Profiles'} Found
          {selectedPurok !== 'All' && ` · ${selectedPurok}`}
          {!showArchive && statusFilter !== 'All' && ` · ${statusFilter}`}
          {showArchive && archiveStatusFilter !== 'All' && ` · ${archiveStatusFilter}`}
          {searchQuery && ` · "${searchQuery}"`}
        </span>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowArchive(!showArchive)}
          className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors shadow-md ${showArchive
            ? 'bg-gray-600 hover:bg-gray-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {showArchive ? 'View Active Profiles' : 'View Archive'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-end mb-4 gap-4">
        <div className="flex bg-gray-200 p-1 rounded-lg overflow-x-auto">
          {PUROK_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedPurok(tab)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${selectedPurok === tab
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

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

      <div className="bg-transparent overflow-hidden">
        <div className="grid grid-cols-12 gap-2 mb-2 text-center font-bold text-xs uppercase tracking-wide text-gray-600">
          <div className="col-span-2 bg-teal-100 p-3 rounded-lg flex items-center justify-center">ID No.</div>
          <div className="col-span-2 bg-teal-100 p-3 rounded-lg flex items-center justify-center">Surname</div>
          <div className="col-span-2 bg-teal-100 p-3 rounded-lg flex items-center justify-center">First Name</div>
          <div className="col-span-2 bg-teal-100 p-3 rounded-lg flex items-center justify-center">Middle Name</div>
          <div className="col-span-2 bg-teal-100 p-3 rounded-lg flex items-center justify-center">Address</div>

          <button
            onClick={showArchive ? cycleArchiveStatusFilter : cycleStatusFilter}
            className={`col-span-1 p-3 rounded-lg flex items-center justify-center gap-1 transition-colors ${
              showArchive ? (
                archiveStatusFilter === 'All' ? 'bg-teal-100 hover:bg-teal-200' :
                archiveStatusFilter === 'Rejected' ? 'bg-red-100 hover:bg-red-200 text-red-800' :
                'bg-gray-100 hover:bg-gray-200 text-gray-800'
              ) : (
                statusFilter === 'All' ? 'bg-teal-100 hover:bg-teal-200' :
                statusFilter === 'Pending' ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' :
                'bg-green-100 hover:bg-green-200 text-green-800'
              )
            }`}
          >
            {showArchive ? archiveStatusFilter : statusFilter} <Filter className="w-3 h-3" />
          </button>

          <button
            onClick={resetFilters}
            className="col-span-1 bg-teal-100 hover:bg-red-100 hover:text-red-600 p-3 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            title="Click to Reset All Filters"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-gray-100 rounded-lg">
              No {showArchive ? 'archived' : 'active'} profiles found
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user._id} className="grid grid-cols-12 gap-2 text-center text-sm items-center">
                <div className="col-span-2 bg-gray-100 p-3 rounded-lg font-mono text-xs truncate">
                  {user.skIdNumber || '---'}
                </div>
                <div className="col-span-2 bg-gray-100 p-3 rounded-lg font-semibold truncate">{user.lastName}</div>
                <div className="col-span-2 bg-gray-100 p-3 rounded-lg truncate">{user.firstName}</div>
                <div className="col-span-2 bg-gray-100 p-3 rounded-lg truncate">{user.middleName || '-'}</div>
                <div className="col-span-2 bg-gray-100 p-3 rounded-lg text-xs truncate">
                  {user.purok} {user.street ? `, ${user.street}` : ''}
                </div>

                <div className={`col-span-1 p-3 rounded-lg font-bold text-xs ${
                  user.status === 'Approved' ? 'bg-gray-100 text-green-600' :
                  user.status === 'Rejected' ? 'bg-gray-100 text-red-600' :
                  user.status === 'Archived' ? 'bg-gray-100 text-orange-600' :
                  'bg-gray-100 text-yellow-600'
                }`}>
                  {user.status}
                </div>

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