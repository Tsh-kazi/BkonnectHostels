import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        navigate(redirectUrl);
        return;
      }
      
      if (res.data.user.role === 'OWNER') navigate('/owner');
      else if (res.data.user.role === 'ADMIN') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-content flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-black text-2xl">B</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Welcome back!</h1>
          <p className="text-gray-500 mt-1 text-sm">Log in to your BkonnectHostels account</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-5 text-center font-medium">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="input-field pr-12" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-brand w-full py-3 rounded-xl disabled:opacity-60">
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            No account? <Link to="/signup" className="text-purple-600 font-bold no-underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export const SignupPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'STUDENT', schoolOrUniversity: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/signup', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        navigate(redirectUrl);
        return;
      }
      
      if (res.data.user.role === 'OWNER') navigate('/owner');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-content flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 brand-gradient rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-black text-2xl">B</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Join BkonnectHostels</h1>
          <p className="text-gray-500 mt-1 text-sm">Find your perfect student home today</p>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-5 text-center font-medium">{error}</div>}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            {['STUDENT', 'OWNER'].map(r => (
              <button key={r} onClick={() => setForm({...form, role: r})}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${form.role === r ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500'}`}>
                {r === 'STUDENT' ? '🎓 Student' : '🏠 Owner'}
              </button>
            ))}
          </div>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@email.com" required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="+256 700 000 000" required className="input-field" />
            </div>
            {form.role === 'STUDENT' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">University</label>
                <select name="schoolOrUniversity" value={form.schoolOrUniversity} onChange={handleChange} className="input-field">
                  <option value="">Select University</option>
                  <option>Bugema University</option>
                  <option>Makerere University</option>
                  <option>Kampala International University</option>
                  <option>Uganda Christian University</option>
                  <option>Ndejje University</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required className="input-field" />
            </div>
            <button type="submit" disabled={loading} className="btn-brand w-full py-3 rounded-xl disabled:opacity-60">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          {form.role === 'OWNER' && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3 mt-4 text-center">
              ⚠️ Owner accounts need admin approval before listing hostels.
            </p>
          )}
          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account? <Link to="/login" className="text-purple-600 font-bold no-underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
