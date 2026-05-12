import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { useNavigate } from 'react-router-dom';
import { Home, List, CheckCircle, XCircle, Plus, Camera, MapPin, ArrowLeft, Settings, Info, Building } from 'lucide-react';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('hostels');
  const [selectedHostelId, setSelectedHostelId] = useState(null);

  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  // Form States
  const [showAddHostel, setShowAddHostel] = useState(false);
  const [activeHostelIdForRoom, setActiveHostelIdForRoom] = useState(null);
  const [editingHostelId, setEditingHostelId] = useState(null);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editRoomData, setEditRoomData] = useState({});
  const [editHostelData, setEditHostelData] = useState({});
  
  const [newHostel, setNewHostel] = useState({ name: '', streetAddress: '', area: '', category: 'UNIVERSITY_HOSTEL', contactPhone: user?.phone || '', description: '' });
  const [newRoom, setNewRoom] = useState({ roomType: 'Single', beds: 1, monthlyRent: '', amenities: '', photoUrl: '' });
  const { data, isLoading, error } = useQuery({
    queryKey: ['ownerDashboard'],
    queryFn: async () => {
      const res = await api.get('/owner/dashboard');
      return res.data;
    }
  });

  const confirmBookingMutation = useMutation({
    mutationFn: async ({ id, action }) => await api.patch(`/bookings/${id}`, { action }),
    onSuccess: () => queryClient.invalidateQueries(['ownerDashboard'])
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ id, action, rejectionReason }) => await api.patch(`/owner/transactions/${id}/verify`, { action, rejectionReason }),
    onSuccess: () => queryClient.invalidateQueries(['ownerDashboard'])
  });

  const createHostelMutation = useMutation({
    mutationFn: async (hostelData) => await api.post('/hostels', hostelData),
    onSuccess: () => {
      queryClient.invalidateQueries(['ownerDashboard']);
      setShowAddHostel(false);
    }
  });

  const addRoomMutation = useMutation({
    mutationFn: async ({ hostelId, roomData }) => {
      const payload = {
        ...roomData,
        photos: roomData.photoUrl ? [roomData.photoUrl] : []
      };
      return await api.post(`/hostels/${hostelId}/rooms`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ownerDashboard']);
      setActiveHostelIdForRoom(null);
      setNewRoom({ roomType: 'Single', beds: 1, monthlyRent: '', amenities: '', photoUrl: '' });
      alert("Room added successfully!");
    },
    onError: (err) => {
      alert(err.response?.data?.error || "Failed to add room");
    }
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ roomId, roomData }) => {
      return await api.put(`/owner/rooms/${roomId}`, roomData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ownerDashboard']);
      setEditingRoomId(null);
      alert("Room updated successfully!");
    },
    onError: (err) => {
      alert(err.response?.data?.error || "Failed to update room");
    }
  });

  const updateHostelMutation = useMutation({
    mutationFn: async ({ hostelId, hostelData }) => {
      return await api.put(`/owner/hostels/${hostelId}`, hostelData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ownerDashboard']);
      setEditingHostelId(null);
      alert("Hostel updated successfully!");
    },
    onError: (err) => {
      alert(err.response?.data?.error || "Failed to update hostel");
    }
  });

  if (isLoading) return <div className="page-content text-center py-20 text-gray-500">Loading Dashboard...</div>;
  if (error) return <div className="page-content text-center py-20 text-red-500">Error loading dashboard. Please log in as Owner.</div>;

  const selectedHostel = data?.hostels?.find(h => h.id === selectedHostelId);

  return (
    <div className="page-content bg-gray-50 pb-20 min-h-screen">
      
      {/* HEADER SECTION */}
      <div className="bg-white border-b border-gray-200 py-8 mb-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-2 tracking-tight">Owner Dashboard</h1>
          <p className="text-gray-500 font-medium">Manage your properties, rooms, and incoming reservations with ease.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
          <div className="bg-white p-6 rounded-3xl shadow-lg shadow-purple-900/5 border border-purple-50 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4"><Building size={24}/></div>
            <p className="text-gray-500 text-sm font-bold mb-1 uppercase tracking-wider">Total Hostels</p>
            <p className="text-4xl font-black text-gray-900">{data.totalHostels}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-lg shadow-indigo-900/5 border border-indigo-50 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4"><Home size={24}/></div>
            <p className="text-gray-500 text-sm font-bold mb-1 uppercase tracking-wider">Total Rooms</p>
            <p className="text-4xl font-black text-gray-900">{data.totalRooms}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-lg shadow-amber-900/5 border border-amber-50 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mb-4"><Info size={24}/></div>
            <p className="text-gray-500 text-sm font-bold mb-1 uppercase tracking-wider">Pending Bookings</p>
            <p className="text-4xl font-black text-gray-900">{data.pendingBookings}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-lg shadow-pink-900/5 border border-pink-50 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-2xl flex items-center justify-center mb-4"><List size={24}/></div>
            <p className="text-gray-500 text-sm font-bold mb-1 uppercase tracking-wider">New Enquiries</p>
            <p className="text-4xl font-black text-gray-900">{data.newEnquiries}</p>
          </div>
        </div>

        {/* TABS */}
        {!selectedHostel && (
          <div className="flex gap-3 mb-8 bg-gray-200/50 p-1.5 rounded-2xl w-fit">
            <button onClick={() => setActiveTab('hostels')} className={`px-8 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'hostels' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>My Properties</button>
            <button onClick={() => setActiveTab('bookings')} className={`px-8 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'bookings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              Reservation Requests {data.pendingBookings > 0 && <span className="ml-2 bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs">{data.pendingBookings}</span>}
            </button>
          </div>
        )}

        {/* HOSTEL DETAILS MODE */}
        {selectedHostel ? (
          <div className="fade-in">
            <button onClick={() => setSelectedHostelId(null)} className="mb-6 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm transition">
              <ArrowLeft size={18}/> Back to Properties
            </button>
            
            {/* Beautiful Header for Hostel */}
            <div className="bg-gray-900 rounded-[2.5rem] p-8 md:p-12 text-white mb-10 relative overflow-hidden shadow-2xl">
               <div className="absolute inset-0 opacity-40 bg-[url('/images/extra-demo-1.jpg')] bg-cover bg-center mix-blend-overlay"></div>
               <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-60"></div>
               
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                 <div>
                   <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-4 ${selectedHostel.isApproved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                     {selectedHostel.isApproved ? '● Live & Public' : '● Pending Admin Approval'}
                   </span>
                   <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">{selectedHostel.name}</h2>
                   <p className="text-gray-300 flex items-center gap-2 text-lg"><MapPin size={20} className="text-purple-400"/> {selectedHostel.streetAddress}, {selectedHostel.area}</p>
                 </div>
                 
                 <button onClick={() => { setEditingHostelId(selectedHostel.id); setEditHostelData({ name: selectedHostel.name, contactPhone: selectedHostel.contactPhone, description: selectedHostel.description }); }} className="bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-3 rounded-2xl text-sm font-bold backdrop-blur-md transition flex items-center gap-2">
                   <Settings size={18}/> Edit Property Details
                 </button>
               </div>
            </div>

            {/* EDIT HOSTEL MODAL/INLINE */}
            {editingHostelId === selectedHostel.id && (
              <div className="bg-white p-6 rounded-3xl mb-10 border border-gray-200 shadow-xl fade-in">
                <h3 className="font-bold text-xl mb-4">Edit {selectedHostel.name}</h3>
                <div className="space-y-4 max-w-2xl">
                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Hostel Name</label><input type="text" className="input-field py-3" value={editHostelData.name} onChange={e => setEditHostelData({...editHostelData, name: e.target.value})} /></div>
                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Contact Phone</label><input type="text" className="input-field py-3" value={editHostelData.contactPhone} onChange={e => setEditHostelData({...editHostelData, contactPhone: e.target.value})} /></div>
                  <div><label className="block text-xs font-bold text-gray-500 mb-1">Description</label><textarea className="input-field py-3" rows="3" value={editHostelData.description} onChange={e => setEditHostelData({...editHostelData, description: e.target.value})} /></div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => updateHostelMutation.mutate({ hostelId: selectedHostel.id, hostelData: editHostelData })} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-purple-600/20">Save Changes</button>
                    <button onClick={() => setEditingHostelId(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition">Cancel</button>
                  </div>
                </div>
              </div>
            )}
            
            {/* ROOMS HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Room Configurations</h3>
                <p className="text-gray-500">Manage pricing, photos, and availability for {selectedHostel.rooms?.length || 0} rooms.</p>
              </div>
              <button onClick={() => setActiveHostelIdForRoom(activeHostelIdForRoom === selectedHostel.id ? null : selectedHostel.id)} className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition">
                {activeHostelIdForRoom === selectedHostel.id ? 'Cancel Adding Room' : <><Plus size={18}/> Add New Room</>}
              </button>
            </div>

            {/* ADD ROOM FORM */}
            {activeHostelIdForRoom === selectedHostel.id && (
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-purple-100 mb-8 fade-in">
                <h4 className="font-black text-xl text-gray-800 mb-6 flex items-center gap-2"><Camera className="text-purple-600"/> Create New Room Profile</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Room Type</label>
                    <select className="input-field py-3" value={newRoom.roomType} onChange={e => setNewRoom({...newRoom, roomType: e.target.value})}>
                      <option>Single</option><option>Double</option><option>Triple</option><option>Quadruple</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Number of Beds</label>
                    <input type="number" min="1" className="input-field py-3" value={newRoom.beds} onChange={e => setNewRoom({...newRoom, beds: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Monthly Rent (UGX)</label>
                    <input type="number" placeholder="e.g. 500000" className="input-field py-3" value={newRoom.monthlyRent} onChange={e => setNewRoom({...newRoom, monthlyRent: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Amenities (Comma separated)</label>
                    <input type="text" placeholder="WiFi, Balcony, Desk" className="input-field py-3" value={newRoom.amenities} onChange={e => setNewRoom({...newRoom, amenities: e.target.value})} />
                  </div>
                  <div className="md:col-span-2 bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300 text-center">
                    <label className="block text-sm font-bold text-gray-700 mb-4">Upload Primary Room Photo</label>
                    <input type="file" accept="image/*" className="mx-auto file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 transition cursor-pointer" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setNewRoom({...newRoom, photoUrl: reader.result});
                        reader.readAsDataURL(file);
                      }
                    }} />
                    {newRoom.photoUrl && <div className="mt-4"><img src={newRoom.photoUrl} alt="Preview" className="w-32 h-32 object-cover rounded-2xl mx-auto shadow-md" /></div>}
                  </div>
                </div>
                <button onClick={() => addRoomMutation.mutate({ hostelId: selectedHostel.id, roomData: newRoom })} disabled={addRoomMutation.isPending || !newRoom.monthlyRent} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-2xl text-lg transition shadow-lg shadow-purple-600/30 disabled:opacity-50">
                  {addRoomMutation.isPending ? 'Saving Room...' : 'Publish Room Configuration'}
                </button>
              </div>
            )}
            
            {/* Grid of beautiful Room Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedHostel.rooms?.map(room => (
                  <div key={room.id} className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 flex flex-col hover:-translate-y-1 transition-transform group">
                    <div className="relative h-48 bg-gray-200">
                      <img src={room.photos?.[0]?.url || '/images/extra-demo-1.jpg'} alt="Room" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-4 right-4">
                        <button onClick={() => updateRoomMutation.mutate({ roomId: room.id, roomData: { status: room.status === 'AVAILABLE' ? 'FULL' : 'AVAILABLE' } })} className={`px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-full shadow-lg backdrop-blur-md transition ${room.status === 'AVAILABLE' ? 'bg-emerald-500/90 text-white hover:bg-emerald-600' : 'bg-red-500/90 text-white hover:bg-red-600'}`}>
                          {room.status === 'AVAILABLE' ? 'Available' : 'Taken'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-6 flex-grow flex flex-col">
                      {editingRoomId === room.id ? (
                        <div className="space-y-4 fade-in">
                          <input type="number" placeholder="Rent (UGX)" className="input-field py-2 text-sm" value={editRoomData.monthlyRent} onChange={e => setEditRoomData({...editRoomData, monthlyRent: e.target.value})} />
                          <input type="number" placeholder="Beds" className="input-field py-2 text-sm" value={editRoomData.beds} onChange={e => setEditRoomData({...editRoomData, beds: e.target.value})} />
                          <input type="text" placeholder="Amenities" className="input-field py-2 text-sm" value={editRoomData.amenities} onChange={e => setEditRoomData({...editRoomData, amenities: e.target.value})} />
                          <div className="text-xs font-bold text-gray-500 mb-1">Replace Photo:</div>
                          <input type="file" accept="image/*" className="text-xs w-full mb-2" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setEditRoomData({...editRoomData, photoUrl: reader.result});
                              reader.readAsDataURL(file);
                            }
                          }} />
                          <div className="flex gap-2 pt-2">
                            <button onClick={() => updateRoomMutation.mutate({ roomId: room.id, roomData: editRoomData })} className="flex-1 bg-purple-600 text-white font-bold py-2 rounded-xl text-sm shadow-md">Save</button>
                            <button onClick={() => setEditingRoomId(null)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl text-sm">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-xl font-black text-gray-900">{room.roomType}</h4>
                            <span className="text-purple-700 font-black">UGX {room.monthlyRent?.toLocaleString()}</span>
                          </div>
                          <p className="text-gray-500 text-sm mb-4 flex-grow">{room.beds} Bed(s) • {room.amenities || 'Basic amenities'}</p>
                          <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button onClick={() => { setEditingRoomId(room.id); setEditRoomData({ monthlyRent: room.monthlyRent, beds: room.beds, amenities: room.amenities || '' }); }} className="text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition">
                              Edit Room Details
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
              ))}
            </div>
            {selectedHostel.rooms?.length === 0 && (
              <div className="text-center bg-white rounded-3xl p-12 border border-gray-200 border-dashed">
                <p className="text-gray-500 text-lg">No rooms configured yet. Add your first room to start accepting bookings.</p>
              </div>
            )}
          </div>
        ) : (
          /* TAB: ALL HOSTELS OVERVIEW */
          activeTab === 'hostels' && (
            <div className="space-y-6 fade-in">
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div>
                  <h2 className="text-2xl font-black text-gray-800">Your Properties</h2>
                  <p className="text-gray-500 text-sm">Select a property to manage its rooms and details.</p>
                </div>
                <button onClick={() => setShowAddHostel(!showAddHostel)} className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition">
                  {showAddHostel ? 'Cancel' : <><Plus size={18} /> Add Property</>}
                </button>
              </div>

              {showAddHostel && (
                <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-purple-900/10 border border-purple-100 fade-in">
                  <h3 className="font-black text-2xl mb-6 text-gray-900">List a New Property</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Hostel Name</label><input type="text" className="input-field py-3" value={newHostel.name} onChange={e => setNewHostel({...newHostel, name: e.target.value})} /></div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                      <select className="input-field py-3" value={newHostel.category} onChange={e => setNewHostel({...newHostel, category: e.target.value})}>
                        <option value="UNIVERSITY_HOSTEL">University Hostel</option>
                        <option value="PRIVATE_RENTAL">Private Rental</option>
                      </select>
                    </div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Contact Phone</label><input type="text" className="input-field py-3" value={newHostel.contactPhone} onChange={e => setNewHostel({...newHostel, contactPhone: e.target.value})} /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Street Address</label><input type="text" className="input-field py-3" value={newHostel.streetAddress} onChange={e => setNewHostel({...newHostel, streetAddress: e.target.value})} /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700 mb-1">Area / University Zone</label><input type="text" placeholder="e.g. Bugema" className="input-field py-3" value={newHostel.area} onChange={e => setNewHostel({...newHostel, area: e.target.value})} /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700 mb-1">Description</label><textarea rows="3" className="input-field py-3" value={newHostel.description} onChange={e => setNewHostel({...newHostel, description: e.target.value})} /></div>
                  </div>
                  <button onClick={() => createHostelMutation.mutate(newHostel)} disabled={createHostelMutation.isPending || !newHostel.name} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-2xl text-lg transition shadow-xl shadow-purple-600/30 disabled:opacity-50">
                    {createHostelMutation.isPending ? 'Submitting...' : 'Submit Property for Approval'}
                  </button>
                </div>
              )}

              {data.hostels.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building size={40} className="text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">No Properties Listed</h3>
                  <p className="text-gray-500 mb-6">You haven't listed any hostels yet. Add your first property to get started.</p>
                  <button onClick={() => setShowAddHostel(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-600/30 transition">Add Property</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.hostels.map(hostel => (
                    <div key={hostel.id} onClick={() => setSelectedHostelId(hostel.id)} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                          <Building size={24} />
                        </div>
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${hostel.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {hostel.isApproved ? 'Live' : 'Pending'}
                        </span>
                      </div>
                      <h3 className="font-black text-2xl text-gray-900 mb-1">{hostel.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-6"><MapPin size={14}/> {hostel.area}</p>
                      
                      <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-gray-700">{hostel.rooms?.length || 0} Rooms</span>
                        <span className="text-purple-600 font-bold text-sm group-hover:translate-x-1 transition-transform flex items-center gap-1">Manage <ArrowLeft size={14} className="rotate-180"/></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* TAB: BOOKINGS (Only shown if no hostel is selected) */}
        {!selectedHostel && activeTab === 'bookings' && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden fade-in mb-20">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-2xl font-black text-gray-800">Reservation Requests</h2>
              <p className="text-gray-500 text-sm mt-1">Review and verify student payments and bookings.</p>
            </div>
            
            <div className="p-6">
              {(!data.bookings || data.bookings.length === 0) ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">All Caught Up!</h3>
                  <p className="text-gray-500">You have no pending bookings to review.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {data.bookings.map(booking => (
                    <div key={booking.id} className="border border-gray-200 rounded-3xl p-6 flex flex-col xl:flex-row gap-6 items-start xl:items-center hover:shadow-md transition">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 text-purple-700 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0 shadow-inner">
                        {booking.student.name.charAt(0)}
                      </div>
                      
                      <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-4">
                          <div>
                            <h3 className="font-black text-xl text-gray-900">{booking.student.name}</h3>
                            <p className="text-gray-500 text-sm">Requested a room at <span className="font-bold text-gray-800">{booking.hostel.name}</span></p>
                          </div>
                          <span className={`px-4 py-1.5 text-xs font-black tracking-wider uppercase rounded-full self-start ${booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {booking.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-gray-50 p-4 rounded-2xl text-sm border border-gray-100">
                          <div><span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider mb-1">Room Info</span> <span className="font-bold text-gray-800">{booking.room.roomType} ({booking.room.beds} Beds)</span></div>
                          <div><span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider mb-1">Move In</span> <span className="font-bold text-gray-800">{booking.startMonth}</span></div>
                          <div><span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider mb-1">Rent</span> <span className="font-bold text-gray-800">UGX {booking.room.monthlyRent?.toLocaleString()}</span></div>
                          <div><span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider mb-1">Student Phone</span> <span className="font-bold text-purple-700">{booking.student.phone}</span></div>
                          <div><span className="text-gray-400 font-bold block text-[10px] uppercase tracking-wider mb-1">Method</span> <span className="font-bold text-emerald-600">{booking.transaction?.paymentMethod?.replace('MOBILE_MONEY_', '') || (booking.note ? booking.note.replace('Payment Method: ', '') : 'Cash')}</span></div>
                        </div>
                      </div>

                      {booking.status === 'PENDING' && (
                        <div className="flex flex-col gap-3 w-full xl:w-72 xl:border-l xl:border-gray-100 xl:pl-6">
                          {booking.transaction && booking.transaction.status === 'AWAITING_VERIFICATION' ? (
                            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 shadow-sm">
                              <p className="text-xs text-amber-800 font-black uppercase tracking-wider mb-3 flex items-center gap-2">⚠️ Payment Proof Submitted</p>
                              <div className="bg-white p-3 rounded-xl mb-4 border border-amber-100 shadow-sm flex items-center gap-3">
                                {booking.transaction.receiptUrl && booking.transaction.receiptUrl.startsWith('data:image') && (
                                  <img src={booking.transaction.receiptUrl} alt="Receipt" className="w-12 h-12 object-cover rounded-lg shadow-sm border border-gray-200" />
                                )}
                                <div className="overflow-hidden">
                                  <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Ref / Details</span>
                                  <span className="font-black text-gray-900 text-sm truncate block">{booking.transaction.receiptType}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => verifyPaymentMutation.mutate({ id: booking.transaction.id, action: 'VERIFY' })} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl font-bold transition text-xs shadow-sm shadow-emerald-500/20">
                                  Verify
                                </button>
                                <button onClick={() => {
                                  const reason = prompt("Reason for rejection:");
                                  if (reason) verifyPaymentMutation.mutate({ id: booking.transaction.id, action: 'REJECT', rejectionReason: reason });
                                }} className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 py-2 rounded-xl font-bold transition text-xs">
                                  Reject
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <button onClick={() => confirmBookingMutation.mutate({ id: booking.id, action: 'CONFIRM' })} className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2">
                                <CheckCircle size={18} /> Confirm Stay
                              </button>
                              <button onClick={() => confirmBookingMutation.mutate({ id: booking.id, action: 'CANCEL' })} className="w-full bg-red-50 text-red-600 hover:bg-red-100 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
                                <XCircle size={18} /> Decline Request
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OwnerDashboard;
