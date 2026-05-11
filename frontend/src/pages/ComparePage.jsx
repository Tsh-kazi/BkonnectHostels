import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompareContext } from '../context/CompareContext';
import { ArrowLeft, MapPin, CheckCircle, Star, X, Home, Info, Scale } from 'lucide-react';

const ComparePage = () => {
  const { compareList, removeFromCompare, clearCompare } = useContext(CompareContext);
  const navigate = useNavigate();

  // Helper to safely display prices
  const getStartingPrice = (hostel) => {
    if (!hostel.rooms || hostel.rooms.length === 0) return 'N/A';
    const cheapest = [...hostel.rooms].sort((a, b) => a.monthlyRent - b.monthlyRent)[0];
    return `UGX ${cheapest.monthlyRent.toLocaleString()}`;
  };

  // Extract all unique amenities across selected hostels
  const allAmenities = Array.from(new Set(
    compareList.flatMap(h => {
      if (!h.rooms || h.rooms.length === 0) return [];
      const amenitiesStr = h.rooms[0].amenities || '';
      return amenitiesStr.split(',').map(a => a.trim()).filter(Boolean);
    })
  ));

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

  const getMainPhoto = (hostel) => {
    const rawUrl = hostel.rooms?.[0]?.photos?.[0]?.url;
    return (!rawUrl || rawUrl.includes('http')) ? getDemoImage(hostel.id) : rawUrl;
  };

  if (compareList.length === 0) {
    return (
      <div className="page-content bg-gray-50 flex flex-col items-center justify-center text-center px-4 py-20 min-h-[70vh]">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
          <Scale size={48} className="text-gray-300" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-4">Nothing to compare yet!</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Browse hostels and click the scale icon on any property to add it to your comparison list.
        </p>
        <button onClick={() => navigate('/')} className="btn-brand flex items-center gap-2">
          <Home size={18} /> Browse Hostels
        </button>
      </div>
    );
  }

  return (
    <div className="page-content bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-sm border border-gray-100 transition">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900">Compare Hostels</h1>
              <p className="text-gray-500 text-sm">Comparing {compareList.length} propert{compareList.length === 1 ? 'y' : 'ies'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className="btn-secondary text-sm">Add More</button>
            <button onClick={clearCompare} className="btn-outline text-red-500 border-red-200 hover:bg-red-50 text-sm">Clear All</button>
          </div>
        </div>

        {/* COMPARISON TABLE / GRID */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-x-auto scrollbar-hide">
          <div className="min-w-[800px] p-6">
            
            {/* ROW 1: Headers & Images */}
            <div className="grid grid-cols-4 gap-6 border-b border-gray-100 pb-6 mb-6">
              <div className="col-span-1 flex items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                  <Info size={16} /> Property Specs
                </p>
              </div>
              
              {compareList.map((hostel) => (
                <div key={hostel.id} className="col-span-1 relative group bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                  <button 
                    onClick={() => removeFromCompare(hostel.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 z-10 opacity-0 group-hover:opacity-100 transition shadow-sm"
                  >
                    <X size={16} />
                  </button>
                  <div className="h-32 bg-gray-200 relative">
                    <img 
                      src={getMainPhoto(hostel)} 
                      className="w-full h-full object-cover" 
                      alt={hostel.name} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = demoImages[0];
                      }}
                    />
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-black text-gray-900 truncate mb-1" title={hostel.name}>{hostel.name}</h3>
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                      <MapPin size={12} /> <span className="truncate">{hostel.area}</span>
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Empty slots if less than 3 */}
              {[...Array(3 - compareList.length)].map((_, i) => (
                <div key={`empty-${i}`} className="col-span-1 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 py-10 opacity-50">
                  <Scale size={24} className="mb-2" />
                  <span className="text-sm font-bold">Empty Slot</span>
                </div>
              ))}
            </div>

            {/* ROW 2: Category */}
            <div className="grid grid-cols-4 gap-6 border-b border-gray-100 pb-4 mb-4 items-center">
              <div className="col-span-1 font-bold text-gray-700 text-sm">Property Type</div>
              {compareList.map(h => (
                <div key={h.id} className="col-span-1 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${h.category?.toLowerCase().includes('private') ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>
                    {h.category?.toLowerCase().includes('private') ? 'Private Hostel' : 'University Hostel'}
                  </span>
                </div>
              ))}
            </div>

            {/* ROW 3: Price */}
            <div className="grid grid-cols-4 gap-6 border-b border-gray-100 pb-4 mb-4 items-center">
              <div className="col-span-1 font-bold text-gray-700 text-sm">Starting Price /mo</div>
              {compareList.map(h => (
                <div key={h.id} className="col-span-1 text-center font-black text-lg text-gray-900">
                  {getStartingPrice(h)}
                </div>
              ))}
            </div>

            {/* ROW 4: University / Proximity */}
            <div className="grid grid-cols-4 gap-6 border-b border-gray-100 pb-4 mb-4 items-center">
              <div className="col-span-1 font-bold text-gray-700 text-sm">Closest University</div>
              {compareList.map(h => (
                <div key={h.id} className="col-span-1 text-center text-sm font-semibold text-gray-600">
                  {h.university || 'Not Specified'}
                </div>
              ))}
            </div>

            {/* ROW 5: Amenities (Dynamic generation based on common amenities) */}
            <div className="mb-4 mt-8">
              <h4 className="font-bold text-gray-900 mb-4">Amenities Offered</h4>
              {allAmenities.length === 0 ? (
                <p className="text-gray-500 text-sm text-center italic">No amenities specified for these properties.</p>
              ) : (
                allAmenities.map(amenity => (
                  <div key={amenity} className="grid grid-cols-4 gap-6 py-3 border-b border-gray-50 items-center hover:bg-gray-50 transition rounded-lg px-2">
                    <div className="col-span-1 text-sm text-gray-600 font-medium capitalize">{amenity}</div>
                    {compareList.map(h => {
                      const hasIt = h.rooms?.[0]?.amenities?.toLowerCase().includes(amenity.toLowerCase());
                      return (
                        <div key={h.id} className="col-span-1 flex justify-center">
                          {hasIt ? (
                            <CheckCircle size={20} className="text-emerald-500" />
                          ) : (
                            <span className="text-gray-300 font-bold">-</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* ROW 6: Actions */}
            <div className="grid grid-cols-4 gap-6 pt-6">
              <div className="col-span-1"></div>
              {compareList.map(h => (
                <div key={h.id} className="col-span-1 flex justify-center">
                  <button onClick={() => navigate(`/hostel/${h.id}`)} className="btn-brand w-full py-3">
                    View Details
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;
