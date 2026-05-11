import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Users, Store, MessageSquare, CheckCircle, GraduationCap, Map, Clock, Activity, Trash2, Building2, Bell } from 'lucide-react';
import api from '../api';

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('approvals');
  const [newUni, setNewUni] = useState({ name: '', city: '', country: 'Uganda' });

  // Fetch Summary (Approvals)
  const { data: summary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => (await api.get('/admin/dashboard')).data
  });

  // Fetch Universities
  const { data: universities } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => (await api.get('/admin/universities')).data,
    enabled: activeTab === 'universities'
  });

  // Fetch Global Bookings
  const { data: globalBookings } = useQuery({
    queryKey: ['globalBookings'],
    queryFn: async () => (await api.get('/admin/bookings')).data,
    enabled: activeTab === 'bookings'
  });

  // Fetch All Users
  const { data: allUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => (await api.get('/admin/users')).data,
    enabled: activeTab === 'users'
  });

  // Fetch All Hostels
  const { data: allHostels } = useQuery({
    queryKey: ['adminHostels'],
    queryFn: async () => (await api.get('/admin/hostels')).data,
    enabled: activeTab === 'hostels'
  });

  // Fetch Activity Feed
  const { data: activityData } = useQuery({
    queryKey: ['adminActivity'],
    queryFn: async () => (await api.get('/admin/activity')).data,
    enabled: activeTab === 'activity'
  });

  const approveMutation = useMutation({
    mutationFn: async ({ type, id }) => await api.patch(`/admin/approve/${type}/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['adminDashboard'])
  });

  const addUniMutation = useMutation({
    mutationFn: async (data) => await api.post('/admin/universities', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['universities']);
      setNewUni({ name: '', city: '', country: 'Uganda' });
      alert("University added!");
    },
    onError: (err) => alert(err.response?.data?.error || "Error adding university")
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['adminUsers'])
  });

  const deleteHostelMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/admin/hostels/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['adminHostels'])
  });

  if (isLoadingSummary) return <div className="page-content text-center py-20">Loading admin panel...</div>;

  return (
    <div className="page-content bg-gray-50 min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4">
        
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck size={32} className="text-purple-600" />
          <h1 className="text-3xl font-black text-gray-900">Admin Control Panel</h1>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 pb-2 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveTab('approvals')} className={`font-bold pb-2 border-b-2 whitespace-nowrap transition ${activeTab === 'approvals' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Approvals</button>
          <button onClick={() => setActiveTab('users')} className={`font-bold pb-2 border-b-2 whitespace-nowrap transition ${activeTab === 'users' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Users</button>
          <button onClick={() => setActiveTab('hostels')} className={`font-bold pb-2 border-b-2 whitespace-nowrap transition ${activeTab === 'hostels' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Hostels Directory</button>
          <button onClick={() => setActiveTab('bookings')} className={`font-bold pb-2 border-b-2 whitespace-nowrap transition ${activeTab === 'bookings' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Bookings Ledger</button>
          <button onClick={() => setActiveTab('universities')} className={`font-bold pb-2 border-b-2 whitespace-nowrap transition ${activeTab === 'universities' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Universities</button>
          <button onClick={() => setActiveTab('activity')} className={`font-bold pb-2 border-b-2 whitespace-nowrap transition ${activeTab === 'activity' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>Activity Feed</button>
        </div>

        {/* TAB: APPROVALS */}
        {activeTab === 'approvals' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in">
            {/* PENDING OWNERS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Users size={18} className="text-indigo-500"/> Pending Owners ({summary.pendingOwners.length})</h2>
              {summary.pendingOwners.length === 0 ? <p className="text-sm text-gray-400">No pending owners.</p> : (
                <div className="space-y-3">
                  {summary.pendingOwners.map(owner => (
                    <div key={owner.id} className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                      <div><p className="font-bold text-sm">{owner.name}</p><p className="text-xs text-gray-500">{owner.phone}</p></div>
                      <button onClick={() => approveMutation.mutate({ type: 'owner', id: owner.id })} className="bg-emerald-100 text-emerald-700 p-2 rounded-lg hover:bg-emerald-200"><CheckCircle size={18} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PENDING HOSTELS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Store size={18} className="text-amber-500"/> Pending Hostels ({summary.pendingHostels.length})</h2>
              {summary.pendingHostels.length === 0 ? <p className="text-sm text-gray-400">No pending hostels.</p> : (
                <div className="space-y-3">
                  {summary.pendingHostels.map(hostel => (
                    <div key={hostel.id} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-2">
                      <div><p className="font-bold text-sm">{hostel.name}</p><p className="text-xs text-gray-500">By {hostel.owner.name}</p></div>
                      <button onClick={() => approveMutation.mutate({ type: 'hostel', id: hostel.id })} className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold w-full">Approve Listing</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PENDING REVIEWS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><MessageSquare size={18} className="text-pink-500"/> Pending Reviews ({summary.pendingReviews.length})</h2>
              {summary.pendingReviews.length === 0 ? <p className="text-sm text-gray-400">No pending reviews.</p> : (
                <div className="space-y-3">
                  {summary.pendingReviews.map(review => (
                    <div key={review.id} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex justify-between items-start mb-1"><p className="font-bold text-xs">{review.hostel.name}</p><span className="text-xs bg-amber-100 text-amber-700 px-1.5 rounded">{review.rating} ⭐</span></div>
                      <p className="text-xs text-gray-600 mb-2">"{review.comment}"</p>
                      <button onClick={() => approveMutation.mutate({ type: 'review', id: review.id })} className="w-full bg-emerald-100 text-emerald-700 py-1 rounded text-xs font-bold">Approve</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: UNIVERSITIES */}
        {activeTab === 'universities' && (
          <div className="fade-in grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:col-span-1 h-fit">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add University</h2>
              <form onSubmit={(e) => { e.preventDefault(); addUniMutation.mutate(newUni); }} className="space-y-3">
                <input required type="text" placeholder="University Name" className="input-field" value={newUni.name} onChange={e => setNewUni({...newUni, name: e.target.value})} />
                <input required type="text" placeholder="City" className="input-field" value={newUni.city} onChange={e => setNewUni({...newUni, city: e.target.value})} />
                <button type="submit" disabled={addUniMutation.isPending} className="btn-brand w-full">Add to Database</button>
              </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:col-span-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Registered Universities</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {universities?.map(uni => (
                  <div key={uni.id} className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center"><GraduationCap size={20} /></div>
                    <div>
                      <p className="font-bold text-gray-900">{uni.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1"><Map size={12}/> {uni.city}, {uni.country}</p>
                    </div>
                  </div>
                ))}
                {universities?.length === 0 && <p className="text-gray-500">No universities added yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* TAB: GLOBAL BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="fade-in bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Clock size={24} className="text-purple-600"/> Master Bookings Ledger</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                    <th className="p-4 font-semibold rounded-tl-xl">Date</th>
                    <th className="p-4 font-semibold">Student</th>
                    <th className="p-4 font-semibold">Hostel & Room</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {globalBookings?.map(b => (
                    <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50 transition text-sm">
                      <td className="p-4 text-gray-500 text-xs">
                        <span className="font-bold text-gray-800">{new Date(b.createdAt).toLocaleDateString()}</span>
                        <br/>
                        <span>{new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="p-4 font-bold text-gray-900">{b.student.name} <br/><span className="text-xs font-normal text-gray-500">{b.student.phone}</span></td>
                      <td className="p-4 text-gray-700 font-semibold">{b.hostel.name} <br/><span className="text-xs font-normal text-gray-500">{b.room.roomType} (UGX {b.room.monthlyRent})</span></td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : b.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {globalBookings?.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-500">No bookings on the platform yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="fade-in bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Users size={24} className="text-purple-600"/> User Registry</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                    <th className="p-4 font-semibold rounded-tl-xl">Name & Role</th>
                    <th className="p-4 font-semibold">Contact</th>
                    <th className="p-4 font-semibold">Joined</th>
                    <th className="p-4 font-semibold rounded-tr-xl text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers?.map(u => (
                    <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition text-sm">
                      <td className="p-4">
                        <p className="font-bold text-gray-900">{u.name}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'OWNER' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>{u.role}</span>
                      </td>
                      <td className="p-4 text-gray-600">{u.email} <br/><span className="text-xs">{u.phone}</span></td>
                      <td className="p-4 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => { if(window.confirm('Delete this user?')) deleteUserMutation.mutate(u.id); }} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg transition" title="Ban User">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {allUsers?.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-gray-500">No users found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: HOSTELS DIRECTORY */}
        {activeTab === 'hostels' && (
          <div className="fade-in bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Building2 size={24} className="text-purple-600"/> Master Hostels Directory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allHostels?.map(h => (
                <div key={h.id} className="border border-gray-200 rounded-2xl p-5 shadow-sm relative">
                  {!h.isApproved && <div className="absolute top-3 right-3 bg-red-100 text-red-700 text-[10px] px-2 py-1 rounded font-bold">UNPUBLISHED</div>}
                  <h3 className="font-bold text-lg text-gray-900">{h.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{h.university}</p>
                  
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm space-y-1">
                    <p className="flex justify-between"><span className="text-gray-500">Owner:</span> <span className="font-bold">{h.owner.name}</span></p>
                    <p className="flex justify-between"><span className="text-gray-500">Rooms:</span> <span className="font-bold">{h._count.rooms}</span></p>
                  </div>
                  
                  <button onClick={() => { if(window.confirm(`Delete ${h.name} forever?`)) deleteHostelMutation.mutate(h.id); }} className="w-full text-red-600 bg-red-50 hover:bg-red-100 py-2 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
                    <Trash2 size={16} /> Delete Hostel
                  </button>
                </div>
              ))}
              {allHostels?.length === 0 && <p className="text-gray-500 col-span-3 text-center py-10">No hostels in the database.</p>}
            </div>
          </div>
        )}

        {/* TAB: ACTIVITY FEED */}
        {activeTab === 'activity' && (
          <div className="fade-in bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><Activity size={24} className="text-purple-600"/> Platform Activity Feed</h2>
            <div className="space-y-6">
              {activityData?.notifications?.length === 0 && activityData?.recentBookings?.length === 0 && (
                <p className="text-gray-500 text-center py-10">No recent activity.</p>
              )}
              
              <div className="relative border-l-2 border-purple-100 ml-3 space-y-8 pb-4">
                
                {/* Render Bookings */}
                {activityData?.recentBookings?.map(b => (
                  <div key={`book-${b.id}`} className="relative pl-6">
                    <div className="absolute -left-[11px] top-1 w-5 h-5 bg-emerald-100 border-2 border-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{new Date(b.createdAt).toLocaleString()}</p>
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                      <p className="text-gray-800"><span className="font-bold">{b.student.name}</span> requested to book a room at <span className="font-bold">{b.hostel.name}</span>.</p>
                      <p className="text-xs text-gray-500 mt-2">Status: <span className="font-bold">{b.status}</span></p>
                    </div>
                  </div>
                ))}

                {/* Render Notifications (Favorites, Reviews, etc) */}
                {activityData?.notifications?.map(n => (
                  <div key={`notif-${n.id}`} className="relative pl-6">
                    <div className="absolute -left-[11px] top-1 w-5 h-5 bg-blue-100 border-2 border-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{new Date(n.createdAt).toLocaleString()}</p>
                    <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                      <p className="font-bold text-gray-900 text-sm mb-1"><Bell size={14} className="inline mr-1 text-gray-400"/> {n.title}</p>
                      <p className="text-gray-600 text-sm">{n.body}</p>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
