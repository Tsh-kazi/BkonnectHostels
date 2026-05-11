import React, { createContext, useState, useEffect } from 'react';

export const CompareContext = createContext();

export const CompareProvider = ({ children }) => {
  const [compareList, setCompareList] = useState(() => {
    try {
      const saved = localStorage.getItem('compareList');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('compareList', JSON.stringify(compareList));
  }, [compareList]);

  const addToCompare = (hostel) => {
    if (compareList.length >= 3) {
      alert("You can only compare up to 3 hostels at a time.");
      return;
    }
    if (!compareList.find((h) => h.id === hostel.id)) {
      setCompareList([...compareList, hostel]);
    }
  };

  const removeFromCompare = (hostelId) => {
    setCompareList(compareList.filter((h) => h.id !== hostelId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const isInCompare = (hostelId) => {
    return compareList.some((h) => h.id === hostelId);
  };

  return (
    <CompareContext.Provider
      value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare }}
    >
      {children}
    </CompareContext.Provider>
  );
};
