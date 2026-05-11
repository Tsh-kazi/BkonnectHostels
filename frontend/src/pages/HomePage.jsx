import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import api from '../api';
import HostelCard from '../components/HostelCard';

const CATEGORIES = [
  { id: '', emoji: '🏠', label: 'All' },
  { id: 'UNIVERSITY_HOSTEL', emoji: '🎓', label: 'University' },
  { id: 'PRIVATE_RENTAL', emoji: '🏡', label: 'Private Hostel' },
];

const UNIVERSITIES = [
  { name: 'Bugema University', short: 'Bugema' },
  { name: 'Makerere University', short: 'Mak' },
  { name: 'Kampala International University', short: 'KIU' },
  { name: 'Uganda Christian University', short: 'UCU' },
  { name: 'Ndejje University', short: 'Ndejje' },
];

const HomePage = () => {
  const [category, setCategory] = useState('');
  const [university, setUniversity] = useState('');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['hostels', category, university],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (university) params.append('university', university);
      const res = await api.get(`/hostels?${params.toString()}`);
      return res.data.data || [];
    },
  });

  const filtered = (data || []).filter(h =>
    !search || h.name.toLowerCase().includes(search.toLowerCase()) ||
    h.area?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content">
      <div className="max-w-6xl mx-auto px-4">

        {/* ===== HERO SECTION ===== */}
        <div className="rounded-[2.5rem] p-8 md:p-12 mb-10 text-white mt-4 relative overflow-hidden shadow-2xl flex items-center min-h-[400px]">
          {/* Background Image & Overlay */}
          <div className="absolute inset-0 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center transition-transform duration-1000 hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/95 via-purple-900/80 to-transparent" />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          
          <div className="relative z-10 max-w-xl fade-in">
            <div className="inline-block bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full mb-6 shadow-sm">
              ✨ The #1 Student Housing Platform
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] mb-6 drop-shadow-lg">
              Find Your Perfect <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-pink-400">Student Home.</span>
            </h1>
            
            <p className="text-white/90 text-base md:text-lg mb-8 max-w-md font-medium leading-relaxed drop-shadow-md">
              Discover affordable, verified hostels near top universities in Uganda. Book instantly with zero hidden fees.
            </p>
            
            {/* SEARCH BAR (Glassmorphism) */}
            <div className="flex flex-col sm:flex-row items-center gap-2 bg-white/10 backdrop-blur-xl rounded-2xl p-2 shadow-2xl border border-white/20 w-full md:w-[60%]">
              <div className="flex items-center flex-1 w-full bg-white/90 rounded-xl px-3 py-1">
                <Search size={20} className="text-purple-600 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by hostel name or area..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 py-3 px-3 text-gray-900 text-sm md:text-base font-semibold outline-none bg-transparent placeholder-gray-400"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="p-1 text-gray-400 hover:text-gray-600 transition">
                    <X size={16} />
                  </button>
                )}
              </div>
              <button className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-gray-900 font-black py-3 px-8 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5">
                Search
              </button>
            </div>
          </div>
        </div>

        {/* ===== CATEGORY STORIES (Instagram-style) ===== */}
        <div className="mb-6">
          <h2 className="text-base font-bold text-gray-700 mb-3">Browse by Category</h2>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)} className="story-circle">
                <div className={`story-ring ${category === cat.id ? 'active' : 'inactive'}`}>
                  <div className="story-inner">{cat.emoji}</div>
                </div>
                <span className={`story-label ${category === cat.id ? 'text-purple-700 font-bold' : ''}`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== UNIVERSITY FILTER PILLS ===== */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 pb-1">
          <button
            onClick={() => setUniversity('')}
            className={`text-xs font-semibold px-4 py-2 rounded-full flex-shrink-0 border transition-all ${university === '' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}
          >
            All Universities
          </button>
          {UNIVERSITIES.map(u => (
            <button
              key={u.name}
              onClick={() => setUniversity(university === u.name ? '' : u.name)}
              className={`text-xs font-semibold px-4 py-2 rounded-full flex-shrink-0 border transition-all ${university === u.name ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}
            >
              {u.short}
            </button>
          ))}
        </div>

        {/* ===== SECTION HEADER ===== */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              {university || (category ? CATEGORIES.find(c => c.id === category)?.label + ' Hostels' : 'All Hostels')}
            </h2>
            <p className="text-gray-400 text-sm">{filtered.length} listings found</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-sm font-semibold px-4 py-2 rounded-xl hover:border-purple-400 transition"
          >
            <SlidersHorizontal size={15} />
            Filters
          </button>
        </div>

        {/* ===== HOSTEL GRID ===== */}
        {isLoading ? (
          <div className="hostel-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-52 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-8 bg-gray-200 rounded w-full mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">⚠️</p>
            <p className="text-gray-500 font-medium">Could not load hostels. Make sure the backend server is running.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🏠</p>
            <p className="text-gray-500 font-semibold text-lg">No hostels found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different category or university</p>
          </div>
        ) : (
          <div className="hostel-grid">
            {filtered.map(hostel => <HostelCard key={hostel.id} hostel={hostel} />)}
          </div>
        )}

        {/* ===== BUGEMA HIGHLIGHT SECTION ===== */}
        {!university && !category && (
          <div className="mt-12 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">🎓 Near Bugema University</h2>
                <p className="text-gray-400 text-sm">Specially curated for Bugema students</p>
              </div>
              <button onClick={() => setUniversity('Bugema University')} className="text-purple-600 text-sm font-bold hover:underline">See all →</button>
            </div>
            <div className="hostel-grid">
              {(data || [])
                .filter(h => h.university === 'Bugema University')
                .slice(0, 4)
                .map(hostel => <HostelCard key={hostel.id} hostel={hostel} />)
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
