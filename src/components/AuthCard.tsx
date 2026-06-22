import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, 
  LogIn, 
  UserPlus, 
  Mail, 
  Key, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Lock
} from 'lucide-react';
import { MacroApiService } from '../services/api';

interface AuthCardProps {
  onAuthSuccess: (email: string) => void;
}

export default function AuthCard({ onAuthSuccess }: AuthCardProps) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // States for actions
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('Please supply both email address and password inputs.');
      return;
    }

    if (!isLoginTab && password !== confirmPassword) {
      setErrorMsg('Confirm password field must match the specified password.');
      return;
    }

    setLoading(true);
    try {
      if (isLoginTab) {
        // Sign In
        const res = await MacroApiService.signin(trimmedEmail, password);
        if (res.success && res.user) {
          localStorage.setItem('userEmail', res.user.email);
          setSuccessMsg('Successfully identified! Loading calorie metrics...');
          setTimeout(() => {
            onAuthSuccess(res.user!.email);
          }, 800);
        } else {
          setErrorMsg(res.message || 'Verification failed.');
        }
      } else {
        // Sign Up
        const res = await MacroApiService.signup(trimmedEmail, password);
        if (res.success) {
          setSuccessMsg('Registered successfully! Auto-logging you in...');
          // Proceed automatically
          localStorage.setItem('userEmail', trimmedEmail);
          setTimeout(() => {
            onAuthSuccess(trimmedEmail);
          }, 800);
        } else {
          setErrorMsg(res.message || 'Registration failed.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Server connection timed out. Please check your back-end runtime.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEntry = () => {
    localStorage.setItem('userEmail', 'guest@calorietracker.com');
    onAuthSuccess('guest@calorietracker.com');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div 
        id="auth-container"
        className="w-full max-w-4xl bg-white shadow-xl rounded-3xl overflow-hidden border border-slate-200 grid grid-cols-1 md:grid-cols-12 min-h-[550px]"
      >
        {/* Left Side: Glorious Branding Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-500 to-indigo-700 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Accent decoration overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

          {/* Logo Brand */}
          <div className="relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-white/12 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-6">
              <Flame className="h-6 w-6 text-amber-300 fill-amber-300" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">MacroScale</h2>
            <p className="text-xs text-indigo-100 mt-1 font-medium select-none">DAILY METABOLIC COMPANION PANEL</p>
          </div>

          {/* Visual Quotes / Bullet features */}
          <div className="relative z-10 space-y-6 my-10">
            <blockquote className="text-sm italic font-medium leading-relaxed text-indigo-50">
              "Fuel your physical engine with mathematical precision. Calculate, track, and reach your goals safely."
            </blockquote>
            
            <div className="space-y-3.5 pt-4">
              <div className="flex items-center gap-3 text-xs font-semibold">
                <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span>Strict Calorie Budgets</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span>Macronutrient (Protein/Carb/Fat) Ratios</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <div className="h-5 w-5 rounded-full bg-white/10 flex items-center justify-center text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span>Real-Time Intake Limit Warning Modal</span>
              </div>
            </div>
          </div>

          {/* Support Footnotes */}
          <div className="relative z-10 flex items-center gap-2 text-[10px] text-indigo-200 font-mono select-none">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Secure In-Memory Multi-User Engine</span>
          </div>
        </div>

        {/* Right Side: Tabbed Interactive Authentication Form */}
        <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
          
          {/* Header Title */}
          <div className="mb-6 text-center md:text-left">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isLoginTab ? 'Welcome Back!' : 'Start Your Food Diary'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isLoginTab ? 'Log in to sync your nutrition goals.' : 'Create an account to track custom programs.'}
            </p>
          </div>

          {/* Form Tabs Button Selectors */}
          <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 mb-6">
            <button
              onClick={() => {
                setIsLoginTab(true);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isLoginTab 
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </button>
            <button
              onClick={() => {
                setIsLoginTab(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !isLoginTab 
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Sign Up
            </button>
          </div>

          {/* Warning Banner / Success Response Info */}
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs mb-5 flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 rounded-xl p-3 text-xs mb-5 flex items-start gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Standard Form Inputs */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Preferred password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 transition-all outline-none"
                />
              </div>
            </div>

            {/* Confirm Password (only on Sign Up context) */}
            {!isLoginTab && (
              <div className="animate-in fade-in slide-in-from-top-3 duration-200">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Verify password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 transition-all outline-none"
                  />
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer mt-5 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLoginTab ? 'Verify & Continue' : 'Create Custom Account'}</span>
                  <ArrowRight className="h-4 w-4 text-indigo-200" />
                </>
              )}
            </button>
          </form>

          {/* Elegant Divider */}
          <div className="relative my-6 select-none">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-150" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-350 bg-white px-3 font-mono">
              OR EXPLORE DIRECTLY
            </div>
          </div>

          {/* Guest demo button */}
          <button
            type="button"
            onClick={handleGuestEntry}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-250 font-bold rounded-xl text-xs transition-all cursor-pointer text-center"
          >
            🔥 Continue to Dashboard as Guest →
          </button>

          {/* Note details */}
          <p className="text-[10px] text-slate-400 mt-6 text-center font-medium">
            *No secure server passwords are collected; they are hashed in-memory solely for this preview sandbox logic session.
          </p>

        </div>
      </div>
    </div>
  );
}
