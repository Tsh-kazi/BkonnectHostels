import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Bookmark, Clock, MapPin, Upload } from 'lucide-react';
import api from '../api';
import HostelCard from '../components/HostelCard';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  const [activeTransactionId, setActiveTransactionId] = React.useState(null);
  const [receiptInput, setReceiptInput] = React.useState('');

  const submitReceiptMutation = useMutation({
    mutationFn: async ({ id, receiptType, receiptUrl }) => {
      return await api.post(`/student/transactions/${id}/receipt`, { receiptType, receiptUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['studentDashboard']);
      setActiveTransactionId(null);
      setReceiptInput('');
      alert("Payment proof submitted successfully!");
    },
    onError: (err) => {
      alert(err.response?.data?.error || "Failed to submit payment proof");
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async (id) => await api.put(`/bookings/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries(['studentDashboard']);
      alert("Hostel removed from active bookings and moved to history.");
    },
    onError: (err) => {
      alert(err.response?.data?.error || "Failed to archive booking");
    }
  });

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
  
  const activeBookings = bookings.filter(b => b.status !== 'COMPLETED');
  const historyBookings = bookings.filter(b => b.status === 'COMPLETED');

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
          
          {activeBookings.length === 0 ? (
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
              {activeBookings.map(booking => (
                <div key={booking.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-5 relative">
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
                    
                    {/* ACTION BUTTONS */}
                    {booking.status === 'CONFIRMED' && (
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                        <button 
                          onClick={() => {
                            if(window.confirm("Are you sure you want to remove this hostel? It will be moved to your history and the room will become available again.")) {
                              archiveMutation.mutate(booking.id);
                            }
                          }}
                          disabled={archiveMutation.isPending}
                          className="text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition"
                        >
                          Leave Hostel & Move to History
                        </button>
                      </div>
                    )}

                    {booking.status === 'PENDING' && booking.transaction && booking.transaction.status === 'PENDING' && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        {activeTransactionId === booking.transaction.id ? (
                          <div className="space-y-3 fade-in">
                            <label className="block text-xs font-bold text-gray-500">Enter Payment Reference Number / Phone Number</label>
                            <input 
                              type="text" 
                              className="input-field py-2 text-sm" 
                              placeholder="e.g. 077... or TxID" 
                              value={receiptInput} 
                              onChange={e => setReceiptInput(e.target.value)} 
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => submitReceiptMutation.mutate({ id: booking.transaction.id, receiptType: receiptInput, receiptUrl: '' })}
                                disabled={submitReceiptMutation.isPending || !receiptInput}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl text-sm disabled:opacity-50 transition"
                              >
                                Submit Proof
                              </button>
                              <button onClick={() => setActiveTransactionId(null)} className="px-4 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-200 transition">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setActiveTransactionId(booking.transaction.id)} className="w-full bg-purple-50 text-purple-700 font-bold py-2 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-purple-100 transition">
                            <Upload size={16} /> Submit Payment Proof
                          </button>
                        )}
                      </div>
                    )}
                    {booking.transaction && booking.transaction.status === 'AWAITING_VERIFICATION' && (
                      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                        <span className="text-amber-600 text-sm font-bold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">Payment Under Review</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* HISTORY SECTION */}
          {historyBookings.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2 opacity-70">
                <Clock size={20} /> Past Bookings History
              </h2>
              <div className="space-y-4 opacity-70 hover:opacity-100 transition-opacity">
                {historyBookings.map(booking => (
                  <div key={booking.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
                    <img 
                      src={(!booking.room.photos?.[0]?.url || booking.room.photos?.[0]?.url.includes('http')) ? getDemoImage(booking.hostel.id) : booking.room.photos[0].url} 
                      className="w-20 h-20 object-cover rounded-xl grayscale" 
                      alt="Room" 
                      onError={(e) => { e.target.onerror = null; e.target.src = demoImages[0]; }}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">{booking.hostel.name}</h3>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-200 text-gray-600">COMPLETED</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Stayed {booking.startMonth} ({booking.durationMonths} Months)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COL: INBOX & FAVOURITES */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* NOTIFICATIONS / INBOX */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm">🔔</span> 
              Owner Feedback
            </h2>
            {(!data.notifications || data.notifications.length === 0) ? (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 text-center shadow-sm">
                <p className="text-gray-500 text-sm">No new messages from owners.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.notifications.map(notif => (
                  <div key={notif.id} className="bg-white rounded-2xl p-4 border border-purple-50 shadow-sm relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{notif.title}</h4>
                    <p className="text-gray-600 text-xs leading-relaxed">{notif.body}</p>
                    <div className="text-[10px] font-bold text-gray-400 mt-2 uppercase">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FAVOURITES */}
          <div>
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
    </div>
  );
};

export default StudentDashboard;
