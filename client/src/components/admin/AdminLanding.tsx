import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Calendar, FileText, LogOut } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// ── SIGLA SVG wordmark ──
const SiglaWordmark = () => (
  <svg
    viewBox="0 0 620 130"
    xmlns="http://www.w3.org/2000/svg"
    style={{ overflow: 'visible', display: 'block', width: '100%' }}
  >
    <defs>
      <linearGradient id="strokeGradAdmin" x1="45%" y1="100%" x2="55%" y2="0%">
        <stop offset="0%" stopColor="#0B5A73" stopOpacity="0.32" />
        <stop offset="25%" stopColor="#15AAD9" stopOpacity="0.32" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.32" />
      </linearGradient>
    </defs>
    <text
      x="50%" y="100"
      textAnchor="middle"
      fill="none"
      stroke="url(#strokeGradAdmin)"
      strokeWidth="30"
      strokeLinejoin="round"
      style={{
        fontFamily: "'Fugaz One', Impact, sans-serif",
        fontSize: '200px',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '-0.01em',
        filter: 'drop-shadow(0px 6px 0px rgba(0,0,0,0.3))',
      }}
    >
      SIGLA
    </text>
    <text
      x="50%" y="100"
      textAnchor="middle"
      fill="#00171F"
      stroke="#00171F"
      strokeWidth="2"
      style={{
        fontFamily: "'Fugaz One', Impact, sans-serif",
        fontSize: '200px',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '-0.02em',
      }}
    >
      SIGLA
    </text>
  </svg>
);

const AdminLanding = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    upcomingEvents: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      try {
        const [usersRes, eventsRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/api/admin/events`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: [] }))
        ]);

        const activeUsers = usersRes.data.filter(
          (u: any) => u.status !== 'Rejected' && u.status !== 'Archived'
        );
        const pendingCount = activeUsers.filter((u: any) => u.status === 'Pending').length;
        const now = new Date();
        const upcomingCount = eventsRes.data.filter(
          (e: any) => new Date(e.date) >= now
        ).length;

        setStats({ total: activeUsers.length, pending: pendingCount, upcomingEvents: upcomingCount });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

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
    },
    {
      title: 'Create New Announcement',
      description: 'Make important announcements for the community',
      icon: UserPlus,
      path: '/admin/create-profile',
    },
    {
      title: 'Post New Event',
      description: 'Create and publish community events',
      icon: Calendar,
      path: '/admin/post-event',
    },
    {
      title: 'View Events',
      description: 'Browse and manage all events',
      icon: FileText,
      path: '/admin/events',
    },
  ];

  const statCards = [
    { label: 'Total Active Profiles', value: stats.total,          accent: 'text-white' },
    { label: 'Pending Approvals',     value: stats.pending,        accent: 'text-yellow-300' },
    { label: 'Upcoming Events',       value: stats.upcomingEvents, accent: 'text-white' },
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #6EB8BB 0%, #5CB0B3 37%, #007EA7 100%)' }}
    >
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-white/15 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex justify-between items-center">
          {/* Compact wordmark */}
          <div className="flex items-end gap-3">
            <div style={{ width: '90px' }}>
              <SiglaWordmark />
            </div>
            <p className="text-white/70 text-xs italic font-work pb-0.5">
              Admin Dashboard
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-white transition duration-200 font-fugaz tracking-[0.05em] px-3 py-2 rounded-lg"
            style={{ background: 'rgba(0,52,89,0.35)' }}
            onMouseOver={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,23,31,0.5)')}
            onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,52,89,0.35)')}
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-8 py-10 space-y-10">

        {/* Welcome */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
          <h1 className="text-2xl font-bold text-white font-fugaz">Hello, Admin!</h1>
          <p className="text-white/70 text-sm mt-1 font-work">Welcome back to your SIGLA dashboard.</p>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold text-white font-fugaz mb-1">Quick Actions</h2>
          <p className="text-white/60 text-xs font-work mb-5">Select an option to get started</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="bg-white rounded-2xl shadow-xl p-6 text-left flex items-start gap-4 transition-all duration-200 hover:shadow-2xl hover:-translate-y-0.5 group"
                >
                  <div
                    className="p-3 rounded-xl flex-shrink-0 transition-colors duration-200"
                    style={{ background: '#003459' }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 font-fugaz group-hover:text-[#003459] transition-colors duration-200">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5 font-work">{item.description}</p>
                  </div>
                  <span className="text-gray-300 group-hover:text-[#003459] transition-colors duration-200 mt-1 text-lg">›</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Statistics */}
        <div>
          <h2 className="text-lg font-bold text-white font-fugaz mb-1">Overview</h2>
          <p className="text-white/60 text-xs font-work mb-5">Current system statistics</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20 shadow"
              >
                <p className="text-white/60 text-xs uppercase font-semibold tracking-wider font-work mb-2">
                  {card.label}
                </p>
                {statsLoading ? (
                  <div className="text-3xl font-black text-white/20 font-fugaz animate-pulse">···</div>
                ) : (
                  <div className={`text-3xl font-black font-fugaz ${card.accent}`}>{card.value}</div>
                )}
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-6">
        <p className="text-white/40 text-xs italic font-fugaz">
          Sangguniang Kabataan · Calumpang Cerca, Indang, Cavite
        </p>
      </footer>
    </div>
  );
};

export default AdminLanding;