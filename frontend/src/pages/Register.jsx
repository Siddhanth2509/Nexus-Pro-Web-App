import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ParticleSphere from '../components/ParticleSphere';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Lock, Mail, User, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const strength = getPasswordStrength(form.password);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const gmailValid = !form.email || form.email.endsWith('@gmail.com');
  const passwordsMatch = form.password === form.confirmPassword;
  const isStrongEnough = strength.checks.length && strength.checks.uppercase && strength.checks.number && strength.checks.special;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrongEnough) { toast.error('Please use a stronger password.'); return; }
    if (!gmailValid) { toast.error('Only Gmail addresses are accepted.'); return; }
    if (!passwordsMatch) { toast.error('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.confirmPassword);
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
        </form>

        <div className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-nexus-gold hover:underline font-medium">Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
}
