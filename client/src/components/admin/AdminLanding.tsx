import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Calendar, FileText, LogOut } from 'lucide-react';

const AdminLanding = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const menuItems = [
    {
      title: 'View Profiles',
      description: 'Manage youth profiles and registrations',
      icon: Users,
      path: '/admin/profiles',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Create New Profile',
      description: 'Add a new youth member to the system',
      icon: UserPlus,
      path: '/admin/create-profile',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Post New Event',
      description: 'Create and publish community events',
      icon: Calendar,
      path: '/admin/post-event',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'View Events',
      description: 'Browse and manage all events',
      icon: FileText,
      path: '/admin/events',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hello, Admin!</h1>
            <p className="text-gray-600 mt-1">Welcome back to your dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-md"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Quick Actions</h2>
          <p className="text-gray-600">Select an option to get started</p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`${item.color} text-white rounded-xl p-8 shadow-lg transition-all transform hover:scale-105 hover:shadow-xl text-left`}
              >
                <div className="flex items-start gap-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-white text-opacity-90">{item.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Statistics Cards (Optional) */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-sm text-gray-600 mb-1">Total Profiles</div>
            <div className="text-3xl font-bold text-gray-900">---</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-sm text-gray-600 mb-1">Pending Approvals</div>
            <div className="text-3xl font-bold text-yellow-600">---</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="text-sm text-gray-600 mb-1">Upcoming Events</div>
            <div className="text-3xl font-bold text-purple-600">---</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLanding;