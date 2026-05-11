import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Phone, MessageCircle, Star, CheckCircle, Heart, ChevronLeft } from 'lucide-react';
import api from '../api';

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

const HostelDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();
  
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const { data: hostel, isLoading, error } = useQuery({
    queryKey: ['hostel', id],
    queryFn: async () => {
      const res = await api.get(`/hostels/${id}`);
      return res.data;
    }
  });

  const handleBook = (roomId) => {
    if (!user) {
      navigate(`/signup?redirect=/book/${id}/${roomId}`);
      return;
    }
    navigate(`/book/${id}/${roomId}`);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/hostels/${id}/reviews`, { rating: reviewRating, comment: reviewComment });
      setReviewSuccess('Your review has been submitted for approval!');
      setReviewComment('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit review');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Hostel link copied to clipboard! Paste it to WhatsApp.");
  };

  const handleFavorite = async () => {
    if (!user || user.role !== 'STUDENT') {
      alert("Only students can save hostels to favorites.");
      return;
    }
    try {
      await api.post('/student/favourites', { hostelId: id });
      alert("Added to favorites! The owner has been notified.");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to add to favorites.");
    }
  };

  if (isLoading) return <div className="page-content text-center py-20 text-gray-500">Loading hostel details...</div>;
  if (error || !hostel) return <div className="page-content text-center py-20 text-red-500">Failed to load hostel details.</div>;

  const rawMainPhoto = hostel.rooms?.[0]?.photos?.[0]?.url;
  const mainPhoto = (!rawMainPhoto || rawMainPhoto.includes('http')) ? getDemoImage(hostel.id) : rawMainPhoto;

  const isPrivate = hostel.category === 'PRIVATE_RENTAL' || hostel.category === 'PRIVATE_UNIVERSITY' || hostel.category?.toLowerCase().includes('private');

  return (
    <div className="page-content bg-gray-50 pb-24">
      {/* ===== HERO IMAGE HEADER ===== */}
      <div className="relative h-72 md:h-96 w-full">
        <img 
          src={mainPhoto} 
          alt={hostel.name} 
          className="w-full h-full object-cover" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = demoImages[0];
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        
        {/* TOP BAR */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center max-w-6xl mx-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition">
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-2">
            <button onClick={handleShare} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            </button>
            <button onClick={handleFavorite} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition hover:bg-pink-500/40">
              <Heart size={20} />
            </button>
          </div>
        </div>

        {/* BOTTOM TITLES */}
        <div className="absolute bottom-0 left-0 right-0 p-6 max-w-6xl mx-auto">
          <span className={`${isPrivate ? 'bg-teal-500' : 'bg-purple-600'} text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block shadow-lg uppercase tracking-wider`}>
            {isPrivate ? 'Private Hostel' : 'University Hostel'}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight drop-shadow-md">
            {hostel.name}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-white/90 font-medium">
            <MapPin size={16} /> {hostel.streetAddress}, {hostel.area}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ===== LEFT COLUMN: DETAILS ===== */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* INFO CARD */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About this Hostel</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              {hostel.description || `Welcome to ${hostel.name}, a premium ${isPrivate ? 'private hostel' : 'university hostel'} located conveniently near ${hostel.university}. Perfect for students looking for a quiet, secure, and comfortable study environment.`}
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 font-semibold mb-1">University Proximity</p>
                <p className="font-bold text-gray-800">{hostel.university || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 font-semibold mb-1">Reviews</p>
                <div className="flex items-center gap-1 font-bold text-gray-800">
                  <Star size={16} className="fill-amber-400 text-amber-400" /> 4.5 <span className="font-normal text-gray-500">(12)</span>
                </div>
              </div>
            </div>
          </div>

          {/* REVIEWS MOVED TO BOTTOM */}

          {/* ROOMS SELECTION */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Rooms</h2>

            <div className="space-y-4">
              {hostel.rooms?.map(room => (
                <div key={room.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-5">
                  <div className="w-full md:w-48 flex flex-col gap-2">
                    <img src={(!room.photos?.[0]?.url || room.photos?.[0]?.url.includes('http')) ? '/images/room-demo-2.jpg' : room.photos[0].url} className="w-full h-32 object-cover rounded-xl" alt="Room" />
                    {room.photos?.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {room.photos.slice(1).map(p => (
                          <img key={p.id} src={p.url} className="w-16 h-12 object-cover rounded-lg flex-shrink-0" alt="Extra" />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg text-gray-900">{room.roomType} Room</h3>
                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${room.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                          {room.status === 'AVAILABLE' ? '🟢 Available' : '🔴 Taken'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{room.beds} Bed(s) per room</p>
                      
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {room.amenities && room.amenities.split(', ').map(a => (
                          <span key={a} className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-md font-semibold">{a}</span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-end justify-between mt-4">
                      <div>
                        <span className="text-2xl font-black text-purple-700">UGX {room.monthlyRent?.toLocaleString()}</span>
                        <span className="text-sm text-gray-500"> / semester</span>
                      </div>
                      
                      <button 
                        onClick={() => {
                          if (!user) {
                            navigate(`/signup?redirect=/book/${id}/${room.id}`);
                            return;
                          }
                          handleBook(room.id);
                        }}
                        disabled={room.status !== 'AVAILABLE'}
                        className={`px-6 py-2 rounded-xl font-bold transition-all ${
                          room.status !== 'AVAILABLE' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'btn-brand shadow-lg hover:-translate-y-0.5'
                        }`}
                      >
                        Reserve Room
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== REVIEWS SECTION (Moved to Bottom) ===== */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Student Reviews</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Review List */}
              <div className="space-y-4">
                {hostel.reviews && hostel.reviews.length > 0 ? (
                  hostel.reviews.map(rev => (
                    <div key={rev.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm">
                          {rev.studentId.substring(0,2).toUpperCase()}
                        </div>
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className={i < rev.rating ? 'fill-amber-400' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No reviews yet for this hostel.</p>
                )}
              </div>

              {/* Leave a Review Form */}
              {user?.role === 'STUDENT' && (
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 h-fit">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Leave a Review</h3>
                  {reviewSuccess ? (
                    <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-bold">{reviewSuccess}</div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-3">
                      <div>
                        <select value={reviewRating} onChange={e => setReviewRating(e.target.value)} className="input-field py-2 text-sm">
                          <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                          <option value="4">⭐⭐⭐⭐ Good</option>
                          <option value="3">⭐⭐⭐ Average</option>
                          <option value="2">⭐⭐ Poor</option>
                          <option value="1">⭐ Terrible</option>
                        </select>
                      </div>
                      <div>
                        <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} required rows={2} className="input-field text-sm" placeholder="Tell other students about your stay..."></textarea>
                      </div>
                      <button type="submit" className="btn-brand w-full py-2 text-sm">Submit Review</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== RIGHT COLUMN: CONTACT ===== */}
        <div className="col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4">Contact Property Owner</h3>
            
            <a href={`https://maps.google.com/?q=${encodeURIComponent((hostel.streetAddress || '') + ', ' + (hostel.area || '') + ', Uganda')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 w-full bg-blue-50 hover:bg-blue-100 p-4 rounded-xl mb-3 transition no-underline text-blue-800">
              <div className="w-10 h-10 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">View on Maps</p>
                <p className="font-bold">Google Maps Location</p>
              </div>
            </a>
            
            <a href={`tel:${hostel.contactPhone}`} className="flex items-center gap-3 w-full bg-gray-50 hover:bg-gray-100 p-4 rounded-xl mb-3 transition no-underline text-gray-800">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Call Directly</p>
                <p className="font-bold">{hostel.contactPhone}</p>
              </div>
            </a>

            <a href={`https://wa.me/${hostel.whatsappNumber?.replace('+', '') || hostel.contactPhone?.replace('+', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 w-full bg-[#E8FADF] hover:bg-[#D4F5C7] p-4 rounded-xl mb-5 transition no-underline text-gray-800">
              <div className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center">
                <MessageCircle size={20} />
              </div>
              <div>
                <p className="text-xs text-[#1E994B] font-bold uppercase tracking-wider">WhatsApp Message</p>
                <p className="font-bold">Fastest Response</p>
              </div>
            </a>

            <hr className="border-gray-100 mb-5" />
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Reserving through BkonnectHomes guarantees your spot. The owner will follow up to arrange payment and move-in details.
            </p>
          </div>
        </div>

      </div>

      {/* REVIEWS MOVED UP */}

      {/* ===== SIMILAR HOSTELS NEARBY ===== */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Similar Hostels Nearby</h2>
          <Link to="/" className="text-purple-600 font-bold hover:underline text-sm">View all</Link>
        </div>
        <SimilarHostels currentHostelId={id} category={hostel.category} />
      </div>

      {/* No Receipt Modal needed - Handled by dedicated Booking Page */}

    </div>
  );
};

const SimilarHostels = ({ currentHostelId, category }) => {
  const { data: hostels, isLoading } = useQuery({
    queryKey: ['hostels', category],
    queryFn: async () => {
      const res = await api.get(`/hostels?category=${category}`);
      return res.data.data;
    }
  });

  if (isLoading) return <div className="text-gray-400">Loading suggestions...</div>;
  
  const similar = (hostels || [])
    .filter(h => h.id !== currentHostelId)
    .slice(0, 3);

  if (similar.length === 0) return <p className="text-gray-500 italic">No similar hostels found.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {similar.map(h => (
        <Link key={h.id} to={`/hostel/${h.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 transition no-underline block group">
          <div className="h-40 relative overflow-hidden">
            <img src={(!h.rooms?.[0]?.photos?.[0]?.url || h.rooms?.[0]?.photos?.[0]?.url.includes('http')) ? getDemoImage(h.id) : h.rooms[0].photos[0].url} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="Hostel" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute bottom-3 left-3 text-white font-bold">{h.name}</span>
          </div>
          <div className="p-4 flex justify-between items-center bg-white">
            <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={12}/> {h.area}</span>
            <span className="text-purple-600 font-bold text-sm">View →</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default HostelDetails;
