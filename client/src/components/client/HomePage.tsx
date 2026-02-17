import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Calendar, User, LogOut } from 'lucide-react';
import UserProfile from './UserProfile';
import EventsPage from './EventsPage';

type TabType = 'home' | 'events' | 'profile';

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  // ── Render content based on active tab ──
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeContent user={user} />;
      case 'events':
        return <EventsPage />;
      case 'profile':
        return <UserProfile />;
      default:
        return <HomeContent user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-screen-lg mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-blue-800">SK System</h1>
            <p className="text-xs text-gray-500">Welcome, {user.firstName}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-medium"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-y-auto pb-20">
        {renderContent()}
      </main>

      {/* ── Bottom Tab Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-screen-lg mx-auto flex justify-around items-center py-2">
          <TabButton
            icon={<Home className="w-6 h-6" />}
            label="Home"
            active={activeTab === 'home'}
            onClick={() => setActiveTab('home')}
          />
          <TabButton
            icon={<Calendar className="w-6 h-6" />}
            label="Events"
            active={activeTab === 'events'}
            onClick={() => setActiveTab('events')}
          />
          <TabButton
            icon={<User className="w-6 h-6" />}
            label="Profile"
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          />
        </div>
      </nav>
    </div>
  );
};

// ── Tab Button Component ──
const TabButton = ({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 px-6 rounded-lg transition-colors ${
      active
        ? 'text-blue-600'
        : 'text-gray-400 hover:text-gray-600'
    }`}
  >
    {icon}
    <span className={`text-xs mt-1 font-medium ${active ? 'text-blue-600' : 'text-gray-500'}`}>
      {label}
    </span>
  </button>
);

// ── Home Tab Content ──
const HomeContent = ({ user }: { user: any }) => (
  <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">
    {/* Welcome Banner */}
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-md">
      <h2 className="text-2xl font-bold mb-2">
        Welcome back, {user.firstName}! 👋
      </h2>
      <p className="text-blue-100 text-sm">
        Stay updated with the latest SK events and programs in your community.
      </p>
    </div>

    {/* Quick Stats */}
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <p className="text-gray-500 text-xs uppercase font-medium mb-1">SK Points</p>
        <p className="text-2xl font-bold text-blue-600">{user.points || 0}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <p className="text-gray-500 text-xs uppercase font-medium mb-1">Status</p>
        <p className={`text-sm font-bold ${
          user.status === 'Approved' ? 'text-green-600' : 'text-yellow-600'
        }`}>
          {user.status}
        </p>
      </div>
    </div>

    {/* Announcements Section */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">📢 Announcements</h3>
      <div className="space-y-3">
        <AnnouncementCard
          title="Community Clean-Up Drive"
          date="March 15, 2026"
          description="Join us this Saturday for our monthly barangay clean-up!"
        />
        <AnnouncementCard
          title="Youth Leadership Training"
          date="March 20, 2026"
          description="Free training session for all SK members. Register now!"
        />
      </div>
    </div>

    {/* Programs Section */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 Active Programs</h3>
      <div className="grid grid-cols-1 gap-3">
        <ProgramCard
          title="Sports Development"
          description="Basketball and volleyball leagues ongoing"
          color="bg-orange-50 border-orange-200 text-orange-800"
        />
        <ProgramCard
          title="Education Support"
          description="Scholarship programs and tutorial sessions"
          color="bg-blue-50 border-blue-200 text-blue-800"
        />
        <ProgramCard
          title="Skills Training"
          description="Free workshops on digital skills and entrepreneurship"
          color="bg-green-50 border-green-200 text-green-800"
        />
      </div>
    </div>
  </div>
);

// ── Announcement Card ──
const AnnouncementCard = ({ title, date, description }: {
  title: string;
  date: string;
  description: string;
}) => (
  <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
    <div className="flex justify-between items-start mb-1">
      <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
      <span className="text-xs text-gray-500">{date}</span>
    </div>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

// ── Program Card ──
const ProgramCard = ({ title, description, color }: {
  title: string;
  description: string;
  color: string;
}) => (
  <div className={`${color} border rounded-lg p-4`}>
    <h4 className="font-bold text-sm mb-1">{title}</h4>
    <p className="text-xs opacity-80">{description}</p>
  </div>
);

export default HomePage;