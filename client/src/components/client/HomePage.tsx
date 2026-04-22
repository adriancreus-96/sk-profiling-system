import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Calendar, User, LogOut } from 'lucide-react';
import UserProfile from './UserProfile';
import EventsPage from './EventsPage';
import type { Announcement } from '../admin/CreateAnnouncement';

const API_URL = import.meta.env.VITE_API_URL || 'localhost:5173';

type TabType = 'home' | 'events' | 'profile';

// ── SIGLA SVG wordmark (unchanged) ──
const SiglaHeader = () => (
  <svg viewBox="0 0 620 130" xmlns="http://www.w3.org/2000/svg"
    style={{ overflow: 'visible', display: 'block', height: '28px', width: 'auto' }}>
    <defs>
      <linearGradient id="strokeGradHome" x1="45%" y1="100%" x2="55%" y2="0%">
        <stop offset="0%" stopColor="#0B5A73" stopOpacity="0.32" />
        <stop offset="25%" stopColor="#15AAD9" stopOpacity="0.32" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.32" />
      </linearGradient>
    </defs>
    <text x="50%" y="100" textAnchor="middle" fill="none"
      stroke="url(#strokeGradHome)" strokeWidth="30" strokeLinejoin="round"
      style={{ fontFamily: "'Fugaz One', Impact, sans-serif", fontSize: '200px', fontWeight: 900, letterSpacing: '-0.01em', filter: 'drop-shadow(0px 6px 0px rgba(0,0,0,0.3))' }}>
      SIGLA
    </text>
    <text x="50%" y="100" textAnchor="middle" fill="#00171F" stroke="#00171F" strokeWidth="2"
      style={{ fontFamily: "'Fugaz One', Impact, sans-serif", fontSize: '200px', fontWeight: 900, letterSpacing: '-0.02em' }}>
      SIGLA
    </text>
  </svg>
);

// ── Main Component ──
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
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #5CB0B3 37%, #007EA7 100%)' }}>
      <header className="sticky top-0 z-10 bg-white/15 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-screen-lg mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-end gap-3 text-[#00171F] mt-3">
            <SiglaHeader />
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] px-3 py-2 rounded-lg"
            style={{ background: 'rgba(0,52,89,0.35)' }}
            onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,23,31,0.5)')}
            onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,52,89,0.35)')}>
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-md border-t border-white/20 shadow-2xl">
        <div className="max-w-screen-lg mx-auto flex justify-around items-center py-2">
          <TabButton icon={<Home className="w-5 h-5" />}     label="Home"    active={activeTab === 'home'}    onClick={() => setActiveTab('home')} />
          <TabButton icon={<Calendar className="w-5 h-5" />} label="Events"  active={activeTab === 'events'}  onClick={() => setActiveTab('events')} />
          <TabButton icon={<User className="w-5 h-5" />}     label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </div>
      </nav>
    </div>
  );
};

const TabButton = ({ icon, label, active, onClick }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
}) => (
  <button onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 px-6 rounded-xl transition-all ${
      active ? 'bg-[#00171F]/20' : 'hover:bg-[#00171F]/10 text-[#00171F]/10'
    }`}>
    <span className="text-[#00171F]">{icon}</span>
    <span className="text-xs mt-1 font-fugaz tracking-[0.05em] text-[#00171F]">{label}</span>
  </button>
);

// ── Home Tab Content ──
const HomeContent = ({ user }: { user: any }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnn, setLoadingAnn] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoadingAnn(true);
      try {
        // Public endpoint — no auth required
        const res = await fetch(`${API_URL}/api/announcements/active`);
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      } finally {
        setLoadingAnn(false);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-5">

      {/* Welcome Banner */}
      <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
        <h2 className="text-xl font-bold text-white mb-1 font-fugaz">
          Welcome back, {user.firstName}!
        </h2>
        <p className="text-white/80 text-sm font-work">
          Stay updated with the latest SK events and programs in your community.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow">
          <p className="text-white/60 text-xs uppercase font-semibold tracking-wider mb-1 font-work">SK Points</p>
          <p className="text-3xl font-black text-white font-fugaz">{user.points || 0}</p>
        </div>
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow">
          <p className="text-white/60 text-xs uppercase font-semibold tracking-wider mb-1 font-work">Status</p>
          <p className={`text-sm font-bold font-fugaz ${user.status === 'Approved' ? 'text-green-300' : 'text-yellow-300'}`}>
            {user.status}
          </p>
        </div>
      </div>

      {/* Announcements — dynamic from API */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 font-fugaz">📢 Announcements</h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          {loadingAnn ? (
            <div className="text-center py-4 text-gray-400 text-sm font-work animate-pulse">
              Loading announcements…
            </div>
          ) : announcements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4 font-work">
              No announcements at the moment.
            </p>
          ) : (
            announcements.map(a => (
              <AnnouncementCard key={a._id}
                title={a.title} date={a.date}
                description={a.description} isPermanent={a.isPermanent} />
            ))
          )}
        </div>
      </div>

      {/* Programs (static) */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900 font-fugaz">🎯 Active Programs</h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-gray-400 text-center py-4 font-work">
              No active programs at the moment.
          </p>
        </div>
      </div>

    </div>
  );
};

const AnnouncementCard = ({ title, date, description, isPermanent }: {
  title: string; date: string; description: string; isPermanent?: boolean;
}) => (
  <div className="border-l-4 border-[#003459] bg-[#003459]/5 p-4 rounded-r-xl">
    <div className="flex justify-between items-start mb-1">
      <h4 className="font-bold text-gray-800 text-sm font-fugaz flex items-center gap-1.5">
        {isPermanent && <span title="Pinned announcement">📌</span>}
        {title}
      </h4>
      <span className="text-xs text-gray-400 whitespace-nowrap ml-2 font-work">{date}</span>
    </div>
    <p className="text-sm text-gray-600 font-work">{description}</p>
  </div>
);

/*const ProgramCard = ({ title, description, color }: { title: string; description: string; color: string }) => (
  <div className={`${color} border rounded-xl p-4`}>
    <h4 className="font-bold text-sm mb-0.5 font-fugaz">{title}</h4>
    <p className="text-xs opacity-80 font-work">{description}</p>
  </div>
);*/

export default HomePage;