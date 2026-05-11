import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-16 hidden md:block">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* BRAND */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-lg">B</span>
              </div>
              <span className="text-2xl font-black brand-text">BkonnectHomes</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Connecting students with quality, affordable hostel accommodation near private universities in Kampala, Uganda. Browse, compare, and book with ease.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <MapPin size={14} /> Kampala, Uganda
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Mail size={14} /> info@bkonnecthomes.ug
              </div>
            </div>
          </div>

          {/* EXPLORE */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Explore</h4>
            <ul className="space-y-3">
              {[
                { to: '/', label: 'Browse All Hostels' },
                { to: '/', label: 'Search' },
                { to: '/dashboard', label: 'My Saved Hostels' },
                { to: '/compare', label: 'Compare Hostels' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-gray-400 hover:text-white text-sm transition no-underline">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* UNIVERSITIES */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Universities</h4>
            <ul className="space-y-3">
              {[
                'Bugema University',
                'Makerere University',
                'Kampala International University',
                'Uganda Christian University',
                'Ndejje University',
              ].map((uni) => (
                <li key={uni}>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(uni + ', Uganda')}`} target="_blank" rel="noreferrer" className="text-gray-400 text-sm hover:text-purple-400 transition no-underline">
                    {uni}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2025 BkonnectHomes. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm flex items-center gap-1">
            Made with <Heart size={12} className="text-pink-400 fill-pink-400 mx-1" /> by Kazi Chris for Students in Uganda
          </p>
          <div className="flex gap-5">
            <span className="text-gray-500 hover:text-white text-sm cursor-pointer transition">Privacy Policy</span>
            <span className="text-gray-500 hover:text-white text-sm cursor-pointer transition">Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
