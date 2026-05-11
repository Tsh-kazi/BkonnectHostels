import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Wifi, Star, Phone, Scale } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api';
import { CompareContext } from '../context/CompareContext';

const HostelCard = ({ hostel }) => {
  const [liked, setLiked] = useState(false);
  const { addToCompare, removeFromCompare, isInCompare } = React.useContext(CompareContext);
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const cheapestRoom = hostel.rooms?.sort((a, b) => a.monthlyRent - b.monthlyRent)[0];
  const allAvailable = hostel.rooms?.some(r => r.status === 'AVAILABLE');
  
  // Dynamic Image Logic
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

  const rawUrl = cheapestRoom?.photos?.[0]?.url;
  const photoUrl = (!rawUrl || rawUrl.includes('http')) ? getDemoImage(hostel.id) : rawUrl;
  
  // Category Styles
  const isPrivate = hostel.category === 'PRIVATE_RENTAL' || hostel.category === 'PRIVATE_UNIVERSITY' || hostel.category?.toLowerCase().includes('private');
  const cardBorder = isPrivate ? 'border-emerald-200 hover:border-emerald-400 shadow-emerald-100/50' : 'border-gray-100 hover:border-purple-200';
  const badgeColors = isPrivate ? 'bg-gradient-to-r from-teal-500 to-emerald-400' : 'bg-gradient-to-r from-purple-600 to-indigo-500';

  const amenities = cheapestRoom?.amenities ? cheapestRoom.amenities.split(', ') : [];
  
  // Dynamic rating based on ID for variation
  const getRating = (id) => {
    if (!id) return "4.5";
    const num = String(id).charCodeAt(0) % 10;
    return (4.0 + (num / 10)).toFixed(1);
  };
  const displayRating = getRating(hostel.id);

  const handleSave = async (e) => {
    e.preventDefault(); // Prevent navigating to hostel details
    if (!user || user.role !== 'STUDENT') {
      alert("Only students can save hostels.");
      return;
    }
    try {
      await api.post('/student/favourites', { hostelId: hostel.id });
      setLiked(true);
      alert("Hostel saved to your Favourites!");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save hostel.");
    }
  };

  return (
    <div className={`bg-white rounded-2xl overflow-hidden border ${cardBorder} transition-all duration-300 hover:shadow-xl fade-in relative group`}>
      

      
      {/* IMAGE */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={photoUrl}
          alt={hostel.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null; // Prevent infinite loop if fallback also fails
            e.target.src = demoImages[0];
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* TOP RIGHT ACTION BUTTONS */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          {/* COMPARE BUTTON */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isInCompare(hostel.id)) {
                removeFromCompare(hostel.id);
              } else {
                addToCompare(hostel);
              }
            }}
            className={`w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition hover:scale-110 ${isInCompare(hostel.id) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/90 text-gray-500 hover:text-indigo-600'}`}
            title="Compare"
          >
            <Scale size={16} />
          </button>
          
          {/* SAVE BUTTON */}
          <button 
            onClick={handleSave}
            className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-500 hover:text-pink-500 hover:scale-110 transition"
            title="Save"
          >
            <Heart size={16} className={liked ? 'fill-pink-500 text-pink-500' : ''} />
          </button>
        </div>

        {/* STATUS BADGE */}
        <div className="absolute top-3 left-3">
          <span className={allAvailable ? 'badge-available' : 'badge-taken'}>
            {allAvailable ? '🟢 Available' : '🔴 Full'}
          </span>
        </div>

        {/* CATEGORY */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className={`${badgeColors} backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg`}>
            {isPrivate ? 'Private Hostel' : 'University Hostel'}
          </span>
        </div>

        {/* PROMINENT RATING BADGE */}
        <div className="absolute bottom-3 right-3">
          <div className="bg-white/95 backdrop-blur-sm shadow-lg text-gray-900 text-xs font-black px-2 py-1 rounded-lg flex items-center gap-1 border border-white/20">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span>{displayRating}</span>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4">
        {/* HEADER */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-gray-900 text-base leading-snug truncate">{hostel.name}</h3>
            <div className="flex items-center gap-1 mt-0.5 text-gray-500 text-xs">
              <MapPin size={11} />
              <span className="truncate">{hostel.area}, {hostel.university}</span>
            </div>
          </div>
        </div>

        {/* AMENITIES */}
        <div className="flex gap-1.5 mt-2 mb-3 flex-wrap">
          {amenities.slice(0, 3).map((a) => (
            <span key={a} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">{a}</span>
          ))}
          {amenities.length > 3 && (
            <span className="bg-gray-100 text-gray-400 text-xs px-2 py-0.5 rounded-full font-medium">+{amenities.length - 3}</span>
          )}
        </div>

        {/* PRICE + ACTION */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <div>
            <span className="text-lg font-black text-purple-700">
              UGX {cheapestRoom?.monthlyRent?.toLocaleString() || '—'}
            </span>
            <span className="text-xs text-gray-400 font-normal ml-1">/mo</span>
          </div>

          {allAvailable ? (
            <Link
              to={`/hostel/${hostel.id}`}
              className="btn-brand text-sm py-2 px-4 no-underline"
            >
              View
            </Link>
          ) : (
            <button disabled className="bg-gray-200 text-gray-400 text-sm py-2 px-4 rounded-xl font-semibold cursor-not-allowed">
              Full
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostelCard;
