import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import { LoginPage, SignupPage } from './pages/AuthPages';
import OwnerDashboard from './OwnerDashboard';
import HostelDetails from './pages/HostelDetails';
import BookingPage from './pages/BookingPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ContactUs from './pages/ContactUs';
import ComparePage from './pages/ComparePage';
import CompareFloatingButton from './components/CompareFloatingButton';

const App = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/owner" element={<OwnerDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/hostel/:id" element={<HostelDetails />} />
          <Route path="/book/:hostelId/:roomId" element={<BookingPage />} />
          <Route path="/profile" element={<StudentDashboard />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/compare" element={<ComparePage />} />
          {/* Add more routes here as needed */}
        </Routes>
      </main>

      <Footer />
      <CompareFloatingButton />
    </div>
  );
};

export default App;
