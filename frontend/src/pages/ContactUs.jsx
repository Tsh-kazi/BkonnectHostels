import React from 'react';
import { Mail, Phone, MapPin, Instagram, Linkedin, Twitter, MessageCircle } from 'lucide-react';

const ContactUs = () => {
  return (
    <div className="page-content bg-gray-50 pb-20">
      
      {/* HEADER SECTION */}
      <div className="bg-purple-900 text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('/images/extra-demo-1.jpg')] bg-cover bg-center"></div>
        
        {/* Decorative Blobs */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float-delayed"></div>

        <div className="max-w-4xl mx-auto relative z-10 text-center fade-in">
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200">
            Let's Connect.
          </h1>
          <p className="text-lg md:text-xl text-purple-100/90 max-w-2xl mx-auto font-medium">
            Have a question about a hostel or need support with your booking? The BkonnectHomes team is always here to help you out.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Direct Support Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 flex flex-col items-center text-center fade-in opacity-0 card-hover" style={{animationDelay: '100ms'}}>
            <div className="w-20 h-20 bg-[#25D366]/10 text-[#25D366] rounded-2xl flex items-center justify-center mb-6 rotate-3 hover:rotate-0 transition-all duration-300">
              <MessageCircle size={36} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">WhatsApp Support</h2>
            <p className="text-gray-500 text-base mb-8 flex-grow leading-relaxed">
              Fastest response times. Chat with our support team instantly on WhatsApp.
            </p>
            <a href="https://api.whatsapp.com/message/7Q7EN2GLMHNDO1?autoload=1&app_absent=0" target="_blank" rel="noreferrer" className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-[#25D366]/30 flex items-center justify-center gap-2 hover:-translate-y-1">
              <MessageCircle size={22} /> WhatsApp Us
            </a>
          </div>

          {/* Call Us Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 flex flex-col items-center text-center fade-in opacity-0 card-hover" style={{animationDelay: '200ms'}}>
            <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 -rotate-3 hover:rotate-0 transition-all duration-300">
              <Phone size={36} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Call Us directly</h2>
            <p className="text-gray-500 text-base mb-8 flex-grow leading-relaxed">
              Prefer to hear a human voice? Give us a ring during business hours.
            </p>
            <a href="tel:+256756385186" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 hover:-translate-y-1">
              <Phone size={22} /> 0756385186
            </a>
          </div>

          {/* Email Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 flex flex-col items-center text-center fade-in opacity-0 card-hover" style={{animationDelay: '300ms'}}>
            <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center mb-6 rotate-3 hover:rotate-0 transition-all duration-300">
              <Mail size={36} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Email Support</h2>
            <p className="text-gray-500 text-base mb-8 flex-grow leading-relaxed">
              For partnership inquiries, owner registrations, and general questions.
            </p>
            <a href="mailto:support@bkonnecthomes.com" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 hover:-translate-y-1">
              <Mail size={22} /> Email Us
            </a>
          </div>

        </div>

        {/* SOCIAL MEDIA & OFFICE */}
        <div className="mt-16 bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col md:flex-row fade-in opacity-0" style={{animationDelay: '400ms'}}>
          
          <div className="md:w-1/2 p-10 md:p-14">
            <h2 className="text-3xl font-black text-gray-900 mb-8 tracking-tight">Connect on Socials</h2>
            <div className="space-y-4">
              <a href="#" className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-purple-50 transition group no-underline">
                <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition">
                  <Instagram size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Instagram</h3>
                  <p className="text-sm text-gray-500">@bkonnecthomes</p>
                </div>
              </a>

              <a href="#" className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 transition group no-underline">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                  <Linkedin size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">LinkedIn</h3>
                  <p className="text-sm text-gray-500">BkonnectHomes LLC</p>
                </div>
              </a>

              <a href="#" className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-black/5 transition group no-underline">
                <div className="w-12 h-12 bg-gray-200 text-gray-800 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition">
                  <Twitter size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">X (Twitter)</h3>
                  <p className="text-sm text-gray-500">@bkonnect_ug</p>
                </div>
              </a>
            </div>
          </div>

          <div className="md:w-1/2 bg-gray-900 text-white p-10 md:p-14 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('/images/extra-demo-2.jpg')] bg-cover mix-blend-overlay"></div>
            
            {/* Animated Glow in map area */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-600 rounded-full mix-blend-screen filter blur-[80px] opacity-40 animate-float"></div>
            <div className="relative z-10 w-full h-full flex flex-col">
              <h2 className="text-2xl font-bold mb-6">Our Office</h2>
              <div className="flex items-start gap-4 mb-6">
                <MapPin className="text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-bold text-lg mb-1">Bugema University Main Gate</p>
                  <p className="text-gray-400 leading-relaxed text-sm">
                    Gayaza-Zirobwe Road<br/>
                    P.O Box 6529 Kampala, Uganda
                  </p>
                </div>
              </div>
              
              {/* GOOGLE MAPS EMBED */}
              <div className="w-full flex-grow min-h-[250px] rounded-2xl overflow-hidden border border-gray-700/50 shadow-inner mb-4">
                <iframe 
                  title="BkonnectHomes Office Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15957.511847585507!2d32.63717281084221!3d0.5739815049389279!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x177c6e08c8bdbe35%3A0xc622d103323dc40e!2sBugema%20University!5e0!3m2!1sen!2sug!4v1715053702123!5m2!1sen!2sug" 
                  className="w-full h-full border-0" 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
              
              <p className="text-gray-400 text-sm">
                *Office hours: Monday to Friday, 9:00 AM - 5:00 PM (EAT).
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactUs;
