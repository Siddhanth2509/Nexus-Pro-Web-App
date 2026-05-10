import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ParticleSphere from '../components/ParticleSphere';
import { motion } from 'framer-motion';
import { Moon, Sun, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Login() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPassword, setShow]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const { theme, toggleTheme }     = useTheme();
  const navigate                   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Google One-Tap / Account Picker flow
  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGLoading(true);
      try {
        // Exchange access_token for user info, then send credential to backend
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        // We pass the id_token if available, otherwise use access_token flow
        const res = await axios.post('/api/auth/google-access', {
          access_token: tokenResponse.access_token
        });
        localStorage.setItem('token', res.data.access);
        window.location.href = '/';
      } catch (err) {
        toast.error(err.response?.data?.message || 'Google sign-in failed.');
      } finally {
        setGLoading(false);
      }
    },
    onError: () => toast.error('Google sign-in was cancelled.'),
  });

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <ParticleSphere />

      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full glass-panel hover:bg-white/10 transition-colors z-20"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-nexus-gold" /> : <Moon className="w-5 h-5" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 glass-panel rounded-2xl z-10 mx-4"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-1">Nexus Pro</h1>
          <p className="text-muted-foreground text-sm">Sign in to your command center</p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={() => handleGoogle()}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-white/20 rounded-xl hover:bg-white/5 transition-colors mb-5 disabled:opacity-50"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span className="text-sm font-medium">Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-muted-foreground">or sign in with email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-white/20 rounded-xl focus:border-nexus-gold focus:ring-1 focus:ring-nexus-gold outline-none transition-all text-sm"
                placeholder="you@gmail.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Password</label>
              <Link to="/forgot-password" className="text-xs text-nexus-gold hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-transparent border border-white/20 rounded-xl focus:border-nexus-gold focus:ring-1 focus:ring-nexus-gold outline-none transition-all text-sm"
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShow(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-nexus-gold hover:bg-yellow-500 text-black font-semibold rounded-xl transition-colors flex justify-center items-center"
          >
            {loading
              ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              : 'Sign In'
            }
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="text-nexus-gold hover:underline font-medium">Sign up</Link>
        </div>
      </motion.div>
    </div>
  );
}
