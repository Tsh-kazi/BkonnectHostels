import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft, CheckCircle, CreditCard, Wallet, Banknote, ShieldCheck } from 'lucide-react';
import api from '../api';

const BookingPage = () => {
  const { hostelId, roomId } = useParams();
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } })();

  const [paymentMethod, setPaymentMethod] = useState('MOBILE_MONEY_MTN');
  const [duration, setDuration] = useState(4); // 4 months = 1 semester
  const [isSuccess, setIsSuccess] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // Fetch hostel to get room details
  const { data: hostel, isLoading } = useQuery({
    queryKey: ['hostel', hostelId],
    queryFn: async () => (await api.get(`/hostels/${hostelId}`)).data
  });

  const room = hostel?.rooms?.find(r => r.id === roomId);

  useEffect(() => {
    if (!user) {
      navigate(`/signup?redirect=/book/${hostelId}/${roomId}`);
    }
  }, [user, navigate, hostelId, roomId]);

  const bookMutation = useMutation({
    mutationFn: async () => {
      const note = `Payment Method: ${paymentMethod.replace(/_/g, ' ')}`;
      return await api.post('/bookings', {
        hostelId,
        roomId,
        startMonth: new Date().toISOString().slice(0, 7),
        durationMonths: duration,
        note
      });
    },
    onSuccess: (res) => {
      setReceipt(res.data.booking);
      setIsSuccess(true);
    },
    onError: (err) => {
      alert(err.response?.data?.error || "Booking failed.");
    }
  });

  if (isLoading) return <div className="page-content text-center py-20">Loading secure checkout...</div>;
  if (!hostel || !room) return <div className="page-content text-center py-20 text-red-500">Room not found.</div>;

  const totalAmount = room.monthlyRent * duration;

  if (isSuccess) {
    return (
      <div className="page-content bg-gray-50 min-h-screen py-12 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center fade-in">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Reservation Confirmed!</h1>
          <p className="text-gray-500 mb-8">Your room has been locked in and the owner has been notified.</p>
          
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 text-left">
            <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Booking Receipt</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Hostel</span> <span className="font-bold text-gray-900">{hostel.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Room</span> <span className="font-bold text-gray-900">{room.roomType} Room</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Duration</span> <span className="font-bold text-gray-900">{duration} Months</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment Selected</span> <span className="font-bold text-gray-900">{paymentMethod.replace(/_/g, ' ')}</span></div>
              <div className="flex justify-between pt-3 border-t border-gray-200 mt-3"><span className="font-bold text-gray-900">Total Due</span> <span className="font-black text-purple-700 text-lg">UGX {totalAmount.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-left">
            <h4 className="text-amber-800 font-bold mb-2 flex items-center gap-2">⚠️ Finalize Payment</h4>
            <p className="text-amber-700 text-sm leading-relaxed mb-3">
              To guarantee your spot, you must complete your payment of <strong>UGX {totalAmount.toLocaleString()}</strong> via {paymentMethod.replace(/_/g, ' ')}.
            </p>
            <p className="text-amber-800 text-sm font-bold">
              Call the Owner immediately at: <a href={`tel:${hostel.contactPhone}`} className="text-purple-700 underline">{hostel.contactPhone}</a>
            </p>
          </div>

          <Link to="/dashboard" className="btn-brand w-full block text-center py-3">View My Bookings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content bg-gray-50 min-h-screen pb-24">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-gray-900">Secure Checkout</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT COL: BOOKING DETAILS */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Booking Details</h2>
            
            <div className="flex gap-4 mb-6">
              <img src={(!room.photos?.[0]?.url || room.photos?.[0]?.url.includes('http')) ? '/images/room-demo-2.jpg' : room.photos[0].url} className="w-24 h-24 object-cover rounded-xl" alt="Room" />
              <div>
                <p className="text-sm text-purple-600 font-bold">{hostel.name}</p>
                <h3 className="font-bold text-gray-900 text-lg">{room.roomType} Room</h3>
                <p className="text-gray-500 text-sm">{room.beds} Bed(s) • UGX {room.monthlyRent.toLocaleString()}/mo</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Duration</label>
                <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600">
                  <option value={1}>1 Month</option>
                  <option value={4}>1 Semester (4 Months)</option>
                  <option value={8}>2 Semesters (8 Months)</option>
                  <option value={12}>1 Year (12 Months)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Payment Method</h2>
            <p className="text-sm text-gray-500 mb-4">Select how you would like to pay the owner.</p>
            
            <div className="space-y-3">
              {[
                { id: 'MOBILE_MONEY_MTN', name: 'MTN Mobile Money', icon: <Wallet size={20} className="text-yellow-500"/> },
                { id: 'MOBILE_MONEY_AIRTEL', name: 'Airtel Money', icon: <Wallet size={20} className="text-red-500"/> },
                { id: 'BANK_TRANSFER', name: 'Bank Transfer', icon: <CreditCard size={20} className="text-blue-500"/> },
                { id: 'CASH_ON_ARRIVAL', name: 'Cash on Arrival', icon: <Banknote size={20} className="text-emerald-500"/> },
              ].map(method => (
                <label key={method.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === method.id ? 'border-purple-600 bg-purple-50' : 'border-gray-100 hover:border-purple-200'}`}>
                  <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-purple-600 focus:ring-purple-600" />
                  <div className="flex items-center gap-2">
                    {method.icon}
                    <span className="font-bold text-gray-800">{method.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COL: SUMMARY & CONFIRM */}
        <div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-40">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Price Breakdown</h2>
            
            <div className="space-y-4 mb-6 text-gray-600">
              <div className="flex justify-between">
                <span>Monthly Rent</span>
                <span className="font-semibold text-gray-900">UGX {room.monthlyRent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-semibold text-gray-900">x {duration} months</span>
              </div>
              <div className="flex justify-between">
                <span>BkonnectHomes Fee</span>
                <span className="text-emerald-600 font-bold border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded text-xs">FREE</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-bold text-gray-900">Total Due</span>
                <span className="text-3xl font-black text-purple-700">UGX {totalAmount.toLocaleString()}</span>
              </div>
              <p className="text-right text-xs text-gray-400 mt-1">To be paid directly to the owner.</p>
            </div>

            <button 
              onClick={() => bookMutation.mutate()}
              disabled={bookMutation.isPending}
              className="btn-brand w-full py-4 text-lg flex justify-center items-center gap-2 shadow-lg hover:-translate-y-0.5"
            >
              {bookMutation.isPending ? 'Processing...' : <><ShieldCheck size={20} /> Confirm Reservation</>}
            </button>
            
            <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
              By confirming, you agree to our Terms of Service and Privacy Policy. The owner will hold this room for 48 hours pending payment.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BookingPage;
