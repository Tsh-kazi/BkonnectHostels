import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Bookmark, Clock, MapPin } from 'lucide-react';
import api from '../api';
import HostelCard from '../components/HostelCard';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const { data, isLoading, error } = useQuery({
    queryKey: ['studentDashboard'],
    queryFn: async () => {
      const res = await api.get('/student/dashboard');
      return res.data;
    }
  });

  if (!user || user.role !== 'STUDENT') {
    return (
      <div className="page-content text-center py-20">
        <p className="text-red-500 mb-4">You must be logged in as a Student to view this page.</p>
        <button onClick={() => navigate('/login')} className="btn-brand">Go to Login</button>
      </div>
    );
  }

  if (isLoading) return <div className="page-content text-center py-20 text-gray-500">Loading your profile...</div>;
  if (error) return <div className="page-content text-center py-20 text-red-500">Error loading dashboard data.</div>;

  const { bookings, favourites } = data;

  const demoImages = [
    '/images/extra-demo-1.jpg',
    '/images/extra-demo-2.jpg',
    '/images/extra-demo-3.jpg',
    '/images/extra-demo-4.jpg',
    '/images/extra-demo-5.jpg',
    '/images/extra-demo-6.jpg',
    '/images/extra-demo-7.jpg',
    '/images/extra-demo-8.jpg',
    '/images/extra-demo-9.jpg',
    '/images/extra-demo-10.jpg'
  ];
  const getDemoImage = (id) => {
    if (!id) return demoImages[0];
    const index = String(id).charCodeAt(0) % demoImages.length;
    return demoImages[index];
  };

  return (
    <div className="page-content max-w-6xl mx-auto px-4">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 brand-gradient rounded-full flex items-center justify-center text-white text-2xl font-black shadow-lg">
          {user.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">Hi, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-gray-500 font-medium">{user.schoolOrUniversity || 'Student'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COL: BOOKINGS */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-purple-600" /> My Bookings
          </h2>
          
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <Home size={28} />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">No Active Bookings</h3>
              <p className="text-gray-500 text-sm mb-5">You haven't reserved any rooms yet. Start exploring hostels near your university!</p>
              <Link to="/" className="btn-brand">Browse Hostels</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
                <div key={booking.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-5">
                  <div className="sm:w-1/3">
                    <img 
                      src={(!booking.room.photos?.[0]?.url || booking.room.photos?.[0]?.url.includes('http')) ? getDemoImage(booking.hostel.id) : booking.room.photos[0].url} 
                      className="w-full h-32 object-cover rounded-xl" 
                      alt="Room" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = demoImages[0];
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-lg text-gray-900">{booking.hostel.name}</h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                        booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm flex items-center justify-between mb-3">
                      <span className="flex items-center gap-1"><MapPin size={14}/> {booking.hostel.area}</span>
                      <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                        {new Date(booking.createdAt).toLocaleDateString()} at {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                    
                    <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-400 font-semibold">Room:</span> <span className="font-bold">{booking.room.roomType}</span></div>
                      <div><span className="text-gray-400 font-semibold">Rent:</span> <span className="font-bold">UGX {booking.room.monthlyRent?.toLocaleString()}</span></div>
                      <div><span className="text-gray-400 font-semibold">Move in:</span> <span className="font-bold">{booking.startMonth}</span></div>
                      <div><span className="text-gray-400 font-semibold">Duration:</span> <span className="font-bold">{booking.durationMonths} Mo.</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COL: FAVOURITES */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Bookmark size={20} className="text-pink-500" /> Saved Hostels
          </h2>

          {favourites.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center shadow-sm">
              <p className="text-gray-500 text-sm">You haven't saved any hostels yet. Tap the heart icon on a hostel to save it for later.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {favourites.map(fav => (
                <div key={fav.id}>
                  <HostelCard hostel={fav.hostel} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
