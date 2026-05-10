import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import ParticleSphere from '../components/ParticleSphere';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

function getPasswordStrength(password) {
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
    long:      password.length >= 12,
  };
  const score = Object.values(checks).filter(Boolean).length;
  if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: '25%', checks };
  if (score === 3) return { label: 'Fair', color: 'bg-yellow-500', width: '50%', checks };
  if (score === 4) return { label: 'Strong', color: 'bg-blue-500', width: '75%', checks };
  return { label: 'Very Strong', color: 'bg-green-500', width: '100%', checks };
}

const Req = ({ met, label }) => (
  <div className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-400' : 'text-muted-foreground'}`}>
    {met ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
    {label}
  </div>
);

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: email, 2: code+new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [loading, setLoading] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const strength = getPasswordStrength(password);
  const isStrongEnough = strength.checks.length && strength.checks.uppercase && strength.checks.number && strength.checks.special;

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.endsWith('@gmail.com')) { toast.error('Only Gmail addresses are accepted.'); return; }
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      toast.success('Reset code sent! Check your email.');
      if (res.data.dev_code) {
        setDevCode(res.data.dev_code);
        toast(`Dev mode — your code is: ${res.data.dev_code}`, { icon: '🔑', duration: 10000 });
      }
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!isStrongEnough) { toast.error('Please choose a stronger password.'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await axios.post('/api/auth/reset-password', { email, code, password });
      toast.success('Password reset! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <ParticleSphere />

      <button onClick={toggleTheme} className="absolute top-6 right-6 p-3 rounded-full glass-panel hover:bg-white/10 transition-colors z-20">
        {theme === 'dark' ? <Sun className="w-5 h-5 text-nexus-gold" /> : <Moon className="w-5 h-5" />}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 glass-panel rounded-2xl z-10 mx-4"
      >
        <Link to="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-nexus-gold transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <h1 className="text-3xl font-bold mb-1">Reset Password</h1>
              <p className="text-muted-foreground text-sm mb-7">Enter your Gmail and we'll send a reset code.</p>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Gmail Address</label>
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
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-nexus-gold hover:bg-yellow-500 text-black font-semibold rounded-xl transition-colors flex justify-center items-center">
                  {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'Send Reset Code'}
                </button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-3xl font-bold mb-1">Enter Code</h1>
              <p className="text-muted-foreground text-sm mb-7">
                A 6-digit code was sent to <span className="text-nexus-gold">{email}</span>
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                {/* Code Input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Reset Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 bg-transparent border border-white/20 rounded-xl focus:border-nexus-gold focus:ring-1 focus:ring-nexus-gold outline-none transition-all text-center text-2xl font-mono tracking-[1rem]"
                    placeholder="000000"
                    required
                  />
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-transparent border border-white/20 rounded-xl focus:border-nexus-gold focus:ring-1 focus:ring-nexus-gold outline-none transition-all text-sm"
                      placeholder="Strong new password"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.width }} />
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <Req met={strength.checks.length} label="8+ characters" />
                        <Req met={strength.checks.uppercase} label="Uppercase letter" />
                        <Req met={strength.checks.number} label="Number (0-9)" />
                        <Req met={strength.checks.special} label="Special char" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-white/20 rounded-xl focus:border-nexus-gold focus:ring-1 focus:ring-nexus-gold outline-none transition-all text-sm"
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading || !isStrongEnough || password !== confirmPassword || code.length < 6}
                  className="w-full py-3 bg-nexus-gold hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-colors flex justify-center items-center">
                  {loading ? <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : 'Reset Password'}
                </button>

                <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← Wrong email? Go back
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
