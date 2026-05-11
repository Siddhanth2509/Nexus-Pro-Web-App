import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ParticleSphere from '../components/ParticleSphere';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Lock, Mail, User, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import axios from 'axios';

// Password strength checker
function getPasswordStrength(password) {
  let score = 0;
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
    long:      password.length >= 12,
  };
  score = Object.values(checks).filter(Boolean).length;
  if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4', checks };
  if (score === 3) return { label: 'Fair', color: 'bg-yellow-500', width: 'w-2/4', checks };
  if (score === 4) return { label: 'Strong', color: 'bg-blue-500', width: 'w-3/4', checks };
  return { label: 'Very Strong', color: 'bg-green-500', width: 'w-full', checks };
}

const Req = ({ met, label }) => (
  <div className={`flex items-center gap-1.5 text-xs transition-colors ${met ? 'text-green-400' : 'text-muted-foreground'}`}>
    {met ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {label}
  </div>
);

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'member', adminSecret: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const [googleLoading, setGLoading] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const googleClientIdRaw = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const googleClientId = googleClientIdRaw.includes('YOUR_GOOGLE_CLIENT_ID') ? '' : googleClientIdRaw;
  const isGoogleEnabled = Boolean(googleClientId);

  const strength = getPasswordStrength(form.password);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const gmailValid = !form.email || form.email.endsWith('@gmail.com');
  const passwordsMatch = form.password === form.confirmPassword;
  const isStrongEnough = strength.checks.length && strength.checks.uppercase && strength.checks.number && strength.checks.special;

  // Google Sign Up flow
  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGLoading(true);
      try {
        await loginWithGoogle({ accessToken: tokenResponse.access_token });
        toast.success('Signed up with Google!');
        navigate('/');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Google sign-up failed.');
      } finally {
        setGLoading(false);
      }
    },
    onError: () => toast.error('Google sign-up was cancelled.'),
  });

  const handleGoogleClick = () => {
    if (!isGoogleEnabled) {
      toast.error('Google sign-up is not configured. Missing VITE_GOOGLE_CLIENT_ID.');
      return;
    }
    handleGoogle();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrongEnough) { toast.error('Please use a stronger password.'); return; }
    if (!gmailValid) { toast.error('Only Gmail addresses are accepted.'); return; }
    if (!passwordsMatch) { toast.error('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.confirmPassword, form.role, form.adminSecret);
      toast.success('Account created! Welcome to Nexus Pro.');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden py-10">
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
        <div className="text-center mb-7">
          <h1 className="text-4xl font-bold mb-1">Join Nexus</h1>
          <p className="text-muted-foreground text-sm">Create your command center account</p>
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-white/20 rounded-xl focus:border-nexus-gold focus:ring-1 focus:ring-nexus-gold outline-none transition-all text-sm"
                placeholder="Siddhanth"
                required
              />
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Role</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="role" value="member" checked={form.role === 'member'} onChange={handleChange} className="accent-nexus-gold" />
                Member
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="role" value="admin" checked={form.role === 'admin'} onChange={handleChange} className="accent-nexus-gold" />
                Admin
              </label>
            </div>
          </div>

          {/* Admin Secret Key */}
          <AnimatePresence>
            {form.role === 'admin' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1.5 overflow-hidden"
              >
                <label className="text-sm font-medium">Admin Secret Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    name="adminSecret"
                    type="password"
                    value={form.adminSecret}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-white/20 rounded-xl focus:border-nexus-gold focus:ring-1 focus:ring-nexus-gold outline-none transition-all text-sm"
                    placeholder="Enter the secret key"
                    required={form.role === 'admin'}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email — Gmail only */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email <span className="text-xs text-muted-foreground">(Gmail only)</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2.5 bg-transparent border rounded-xl focus:ring-1 outline-none transition-all text-sm
                  ${touched.email && !gmailValid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-white/20 focus:border-nexus-gold focus:ring-nexus-gold'}`}
                placeholder="you@gmail.com"
                required
              />
            </div>
            <AnimatePresence>
              {touched.email && !gmailValid && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Only Gmail addresses are accepted
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-2.5 bg-transparent border border-white/20 rounded-xl focus:border-nexus-gold focus:ring-1 focus:ring-nexus-gold outline-none transition-all text-sm"
                placeholder="Min 8 chars, uppercase, number, symbol"
                required
              />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength bar */}
            {form.password && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Strength</span>
                  <span className={`font-medium ${
                    strength.label === 'Weak' ? 'text-red-400' :
                    strength.label === 'Fair' ? 'text-yellow-400' :
                    strength.label === 'Strong' ? 'text-blue-400' : 'text-green-400'
                  }`}>{strength.label}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${strength.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: strength.width.replace('w-', '').replace('full', '100%').replace('1/4', '25%').replace('2/4', '50%').replace('3/4', '75%') }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                  <Req met={strength.checks.length} label="8+ characters" />
                  <Req met={strength.checks.uppercase} label="Uppercase letter" />
                  <Req met={strength.checks.number} label="Number (0-9)" />
                  <Req met={strength.checks.special} label="Special char (!@#$)" />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                className={`w-full pl-10 pr-10 py-2.5 bg-transparent border rounded-xl focus:ring-1 outline-none transition-all text-sm
                  ${touched.confirmPassword && form.confirmPassword && !passwordsMatch
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : touched.confirmPassword && passwordsMatch && form.confirmPassword
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                    : 'border-white/20 focus:border-nexus-gold focus:ring-nexus-gold'}`}
                placeholder="Re-enter your password"
                required
              />
              <button type="button" onClick={() => setShowConfirm(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <AnimatePresence>
              {touched.confirmPassword && form.confirmPassword && !passwordsMatch && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-400 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Passwords do not match
                </motion.p>
              )}
              {touched.confirmPassword && form.confirmPassword && passwordsMatch && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <button
            type="submit"
            disabled={loading || !isStrongEnough || !gmailValid || !passwordsMatch}
            className="w-full py-3 px-4 bg-nexus-gold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-colors flex justify-center items-center mt-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'Create Account'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-muted-foreground">or sign up with Google</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={googleLoading || !isGoogleEnabled}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-white/20 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
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
            <span className="text-sm font-medium">Sign up with Google</span>
          </button>

          {!isGoogleEnabled && (
            <p className="text-xs text-amber-400 text-center">
              Google sign-up is disabled until VITE_GOOGLE_CLIENT_ID is set.
            </p>
          )}
        </form>

        <div className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-nexus-gold hover:underline font-medium">Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
