import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { useNavigate } from 'react-router-dom';
import { Home, List, CheckCircle, XCircle, Plus, Camera, MapPin } from 'lucide-react';

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('hostels');

  // Form States
  const [showAddHostel, setShowAddHostel] = useState(false);
  const [activeHostelIdForRoom, setActiveHostelIdForRoom] = useState(null);
  const [newHostel, setNewHostel] = useState({ name: '', streetAddress: '', area: '', category: 'UNIVERSITY_HOSTEL', contactPhone: '', description: '' });
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

  if (isLoading) return <div className="page-content text-center py-20 text-gray-500">Loading Dashboard...</div>;
  if (error) return <div className="page-content text-center py-20 text-red-500">Error loading dashboard. Please log in as Owner.</div>;

  return (
    <div className="page-content max-w-6xl mx-auto px-4 pb-20">
      <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-8">Owner Dashboard</h1>
      
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 card-hover">
          <p className="text-gray-500 text-sm font-semibold mb-1">Hostels</p>
          <p className="text-3xl font-black text-purple-700">{data.totalHostels}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 card-hover">
          <p className="text-gray-500 text-sm font-semibold mb-1">Rooms</p>
          <p className="text-3xl font-black text-indigo-700">{data.totalRooms}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 card-hover">
          <p className="text-gray-500 text-sm font-semibold mb-1">Pending Bookings</p>
          <p className="text-3xl font-black text-amber-500">{data.pendingBookings}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 card-hover">
          <p className="text-gray-500 text-sm font-semibold mb-1">Enquiries</p>
          <p className="text-3xl font-black text-pink-500">{data.newEnquiries}</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button onClick={() => setActiveTab('hostels')} className={`px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'hostels' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>My Hostels</button>
        <button onClick={() => setActiveTab('bookings')} className={`px-6 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === 'bookings' ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}>Manage Bookings</button>
      </div>

      {/* TAB: HOSTELS */}
      {activeTab === 'hostels' && (
        <div className="space-y-6 fade-in">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Your Properties</h2>
            <button onClick={() => setShowAddHostel(!showAddHostel)} className="btn-brand flex items-center gap-2">
              <Plus size={18} /> Add Hostel
            </button>
          </div>

          {showAddHostel && (
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-purple-100">
              <h3 className="font-bold text-lg mb-4">Add New Hostel</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input type="text" placeholder="Hostel Name" className="input-field" value={newHostel.name} onChange={e => setNewHostel({...newHostel, name: e.target.value})} />
                <select className="input-field" value={newHostel.category} onChange={e => setNewHostel({...newHostel, category: e.target.value})}>
                  <option value="UNIVERSITY_HOSTEL">University Hostel</option>
                  <option value="PRIVATE_RENTAL">Private Hostel</option>
                </select>
                <input type="text" placeholder="Contact Phone" className="input-field" value={newHostel.contactPhone} onChange={e => setNewHostel({...newHostel, contactPhone: e.target.value})} />
                <input type="text" placeholder="Street Address" className="input-field" value={newHostel.streetAddress} onChange={e => setNewHostel({...newHostel, streetAddress: e.target.value})} />
                <input type="text" placeholder="Area (e.g. Bugema)" className="input-field" value={newHostel.area} onChange={e => setNewHostel({...newHostel, area: e.target.value})} />
                <textarea placeholder="Description" rows="3" className="input-field md:col-span-2" value={newHostel.description} onChange={e => setNewHostel({...newHostel, description: e.target.value})} />
              </div>
              <button 
                onClick={() => createHostelMutation.mutate(newHostel)}
                disabled={createHostelMutation.isPending}
                className="btn-brand w-full"
              >
                {createHostelMutation.isPending ? 'Saving...' : 'Save Hostel'}
              </button>
            </div>
          )}

          {data.hostels.length === 0 ? (
            <div className="text-center p-10 bg-white rounded-2xl border border-gray-100">
              <Home size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">You haven't listed any hostels yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.hostels.map(hostel => (
                <div key={hostel.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-gray-900">{hostel.name}</h3>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${hostel.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {hostel.isApproved ? 'Live' : 'Pending Admin'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-4"><MapPin size={14}/> {hostel.streetAddress}</p>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="font-bold text-gray-700">{hostel.rooms.length} Rooms Configured</span>
                    <button 
                      onClick={() => setActiveHostelIdForRoom(activeHostelIdForRoom === hostel.id ? null : hostel.id)}
                      className="bg-purple-50 text-purple-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-purple-100 transition flex items-center gap-1"
                    >
                      {activeHostelIdForRoom === hostel.id ? 'Cancel' : <><Plus size={16}/> Add Room</>}
                    </button>
                  </div>

                  {/* ADD ROOM FORM */}
                  {activeHostelIdForRoom === hostel.id && (
                    <div className="mt-4 pt-4 border-t border-dashed border-gray-200 fade-in">
                      <h4 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2"><Camera size={16}/> Add New Room</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Room Type</label>
                            <select className="input-field text-sm py-2" value={newRoom.roomType} onChange={e => setNewRoom({...newRoom, roomType: e.target.value})}>
                              <option>Single</option>
                              <option>Double</option>
                              <option>Triple</option>
                              <option>Quadruple</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Beds</label>
                            <input type="number" min="1" className="input-field text-sm py-2" value={newRoom.beds} onChange={e => setNewRoom({...newRoom, beds: e.target.value})} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Monthly Rent (UGX)</label>
                          <input type="number" placeholder="e.g. 500000" className="input-field text-sm py-2" value={newRoom.monthlyRent} onChange={e => setNewRoom({...newRoom, monthlyRent: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Amenities (Comma separated)</label>
                          <input type="text" placeholder="WiFi, Balcony, Desk" className="input-field text-sm py-2" value={newRoom.amenities} onChange={e => setNewRoom({...newRoom, amenities: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Upload Room Photo</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            className="input-field text-sm py-2 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setNewRoom({...newRoom, photoUrl: reader.result});
                                };
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                          {newRoom.photoUrl && <div className="mt-2 text-xs text-emerald-600 font-bold flex items-center gap-1">✓ Photo ready to upload</div>}
                        </div>
                        <button 
                          onClick={() => addRoomMutation.mutate({ hostelId: hostel.id, roomData: newRoom })}
                          disabled={addRoomMutation.isPending || !newRoom.monthlyRent}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-xl text-sm transition mt-2 disabled:opacity-50"
                        >
                          {addRoomMutation.isPending ? 'Saving...' : 'Save Room & Photo'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden fade-in">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800">Reservation Requests</h2>
          </div>
          
          <div className="p-5">
            {(!data.bookings || data.bookings.length === 0) ? (
              <p className="text-gray-500 text-center py-6">No bookings yet.</p>
            ) : (
              <div className="space-y-4">
                {data.bookings.map(booking => (
                  <div key={booking.id} className="border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row gap-5 items-start md:items-center">
                    <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-black flex-shrink-0">
                      {booking.student.name.charAt(0)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-gray-900">{booking.student.name} <span className="text-gray-400 text-sm font-normal">wants a room at</span> {booking.hostel.name}</h3>
                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : booking.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 bg-gray-50 p-3 rounded-xl text-sm">
                        <div><span className="text-gray-400 font-semibold block text-xs">Room Type</span> <span className="font-bold">{booking.room.roomType}</span></div>
                        <div><span className="text-gray-400 font-semibold block text-xs">Move In</span> <span className="font-bold">{booking.startMonth}</span></div>
                        <div><span className="text-gray-400 font-semibold block text-xs">Duration</span> <span className="font-bold">{booking.durationMonths} Mo.</span></div>
                        <div><span className="text-gray-400 font-semibold block text-xs">Student Phone</span> <span className="font-bold text-purple-700">{booking.student.phone}</span></div>
                        <div><span className="text-gray-400 font-semibold block text-xs">Payment</span> <span className="font-bold text-emerald-600">{booking.note ? booking.note.replace('Payment Method: ', '') : 'Cash'}</span></div>
                      </div>
                    </div>

                    {booking.status === 'PENDING' && (
                      <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
                        <button onClick={() => confirmBookingMutation.mutate({ id: booking.id, action: 'CONFIRM' })} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1">
                          <CheckCircle size={18} /> Confirm
                        </button>
                        <button onClick={() => confirmBookingMutation.mutate({ id: booking.id, action: 'CANCEL' })} className="flex-1 bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-xl font-bold transition flex items-center justify-center gap-1">
                          <XCircle size={18} /> Decline
                        </button>
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
  );
};

export default OwnerDashboard;
