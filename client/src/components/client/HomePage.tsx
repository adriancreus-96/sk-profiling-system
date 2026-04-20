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
    if (!storedUser) { navigate('/login'); return; }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  const renderContent = () => {
    switch (activeTab) {
      case 'home':    return <HomeContent user={user} />;
      case 'events':  return <EventsPage />;
      case 'profile': return <UserProfile />;
      default:        return <HomeContent user={user} />;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #0a2a3a 0%, #0d4a5c 40%, #1a7a8a 100%)' }}
    >
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-white/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-screen-lg mx-auto px-4 py-3 flex justify-between items-center">
          <div>
            <h1
              className="text-2xl font-black text-white leading-none tracking-tight"
              style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}
            >
              SIGLA
            </h1>
            <p className="text-cyan-300 text-xs tracking-widest uppercase">Welcome, {user.firstName}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white font-medium transition bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-y-auto pb-24">
        {renderContent()}
      </main>

      {/* ── Bottom Tab Navigation ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/10 shadow-2xl">
        <div className="max-w-screen-lg mx-auto flex justify-around items-center py-2">
          <TabButton icon={<Home className="w-5 h-5" />}     label="Home"    active={activeTab === 'home'}    onClick={() => setActiveTab('home')} />
          <TabButton icon={<Calendar className="w-5 h-5" />} label="Events"  active={activeTab === 'events'}  onClick={() => setActiveTab('events')} />
          <TabButton icon={<User className="w-5 h-5" />}     label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </div>
      </nav>
    </div>
  );
};

// ── Tab Button ──
const TabButton = ({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 px-6 rounded-xl transition-all ${
      active ? 'text-cyan-300 bg-white/10' : 'text-white/40 hover:text-white/70'
    }`}
  >
    {icon}
    <span className={`text-xs mt-1 font-semibold ${active ? 'text-cyan-300' : 'text-white/40'}`}>{label}</span>
  </button>
);

// ── Home Tab Content ──
const HomeContent = ({ user }: { user: any }) => (
  <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-5">
    {/* Welcome Banner */}
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 shadow-lg">
      <h2 className="text-xl font-bold text-white mb-1">
        Welcome back, {user.firstName}! 👋
      </h2>
      <p className="text-cyan-200 text-sm">
        Stay updated with the latest SK events and programs in your community.
      </p>
    </div>

    {/* Quick Stats */}
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 shadow">
        <p className="text-cyan-300 text-xs uppercase font-semibold tracking-wider mb-1">SK Points</p>
        <p className="text-3xl font-black text-white">{user.points || 0}</p>
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 shadow">
        <p className="text-cyan-300 text-xs uppercase font-semibold tracking-wider mb-1">Status</p>
        <p className={`text-sm font-bold ${user.status === 'Approved' ? 'text-green-400' : 'text-yellow-400'}`}>
          {user.status}
        </p>
      </div>
    </div>

    {/* Announcements */}
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-base font-bold text-gray-800">📢 Announcements</h3>
      </div>
      <div className="px-5 pb-5 space-y-3">
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

    {/* Programs */}
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-base font-bold text-gray-800">🎯 Active Programs</h3>
      </div>
      <div className="px-5 pb-5 space-y-3">
        <ProgramCard title="Sports Development"  description="Basketball and volleyball leagues ongoing"              color="bg-orange-50 border-orange-200 text-orange-800" />
        <ProgramCard title="Education Support"   description="Scholarship programs and tutorial sessions"             color="bg-cyan-50 border-cyan-200 text-cyan-800" />
        <ProgramCard title="Skills Training"     description="Free workshops on digital skills and entrepreneurship"  color="bg-teal-50 border-teal-200 text-teal-800" />
      </div>
    </div>
  </div>
);

// ── Announcement Card ──
const AnnouncementCard = ({ title, date, description }: { title: string; date: string; description: string }) => (
  <div className="border-l-4 border-cyan-500 bg-cyan-50 p-4 rounded-r-xl">
    <div className="flex justify-between items-start mb-1">
      <h4 className="font-bold text-gray-800 text-sm">{title}</h4>
      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{date}</span>
    </div>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);

// ── Program Card ──
const ProgramCard = ({ title, description, color }: { title: string; description: string; color: string }) => (
  <div className={`${color} border rounded-xl p-4`}>
    <h4 className="font-bold text-sm mb-0.5">{title}</h4>
    <p className="text-xs opacity-80">{description}</p>
  </div>
);

export default HomePage;