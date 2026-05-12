import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Heart, Search, User, Menu, X, LogOut, Bell } from 'lucide-react';
import api from '../api';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  useEffect(() => {
    if (user && (user.role === 'OWNER' || user.role === 'ADMIN')) {
      api.get('/notifications').then(res => setNotifications(res.data)).catch(() => {});
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    setMenuOpen(false);
  };

  const markAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (e) { console.error(e); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navLinks = [
    { to: '/', label: 'Browse', icon: <Home size={18} /> },
    { to: '/profile', label: 'Saved', icon: <Heart size={18} /> },
  ];

  return (
    <>
      {/* ===== DESKTOP + MOBILE TOP NAVBAR ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 brand-gradient rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-black">B</span>
            </div>
            <span className="text-xl font-black brand-text hidden sm:block">BkonnectHostels</span>
            <span className="text-xl font-black brand-text sm:hidden">BkH</span>
          </Link>

          {/* CENTER LINKS (Desktop only) */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all no-underline ${location.pathname === to ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                {icon} {label}
              </Link>
            ))}
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">
            {/* Add Contact Us to Desktop only */}
            <Link to="/contact" className="hidden md:block text-sm font-semibold text-gray-600 hover:text-gray-900 no-underline mr-2">Contact Us</Link>

            {user && (user.role === 'OWNER' || user.role === 'ADMIN') && (
              <div className="relative mt-1">
                <button onClick={() => { setShowNotifications(!showNotifications); if(unreadCount > 0) markAsRead(); }} className="text-gray-500 hover:text-purple-600 transition relative">
                  <Bell size={20} />
                  {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[9px] text-white font-bold flex items-center justify-center">{unreadCount}</span>}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-4 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                      <span className="font-bold text-sm text-gray-800">Notifications</span>
                      <span className="text-xs text-gray-500">{notifications.length} total</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-sm text-gray-400 text-center">No new notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className={`p-4 border-b border-gray-50 ${n.isRead ? 'opacity-60' : 'bg-purple-50/20'}`}>
                            <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{n.body}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-50 transition"
                >
                  <div className="avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
                  <span className="hidden sm:block text-sm font-semibold text-gray-700">{user.name}</span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl border border-gray-100 w-56 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="font-bold text-sm text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.role}</p>
                    </div>
                    {user.role === 'OWNER' && (
                      <Link to="/owner" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 no-underline">
                        <Menu size={15} /> Owner Dashboard
                      </Link>
                    )}
                    {user.role === 'ADMIN' && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 no-underline">
                        <Menu size={15} /> Admin Panel
                      </Link>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition">
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-outline text-sm py-2 px-4 no-underline">Login</Link>
                <Link to="/signup" className="btn-brand text-sm py-2 px-4 no-underline">Sign Up</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ===== MOBILE BOTTOM NAVBAR (Instagram style) ===== */}
      <div className="bottom-nav md:hidden">
        {navLinks.map(({ to, icon, label }) => (
          <Link key={to} to={to} className={`flex flex-col items-center gap-1 p-2 no-underline transition-all ${location.pathname === to ? 'text-purple-700' : 'text-gray-400'}`}>
            <span className={location.pathname === to ? 'text-purple-700' : 'text-gray-400'}>{icon}</span>
            <span className="text-xs font-semibold">{label}</span>
          </Link>
        ))}
        {user ? (
          <Link to={user.role === 'OWNER' ? '/owner' : '/profile'} className={`flex flex-col items-center gap-1 p-2 no-underline ${['/owner', '/profile'].includes(location.pathname) ? 'text-purple-700' : 'text-gray-400'}`}>
            <User size={18} />
            <span className="text-xs font-semibold">Account</span>
          </Link>
        ) : (
          <Link to="/login" className="flex flex-col items-center gap-1 p-2 no-underline text-gray-400">
            <User size={18} />
            <span className="text-xs font-semibold">Login</span>
          </Link>
        )}
      </div>
    </>
  );
};

export default Navbar;
