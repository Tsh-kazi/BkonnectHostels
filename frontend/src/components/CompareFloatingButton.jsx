import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale, X } from 'lucide-react';
import { CompareContext } from '../context/CompareContext';

const CompareFloatingButton = () => {
  const { compareList, clearCompare } = useContext(CompareContext);
  const navigate = useNavigate();

  if (compareList.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 fade-in">
      {/* Tooltip / Hint */}
      <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-gray-100 text-sm font-bold text-gray-700 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
        {compareList.length} hostel{compareList.length > 1 ? 's' : ''} selected
        <button 
          onClick={(e) => {
            e.stopPropagation();
            clearCompare();
          }}
          className="ml-2 text-gray-400 hover:text-red-500 transition"
          title="Clear list"
        >
          <X size={16} />
        </button>
      </div>

      {/* Main FAB */}
      <button
        onClick={() => navigate('/compare')}
        className="btn-brand shadow-xl shadow-purple-500/30 flex items-center gap-2 px-6 py-4 rounded-full text-lg hover:scale-105 transition"
      >
        <Scale size={24} />
        Compare Now
      </button>
    </div>
  );
};

export default CompareFloatingButton;
