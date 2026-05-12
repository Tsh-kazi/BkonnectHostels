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

  // Payment Simulation States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [showVisaPrompt, setShowVisaPrompt] = useState(false);
  const [visaDetails, setVisaDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1); // 1 = input, 2 = processing, 3 = success

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
    mutationFn: async ({ isPaid } = {}) => {
      const note = `Payment Method: ${paymentMethod.replace(/_/g, ' ')}${isPaid ? ' (Paid via Mobile Money)' : ''}`;
      return await api.post('/bookings', {
        hostelId,
        roomId,
        startMonth: new Date().toISOString().slice(0, 7),
        durationMonths: duration,
        paymentMethod,
        paymentCompleted: !!isPaid,
        note
      });
    },
    onSuccess: (res) => {
      setReceipt(res.data.booking);
      setIsSuccess(true);
    },
    onError: (err) => {
      setIsProcessingPayment(false);
      setShowPinPrompt(false);
      alert(err.response?.data?.error || "Booking failed.");
    }
  });

  const handleConfirmReservation = () => {
    if (paymentMethod === 'MOBILE_MONEY_MTN' || paymentMethod === 'MOBILE_MONEY_AIRTEL') {
      setShowPinPrompt(true);
      setShowVisaPrompt(false);
      setPaymentStep(1);
    } else if (paymentMethod === 'VISA_CARD') {
      setShowVisaPrompt(true);
      setShowPinPrompt(false);
      setPaymentStep(1);
    } else {
      bookMutation.mutate();
    }
  };

  const handleSimulatePayment = () => {
    if (!phoneNumber) return;
    setPaymentStep(2);
    setIsProcessingPayment(true);
    
    // Simulate USSD Push wait
    setTimeout(() => {
      setPaymentStep(3);
      // Create the booking automatically marked as paid
      setTimeout(() => {
        bookMutation.mutate({ isPaid: true });
      }, 1500);
    }, 4000);
  };

  const handleSimulateVisaPayment = () => {
    if (!visaDetails.number || !visaDetails.expiry || !visaDetails.cvc) return;
    setPaymentStep(2);
    setIsProcessingPayment(true);
    
    // Simulate Bank/Visa Gateway processing wait
    setTimeout(() => {
      setPaymentStep(3);
      setTimeout(() => {
        bookMutation.mutate({ isPaid: true });
      }, 1500);
    }, 3500);
  };

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

          {receipt?.paymentMethod === 'CASH_ON_ARRIVAL' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-left">
              <h4 className="text-amber-800 font-bold mb-2 flex items-center gap-2">⚠️ Reservation Pending Physical Check-in</h4>
              <p className="text-amber-700 text-sm leading-relaxed mb-3">
                You selected <strong>Pay on Arrival</strong>. Please note that this room is <strong className="underline">NOT guaranteed</strong> and may be given to someone else who completes their payment online first. 
              </p>
              <p className="text-amber-800 text-sm font-bold">
                To try to secure it, call the Owner immediately at: <a href={`tel:${hostel.contactPhone}`} className="text-purple-700 underline">{hostel.contactPhone}</a>
              </p>
            </div>
          ) : receipt?.status === 'CONFIRMED' || receipt?.paymentCompleted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-8 text-left">
              <h4 className="text-emerald-800 font-bold mb-2 flex items-center gap-2"><CheckCircle size={18}/> Reservation Finalized</h4>
              <p className="text-emerald-700 text-sm leading-relaxed mb-3">
                Your payment of <strong>UGX {totalAmount.toLocaleString()}</strong> has been verified. A digital receipt has been sent to your email.
              </p>
              <p className="text-emerald-800 text-sm font-bold">
                Hostel Contact: <a href={`tel:${hostel.contactPhone}`} className="text-purple-700 underline">{hostel.contactPhone}</a>
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-left">
              <h4 className="text-amber-800 font-bold mb-2 flex items-center gap-2">⚠️ Finalize Payment</h4>
              <p className="text-amber-700 text-sm leading-relaxed mb-3">
                To guarantee your spot, you must complete your payment of <strong>UGX {totalAmount.toLocaleString()}</strong> via {paymentMethod.replace(/_/g, ' ')}.
              </p>
              <p className="text-amber-800 text-sm font-bold">
                Call the Owner immediately at: <a href={`tel:${hostel.contactPhone}`} className="text-purple-700 underline">{hostel.contactPhone}</a>
              </p>
            </div>
          )}

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
                { id: 'CASH_ON_ARRIVAL', name: 'Pay on Arrival', icon: <Banknote size={20} className="text-emerald-500"/> },
                { id: 'VISA_CARD', name: 'Visa / Mastercard', icon: <CreditCard size={20} className="text-blue-500"/> },
              ].map(method => (
                <label key={method.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === method.id ? 'border-purple-600 bg-purple-50' : 'border-gray-100 hover:border-purple-200'}`}>
                  <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={(e) => {
                    setPaymentMethod(e.target.value);
                    setShowPinPrompt(false);
                    setShowVisaPrompt(false);
                  }} className="w-5 h-5 text-purple-600 focus:ring-purple-600" />
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
                <span>BkonnectHostels Fee</span>
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

            {paymentMethod === 'CASH_ON_ARRIVAL' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 text-sm">
                <span className="font-black flex items-center gap-1 mb-1">⚠️ IMPORTANT WARNING</span>
                Choosing to pay on arrival <strong className="font-bold underline">does not guarantee</strong> your reservation. This room will remain available and may be booked by another student who pays online first. To secure this room immediately, please select Mobile Money or Visa Card.
              </div>
            )}

            {showPinPrompt ? (
              <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200 fade-in">
                <h3 className="font-bold text-lg text-purple-900 mb-2">Simulate Mobile Money</h3>
                <p className="text-sm text-purple-700 mb-4">
                  {paymentMethod === 'MOBILE_MONEY_MTN' ? 'Money will be sent to owner MTN: 0771286134' : 'Money will be sent to owner Airtel: 0756385186'}
                </p>
                
                {paymentStep === 1 && (
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700">Enter your phone number</label>
                    <input 
                      type="text" 
                      className="input-field py-3" 
                      placeholder="e.g. 077XXXXXXX" 
                      value={phoneNumber} 
                      onChange={e => setPhoneNumber(e.target.value)}
                    />
                    <button 
                      onClick={handleSimulatePayment} 
                      disabled={!phoneNumber}
                      className="btn-brand w-full mt-2"
                    >
                      Send PIN Prompt
                    </button>
                    <button onClick={() => setShowPinPrompt(false)} className="w-full text-sm text-gray-500 mt-2 font-bold hover:text-gray-700">Cancel</button>
                  </div>
                )}
                
                {paymentStep === 2 && (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="font-bold text-purple-900">Waiting for PIN...</p>
                    <p className="text-sm text-purple-700 mt-2">Please check your phone ({phoneNumber}) and enter your PIN to approve the UGX {totalAmount.toLocaleString()} deduction.</p>
                  </div>
                )}

                {paymentStep === 3 && (
                  <div className="text-center py-6 fade-in">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={24} />
                    </div>
                    <p className="font-bold text-emerald-800 text-lg">Payment Successful!</p>
                    <p className="text-sm text-emerald-600 mt-1">Confirming your reservation...</p>
                  </div>
                )}
              </div>
            ) : showVisaPrompt ? (
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-blue-900">Card Details</h3>
                  <div className="flex gap-1">
                    <div className="w-8 h-5 bg-blue-600 rounded flex items-center justify-center text-[10px] font-black text-white italic">VISA</div>
                    <div className="w-8 h-5 bg-red-500 rounded flex items-center justify-center text-[10px] font-black text-white">MC</div>
                  </div>
                </div>
                
                {paymentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-600">Cardholder Name</label>
                      <input type="text" className="input-field py-2.5 text-sm" placeholder="John Doe" value={visaDetails.name} onChange={e => setVisaDetails({...visaDetails, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600">Card Number</label>
                      <input type="text" className="input-field py-2.5 text-sm font-mono tracking-widest" placeholder="0000 0000 0000 0000" maxLength="19" value={visaDetails.number} onChange={e => setVisaDetails({...visaDetails, number: e.target.value.replace(/\W/gi, '').replace(/(.{4})/g, '$1 ').trim()})} />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-gray-600">Expiry (MM/YY)</label>
                        <input type="text" className="input-field py-2.5 text-sm font-mono" placeholder="MM/YY" maxLength="5" value={visaDetails.expiry} onChange={e => setVisaDetails({...visaDetails, expiry: e.target.value})} />
                      </div>
                      <div className="w-24">
                        <label className="text-xs font-bold text-gray-600">CVC</label>
                        <input type="text" className="input-field py-2.5 text-sm font-mono" placeholder="123" maxLength="3" value={visaDetails.cvc} onChange={e => setVisaDetails({...visaDetails, cvc: e.target.value})} />
                      </div>
                    </div>
                    
                    <button onClick={handleSimulateVisaPayment} disabled={!visaDetails.number || !visaDetails.expiry || !visaDetails.cvc} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-md shadow-blue-600/30 mt-2 disabled:opacity-50">
                      Pay UGX {totalAmount.toLocaleString()}
                    </button>
                    <button onClick={() => setShowVisaPrompt(false)} className="w-full text-sm text-gray-500 mt-2 font-bold hover:text-gray-700">Cancel</button>
                  </div>
                )}
                
                {paymentStep === 2 && (
                  <div className="text-center py-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="font-bold text-blue-900">Processing Payment...</p>
                    <p className="text-sm text-blue-700 mt-2">Please wait while we securely process your card via the payment gateway.</p>
                  </div>
                )}

                {paymentStep === 3 && (
                  <div className="text-center py-6 fade-in">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={24} />
                    </div>
                    <p className="font-bold text-emerald-800 text-lg">Payment Successful!</p>
                    <p className="text-sm text-emerald-600 mt-1">Transaction approved. Securing your room...</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button 
                  onClick={handleConfirmReservation}
                  disabled={bookMutation.isPending}
                  className="btn-brand w-full py-4 text-lg flex justify-center items-center gap-2 shadow-lg hover:-translate-y-0.5"
                >
                  {bookMutation.isPending ? 'Processing...' : <><ShieldCheck size={20} /> {paymentMethod === 'CASH_ON_ARRIVAL' ? 'Request Reservation' : 'Pay & Confirm Reservation'}</>}
                </button>
                
                <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
                  By confirming, you agree to our Terms of Service and Privacy Policy. The owner will hold this room for 48 hours pending payment.
                </p>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BookingPage;
