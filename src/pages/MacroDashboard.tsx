import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  Target, 
  Sparkles, 
  Utensils, 
  Trash2, 
  Upload, 
  Plus, 
  AlertTriangle, 
  Info,
  Calendar,
  CheckCircle2,
  Activity,
  ArrowRightLeft,
  ChevronDown,
  Calculator,
  RefreshCw,
  BookOpen,
  HelpCircle,
  FolderOpen,
  Smartphone
} from 'lucide-react';
import { MacroApiService, DashboardState, Meal, PhysicalInput, CalculateResponse, SuggestionsResponse } from '../services/api';
import ProjectStructureOverview from '../components/ProjectStructureOverview';
import StatusIndicator from '../components/StatusIndicator';
import { formatCalories, formatGrams } from '../utils/formatters';
import AuthCard from '../components/AuthCard';

export default function MacroDashboard() {
  const [userEmail, setUserEmail] = useState<string | null>(localStorage.getItem('userEmail'));
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active form state
  const [foodName, setFoodName] = useState('');
  const [foodWeight, setFoodWeight] = useState('');
  const [uploadedImageName, setUploadedImageName] = useState<string | null>(null);
  
  // Custom nutrients checkbox if the user wants custom parameters
  const [useCustomMacros, setUseCustomMacros] = useState(false);
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customCalories, setCustomCalories] = useState('');

  // Warning Modal State
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab selector state for oral viva presentation defense
  const [activeTab, setActiveTab] = useState<'tracker' | 'metabolics'>('tracker');

  // Metabolic calculations sandbox parameters state
  const [params, setParams] = useState<PhysicalInput>({
    weightKg: 75,
    heightCm: 180,
    age: 28,
    gender: 'male',
    activityLevel: 'moderate',
    ratio: 'balanced',
    goal: 'Weight Loss'
  });

  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<CalculateResponse | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Suggestions API endpoint sandbox status
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [foodsData, setFoodsData] = useState<SuggestionsResponse | null>(null);
  const [foodsError, setFoodsError] = useState<string | null>(null);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);
    setCalcError(null);
    try {
      const response = await MacroApiService.calculateMacros(params);
      setCalcResult(response);
    } catch (err: any) {
      setCalcError(err?.message || 'Error communicating with server endpoint');
    } finally {
      setCalculating(false);
    }
  };

  const loadFoods = async () => {
    setLoadingFoods(true);
    setFoodsError(null);
    try {
      const response = await MacroApiService.getSuggestions();
      setFoodsData(response);
    } catch (err: any) {
      setFoodsError(err?.message || 'Error loading recommended whole foods list');
    } finally {
      setLoadingFoods(false);
    }
  };

  // Quick preset healthy options (base stats specified per 100g standard)
  const foodPresets = [
    { name: 'Chicken Breast', weight: 150, p: 31, c: 0, f: 3.6, kcal: 165 },
    { name: 'Rice', weight: 150, p: 2.7, c: 28, f: 0.3, kcal: 130 },
    { name: 'Banana', weight: 120, p: 1.1, c: 23, f: 0.3, kcal: 89 },
    { name: 'Egg', weight: 100, p: 13, c: 1.1, f: 11, kcal: 155 },
    { name: 'Paneer', weight: 100, p: 18, c: 6, f: 21, kcal: 265 }
  ];

  // Load backend dashboard aggregates
  const fetchState = async (selectedGoal?: 'Weight Loss' | 'Maintenance' | 'Muscle Gain') => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const res = await MacroApiService.getDashboard(selectedGoal);
      if (res.success && res.dashboard) {
        const prevExceeded = dashboard?.status?.isExceeded ?? false;
        const newExceeded = res.dashboard.status.isExceeded;
        
        setDashboard(res.dashboard);
        // Only auto-open if budget was newly exceeded
        if (newExceeded && !prevExceeded) {
          setIsWarningModalOpen(true);
        }
      }
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to sync with backend Server APIs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('userEmail');
    setUserEmail(null);
    setDashboard(null);
  };

  useEffect(() => {
    if (userEmail) {
      fetchState();
    }
  }, [userEmail]);

  // Goal toggling updates targets backend-side without wiping logged meals
  const handleGoalToggle = async (goal: 'Weight Loss' | 'Maintenance' | 'Muscle Gain') => {
    try {
      const res = await MacroApiService.getDashboard(goal);
      if (res.success && res.dashboard) {
        setDashboard(res.dashboard);
        if (res.dashboard.status.isExceeded) {
          setIsWarningModalOpen(true);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update goals preset on backend server.');
    }
  };

  // Add meal with automatic calorie/macro scaling handled server-side
  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !foodWeight) return;

    const parsedWeight = parseFloat(foodWeight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) return;

    try {
      const payload: any = {
        food: foodName,
        weight: parsedWeight,
      };

      if (useCustomMacros) {
        if (customProtein) payload.proteinPer100g = parseFloat(customProtein);
        if (customCarbs) payload.carbsPer100g = parseFloat(customCarbs);
        if (customFat) payload.fatPer100g = parseFloat(customFat);
        if (customCalories) payload.caloriesPer100g = parseFloat(customCalories);
      }

      const res = await MacroApiService.addMeal(payload);
      if (res.success && res.dashboard) {
        setDashboard(res.dashboard);
        if (res.dashboard.status.isExceeded) {
          setIsWarningModalOpen(true);
        }
        
        // Reset logging inputs
        setFoodName('');
        setFoodWeight('');
        setCustomProtein('');
        setCustomCarbs('');
        setCustomFat('');
        setCustomCalories('');
        setUseCustomMacros(false);
        setUploadedImageName(null);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to log food entry to server.');
    }
  };

  // Quick select preset logging helper
  const handleSelectPreset = async (preset: typeof foodPresets[0]) => {
    try {
      const res = await MacroApiService.addMeal({
        food: preset.name,
        weight: preset.weight,
        proteinPer100g: preset.p,
        carbsPer100g: preset.c,
        fatPer100g: preset.f,
        caloriesPer100g: preset.kcal
      });
      if (res.success && res.dashboard) {
        setDashboard(res.dashboard);
        if (res.dashboard.status.isExceeded) {
          setIsWarningModalOpen(true);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to log preset item.');
    }
  };

  // Delete logged meal record with real-time updates
  const handleDeleteMeal = async (id: string) => {
    try {
      const res = await MacroApiService.deleteMeal(id);
      if (res.success && res.dashboard) {
        setDashboard(res.dashboard);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete logging record.');
    }
  };

  const handleDummyImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImageName(file.name);
      
      // Randomly select one item from the predefined foodPresets catalog and autofill the tracking form
      const randomItem = foodPresets[Math.floor(Math.random() * foodPresets.length)];
      setFoodName(randomItem.name);
      setFoodWeight(randomItem.weight.toString());
      
      // Force custom nutrient coefficients input fields open with preset standard values
      setUseCustomMacros(true);
      setCustomCalories(randomItem.kcal.toString());
      setCustomProtein(randomItem.p.toString());
      setCustomCarbs(randomItem.c.toString());
      setCustomFat(randomItem.f.toString());
    }
  };

  if (!userEmail) {
    return <AuthCard onAuthSuccess={(email) => setUserEmail(email)} />;
  }

  if (loading && !dashboard) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 animate-spin mb-4">
          <Flame className="h-6 w-6" />
        </div>
        <h2 className="text-sm font-semibold text-slate-800">Synchronizing Dashboard State...</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">Fetching targets, macros, and modern logs from Express backend.</p>
      </div>
    );
  }

  // Fallback defaults if dashboard fails to sync
  const currentGoal = dashboard?.currentGoal || 'Weight Loss';
  const targets = dashboard?.targets || { calories: 1800, protein: 140, carbs: 160, fat: 55 };
  const consumed = dashboard?.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const status = dashboard?.status || { remainingCalories: 1800, isExceeded: false, excessCalories: 0, consumedPercentage: 0 };
  const meals = dashboard?.meals || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      
      {/* 1. Header with dynamic status badge */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-150 animate-pulse">
              <Flame className="h-5.5 w-5.5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                Calorie Tracker & Macro Dashboard
              </h1>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>Active Backend Connection: Connected to Live Engine</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              <span>Logged Today: {meals.length} items</span>
            </div>

            {/* Authenticated user badge and sign out */}
            <div className="flex items-center gap-2 bg-indigo-50/80 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs">
              <span className="font-semibold text-indigo-950 truncate max-w-[150px]">{userEmail}</span>
              <span className="text-slate-300">|</span>
              <button 
                onClick={handleSignOut}
                className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer transition-all"
              >
                Sign Out
              </button>
            </div>

            <button
              onClick={() => setIsWarningModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Demo Exceeded Warning
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Error notification banner if any */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800 font-semibold cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Presentation Switcher - Ideal for viva라운드 / Viva round oral exam */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'tracker'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Activity className="h-4 w-4 text-indigo-500" />
            <span>📊 Daily Tracker Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('metabolics')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'metabolics'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
            }`}
          >
            <Calculator className="h-4 w-4 text-indigo-500" />
            <span>⚙️ Metabolic Sandbox & Blueprint</span>
          </button>
        </div>

        {activeTab === 'tracker' ? (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Goal Adaptor Banner / 2. Fitness Goal Toggle */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-indigo-500" /> Current Fitness Priority
                </h2>
                <p className="text-xs text-slate-500">
                  Adapts caloric budgets & macronutrient ratios. Current settings: <strong className="text-slate-800 font-bold">{currentGoal}</strong>.
                </p>
              </div>

              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                {(['Weight Loss', 'Maintenance', 'Muscle Gain'] as const).map((goal) => {
                  const active = currentGoal === goal;
                  return (
                    <button
                      key={goal}
                      onClick={() => handleGoalToggle(goal)}
                      className={`px-4 sm:px-5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        active 
                          ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Large Top Viewport Horizontal Calorie Budget Progress Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Flame className={`h-4.5 w-4.5 ${status.isExceeded ? 'text-rose-500 animate-bounce' : 'text-emerald-500'}`} />
                    Daily Calorie Budget Status
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {status.isExceeded 
                      ? "Warning: You've exceeded your daily calorie goal limit. Please review meals below." 
                      : "Calming balance. Keep logging meals responsibly to stay within target limits."}
                  </p>
                </div>
                
                <div className="flex items-baseline gap-1.5 self-end sm:self-auto">
                  <span className={`text-lg font-extrabold font-mono ${status.isExceeded ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {consumed.calories}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">/ {targets.calories} kcal consumed</span>
                </div>
              </div>

              {/* Fills with calming green when under budget, instantly turns Crimson Red when over limit */}
              <div className="relative">
                <div className="h-4.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      status.isExceeded 
                        ? 'bg-rose-600' // Crimson Red
                        : 'bg-emerald-500' // Calming Green
                    }`}
                    style={{ width: `${Math.min(100, status.consumedPercentage)}%` }}
                  />
                </div>
                
                {/* Float numeric percentile badge */}
                <span className={`absolute -top-7 right-1 px-2 py-0.5 rounded-md text-[9px] font-bold font-mono border ${
                  status.isExceeded 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {status.consumedPercentage}% Ceilings
                </span>
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-500 font-medium pb-0.5">
                  Remaining Allowance: <strong className={status.isExceeded ? "text-rose-600 font-bold" : "text-slate-800 font-bold"}>
                    {status.isExceeded ? '0' : status.remainingCalories} kcal
                  </strong>
                </span>
                {status.isExceeded && (
                  <span className="text-rose-500 font-extrabold text-xs flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Over by {status.excessCalories} kcal!
                  </span>
                )}
              </div>
            </div>

            {/* Dashboard Grid Container: Top Calorie Progress & Macrometers */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* 3. Top Dashboard (Calorie Circle Progress / Status Panel) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800 text-sm">Today's Calorie Balance</h3>
                  <span className="text-[10px] font-mono font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-120/50">
                    Target: {targets.calories} kcal
                  </span>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-8 py-4">
                  {/* Radial Calorie Progress Bar */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-40 h-40 transform -rotate-90">
                      {/* Background Track Circle */}
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        className="stroke-slate-100"
                        strokeWidth="12"
                        fill="transparent"
                      />
                      {/* Dynamic Progress Indicator */}
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        className={`transition-all duration-500 ${status.isExceeded ? 'stroke-rose-500' : 'stroke-indigo-600'}`}
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 70}
                        strokeDashoffset={2 * Math.PI * 70 * (1 - Math.min(100, status.consumedPercentage) / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    {/* Inside Circle Stats labels */}
                    <div className="absolute text-center">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Remaining</span>
                      <span className={`text-2xl font-bold font-mono tracking-tight ${status.isExceeded ? 'text-rose-600' : 'text-slate-900'}`}>
                        {status.isExceeded ? 0 : status.remainingCalories}
                      </span>
                      <span className="block text-[10px] text-slate-500 font-medium leading-none mt-0.5">kcal</span>
                    </div>
                  </div>

                  {/* Display: Consumed, Remaining, Daily Target */}
                  <div className="w-full space-y-4">
                    <div className="grid grid-cols-3 md:grid-cols-1 gap-3 w-full">
                      
                      {/* Consumed Card */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center shadow-xs">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Consumed</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold font-mono text-slate-800">{consumed.calories}</span>
                          <span className="text-[10px] text-slate-430 font-medium">kcal</span>
                        </div>
                      </div>

                      {/* Remaining Card with alert shift if exceeded */}
                      <div className={`rounded-xl p-3 flex flex-col justify-center border shadow-xs ${
                        status.isExceeded 
                          ? 'bg-rose-50/55 border-rose-100 text-rose-800' 
                          : 'bg-indigo-50/40 border-indigo-100/70 text-indigo-950'
                      }`}>
                        <span className="text-[10px] font-semibold uppercase tracking-wider block mb-0.5">
                          {status.isExceeded ? 'Exceeded By' : 'Remaining'}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-extrabold font-mono">
                            {status.isExceeded ? status.excessCalories : status.remainingCalories}
                          </span>
                          <span className="text-[10px] font-medium">kcal</span>
                        </div>
                      </div>

                      {/* Daily Target Card */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center shadow-xs">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">Daily Target</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold font-mono text-slate-800">{targets.calories}</span>
                          <span className="text-[10px] text-slate-430 font-semibold">kcal limit</span>
                        </div>
                      </div>

                    </div>
                    
                    {/* Dynamically updating detail summary of consumption percentages */}
                    <p className="text-[11px] text-slate-400 leading-relaxed text-center md:text-left">
                      We aggregated your meals records! You consumed <strong className="text-slate-600 font-semibold">{consumed.calories} kcal</strong> or <strong className="text-indigo-600 font-bold">{status.consumedPercentage}%</strong> of the recommended active <strong className="text-slate-700 font-semibold">{currentGoal}</strong> target ceilings.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Macronutrient Dashboard (3 Horizontal Progress Bars) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm mb-1">Macronutrient Summary</h3>
                  <p className="text-xs text-slate-400 mb-6 font-medium">Striking the balanced ratios relative to selected fitness priorities.</p>
                </div>

                <div className="space-y-6">
                  
                  {/* Protein Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-sky-800 flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                        Protein Target
                      </span>
                      <span className="font-mono text-slate-500">
                        <strong className="text-slate-800 font-bold">{consumed.protein}g</strong> / {targets.protein}g
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (consumed.protein / targets.protein) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{Math.round(Math.min(100, (consumed.protein / targets.protein) * 100))}% Completed</span>
                      <span>{Math.max(0, targets.protein - consumed.protein)}g Left</span>
                    </div>
                  </div>

                  {/* Carbs Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-800 flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                        Carbohydrates
                      </span>
                      <span className="font-mono text-slate-500">
                        <strong className="text-slate-800 font-bold">{consumed.carbs}g</strong> / {targets.carbs}g
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (consumed.carbs / targets.carbs) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{Math.round(Math.min(100, (consumed.carbs / targets.carbs) * 100))}% Completed</span>
                      <span>{Math.max(0, targets.carbs - consumed.carbs)}g Left</span>
                    </div>
                  </div>

                  {/* Fats Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                        Fats Budget
                      </span>
                      <span className="font-mono text-slate-500">
                        <strong className="text-slate-800 font-bold">{consumed.fat}g</strong> / {targets.fat}g
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (consumed.fat / targets.fat) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{Math.round(Math.min(100, (consumed.fat / targets.fat) * 100))}% Completed</span>
                      <span>{Math.max(0, targets.fat - consumed.fat)}g Left</span>
                    </div>
                  </div>

                </div>
                
                {/* Split Target details */}
                <div className="mt-5 bg-slate-50 border border-slate-100 rounded-xl p-3 flex justify-around text-center text-[11px]">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Protein</span>
                    <span className="font-bold text-sky-700 font-mono">{(targets.protein * 4)} kcal</span>
                  </div>
                  <div className="border-r border-slate-200 self-stretch my-0.5" />
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Carbohydrates</span>
                    <span className="font-bold text-amber-600 font-mono">{(targets.carbs * 4)} kcal</span>
                  </div>
                  <div className="border-r border-slate-200 self-stretch my-0.5" />
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Fats</span>
                    <span className="font-bold text-emerald-700 font-mono">{(targets.fat * 9)} kcal</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Preset selections log helper */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  Quick Log Wholesome Foods
                </h3>
                <p className="text-xs text-slate-400 font-medium">Click any of these dietary items to log them on the backend instantly.</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {foodPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="group flex flex-col justify-between items-start text-left bg-slate-50 hover:bg-indigo-50/40 border border-slate-200/60 hover:border-indigo-300 rounded-xl p-3.5 transition-all text-xs cursor-pointer shadow-xs"
                    title={`Quick log ${preset.name}`}
                  >
                    <span className="font-semibold text-slate-800 group-hover:text-indigo-950 truncate w-full mb-1">{preset.name}</span>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-[10px] font-bold text-slate-400">{preset.weight}g</span>
                      <span className="text-[10px] text-indigo-650 font-mono font-bold">~{preset.kcal} kcal</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* 5. Food Logging Card */}
            <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-50 text-indigo-600 p-1.5 rounded-lg shrink-0">
                    <Utensils className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">Add New Meal Entry</h3>
                    <p className="text-xs text-slate-400 font-medium">Log custom meals and calculate scaled nutrient densities</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setUseCustomMacros(!useCustomMacros)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-750 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-1.5 rounded-xl border border-indigo-200 transition-all cursor-pointer shadow-xs"
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>{useCustomMacros ? 'General Standard Mode' : 'Specify Custom Coefficients'}</span>
                </button>
              </div>

              <form onSubmit={handleAddMeal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  
                  {/* Food Name input column */}
                  <div className="md:col-span-5 space-y-1.5">
                    <label htmlFor="food-name" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Food Name / Description
                    </label>
                    <input
                      id="food-name"
                      type="text"
                      required
                      value={foodName}
                      onChange={(e) => setFoodName(e.target.value)}
                      placeholder="e.g. Grilled Chicken Breast, Rice..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all text-slate-800"
                    />
                  </div>
                  
                  {/* Weight Input column */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label htmlFor="food-weight" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Ingredient Weight (grams)
                    </label>
                    <div className="relative">
                      <input
                        id="food-weight"
                        type="number"
                        min="1"
                        required
                        value={foodWeight}
                        onChange={(e) => setFoodWeight(e.target.value)}
                        placeholder="e.g. 150"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all text-slate-800 font-mono"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        grams
                      </span>
                    </div>
                  </div>

                  {/* Image Upload Trigger */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Meal Photo
                    </label>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleDummyImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-xs font-semibold text-slate-500 cursor-pointer transition-all ${
                        uploadedImageName 
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700 font-medium' 
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <Upload className="h-4 w-4 shrink-0" />
                      <span className="truncate text-center">
                        {uploadedImageName ? 'Added!' : 'Add Photo'}
                      </span>
                    </button>
                  </div>

                  {/* Add Meal CTA trigger */}
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl py-3 px-4 shadow-sm shadow-indigo-100 hover:shadow transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4 shrink-0" />
                      Add Meal
                    </button>
                  </div>

                </div>

                {/* Custom parameters option toggled */}
                {useCustomMacros && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200/85 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 border-b border-slate-200/50 pb-2 mb-2">
                      <Activity className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Specify Custom Nutrient Coefficients (Value per 100 grams)</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Calories per 100g</label>
                        <input
                          type="number"
                          placeholder="e.g. 165"
                          value={customCalories}
                          onChange={(e) => setCustomCalories(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Protein per 100g</label>
                        <input
                          type="number"
                          placeholder="e.g. 31"
                          value={customProtein}
                          onChange={(e) => setCustomProtein(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Carbs per 100g</label>
                        <input
                          type="number"
                          placeholder="e.g. 0"
                          value={customCarbs}
                          onChange={(e) => setCustomCarbs(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fat per 100g</label>
                        <input
                          type="number"
                          placeholder="e.g. 3.6"
                          value={customFat}
                          onChange={(e) => setCustomFat(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </form>

              {uploadedImageName && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg py-1.5 px-2.5 w-fit">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Image <strong>{uploadedImageName}</strong> successfully selected. Scaling matched in active view program.</span>
                </div>
              )}
            </section>

            {/* 6. Daily History (Meal Table with Live Server data bind) */}
            <section id="history-title" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Review Daily Meals</h3>
                  <p className="text-xs text-slate-400 font-medium">History log detailing professional nutrient scaling</p>
                </div>
                
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                    <span>Active count: <strong>{meals.length} logs</strong></span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="py-3.5 px-6">Food</th>
                      <th className="py-3.5 px-6">Weight</th>
                      <th className="py-3.5 px-6 text-indigo-950">Calories</th>
                      <th className="py-3.5 px-6 text-sky-800">Protein</th>
                      <th className="py-3.5 px-6 text-amber-800">Carbs</th>
                      <th className="py-3.5 px-6 text-emerald-800">Fats</th>
                      <th className="py-3.5 px-6">Logged At</th>
                      <th className="py-3.5 px-6 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {meals.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                          No meals currently logged for today. Specify food options above or try our fast preset selectors!
                        </td>
                      </tr>
                    ) : (
                      meals.map((meal) => (
                        <tr key={meal.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-semibold text-slate-800">
                            {meal.food}
                          </td>
                          <td className="py-4 px-6 font-mono font-medium text-slate-500">
                            {meal.weight}g
                          </td>
                          <td className="py-4 px-6 font-bold font-mono text-slate-800">
                            {meal.calories} kcal
                          </td>
                          <td className="py-4 px-6 font-mono font-semibold text-sky-600">
                            {meal.protein}g
                          </td>
                          <td className="py-4 px-6 font-mono font-semibold text-amber-600">
                            {meal.carbs}g
                          </td>
                          <td className="py-4 px-6 font-mono font-semibold text-emerald-600">
                            {meal.fat}g
                          </td>
                          <td className="py-4 px-6 text-slate-500 font-medium">
                            {meal.timestamp}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => handleDeleteMeal(meal.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
                              title="Delete meal record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 py-4 px-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                <span>Aggregated nutrients logged on today's program:</span>
                <div className="flex gap-4 font-mono font-semibold text-slate-700">
                  <span className="text-indigo-650 bg-indigo-50 px-2.5 py-0.5 rounded-md">Total: {consumed.calories} kcal</span>
                  <span className="text-sky-600 bg-sky-50 px-2.5 py-0.5 rounded-md">Protein: {consumed.protein}g</span>
                  <span className="text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md">Carbs: {consumed.carbs}g</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">Fat: {consumed.fat}g</span>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
            {/* Left columns: calculation details form */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Mifflin-St Jeor sandbox calculator */}
              <div id="metabolic-rates-test" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="border-b border-slate-100 pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
                      <Calculator className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-850 text-sm">Full-Stack Route Sandbox</h3>
                      <p className="text-xs text-slate-500">Submit physical statistics & verify real-time Mifflin-St Jeor endpoint computation</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Parameter details input form */}
                  <form onSubmit={handleCalculate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Weight (kg)</label>
                        <input 
                          type="number" 
                          required
                          min="20"
                          max="250"
                          value={params.weightKg}
                          onChange={(e) => setParams(prev => ({ ...prev, weightKg: Number(e.target.value) }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Height (cm)</label>
                        <input 
                          type="number" 
                          required
                          min="80"
                          max="270"
                          value={params.heightCm}
                          onChange={(e) => setParams(prev => ({ ...prev, heightCm: Number(e.target.value) }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Age (years)</label>
                        <input 
                          type="number" 
                          required
                          min="1"
                          max="120"
                          value={params.age}
                          onChange={(e) => setParams(prev => ({ ...prev, age: Number(e.target.value) }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Gender</label>
                        <select 
                          value={params.gender}
                          onChange={(e) => setParams(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Activity Multiplier</label>
                      <select 
                        value={params.activityLevel}
                        onChange={(e) => setParams(prev => ({ ...prev, activityLevel: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                      >
                        <option value="sedentary">Sedentary (Little to no exercise)</option>
                        <option value="light">Lightly Active (1-3 days/week)</option>
                        <option value="moderate">Moderately Active (3-5 days/week)</option>
                        <option value="active">Very Active (6-7 days/week)</option>
                        <option value="extreme">Extremely Active (Hard physical work)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Macronutrient Target Ratio</label>
                      <select 
                        value={params.ratio}
                        onChange={(e) => setParams(prev => ({ ...prev, ratio: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                      >
                        <option value="balanced">Balanced (30% Protein, 40% Carb, 30% Fat)</option>
                        <option value="lowCarb">Low-Carb Ketogenic (35% Protein, 20% Carb, 45% Fat)</option>
                        <option value="highProtein">Bodybuilding Split (40% Protein, 35% Carb, 25% Fat)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Fitness Goal Target</label>
                      <select 
                        value={params.goal}
                        onChange={(e) => setParams(prev => ({ ...prev, goal: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all"
                      >
                        <option value="Weight Loss">Weight Loss (Caloric Restriction)</option>
                        <option value="Maintenance">Maintenance (Weight Preservation)</option>
                        <option value="Muscle Gain">Muscle Gain (Mild Caloric Surplus)</option>
                      </select>
                    </div>

                    <button 
                      type="submit"
                      disabled={calculating}
                      className="w-full mt-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-md shadow-indigo-100 flex items-center justify-center gap-2"
                    >
                      {calculating ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin text-white" />
                          Processing on Express server...
                        </>
                      ) : (
                        <>
                          <Calculator className="h-3.5 w-3.5" />
                          Execute Full-Stack Route Test
                        </>
                      )}
                    </button>
                  </form>

                  {/* API JSON response display */}
                  <div className="flex flex-col rounded-xl border border-slate-100 bg-slate-50/50 p-4 justify-between min-h-[300px]">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200/50 pb-2 mb-3">
                        Calculation Outputs
                      </h4>
                      
                      {calcError && (
                        <div className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 p-3 rounded-lg">
                          {calcError}
                        </div>
                      )}

                      {!calcResult && !calcError && (
                        <div className="text-xs text-slate-400 italic text-center py-10 flex flex-col items-center justify-center gap-2">
                          <Flame className="h-8 w-8 text-slate-300 animate-pulse" />
                          <span className="max-w-[210px] leading-relaxed">Click "Execute Full-Stack Route Test" to calculate metabolic rate and macros from your Express services.</span>
                        </div>
                      )}

                      {calcResult && calcResult.calculations && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-xl p-3 border border-slate-150 shadow-xs">
                              <span className="block text-[10px] text-slate-400 font-medium uppercase">Basal Metabolic (BMR)</span>
                              <span className="text-sm sm:text-base font-bold text-slate-800 font-mono">
                                {formatCalories(calcResult.calculations.bmr)}
                              </span>
                            </div>
                            <div className="bg-gradient-to-tr from-indigo-50/40 to-white rounded-xl p-3 border border-indigo-100/70 shadow-xs">
                              <span className="block text-[10px] text-indigo-500 font-semibold uppercase">Daily Energy (TDEE)</span>
                              <span className="text-sm sm:text-base font-bold text-indigo-950 font-mono">
                                {formatCalories(calcResult.calculations.tdee)}
                              </span>
                            </div>
                          </div>

                          <div className="bg-gradient-to-tr from-sky-50/20 to-white rounded-xl p-3 border border-sky-100/70 shadow-xs">
                            <span className="block text-[10px] text-sky-600 font-semibold uppercase">Daily Goal Calories</span>
                            <span className="text-sm sm:text-base font-extrabold text-sky-950 font-mono">
                              {formatCalories(calcResult.calculations.targetCalories || calcResult.calculations.tdee)}
                            </span>
                          </div>

                          <div>
                            <span className="block text-[10px] font-semibold text-slate-400 uppercase mb-2">Macro Target Budgets:</span>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-sky-50/50 rounded-lg p-2 text-center border border-sky-100/50">
                                <span className="block text-[9px] text-sky-750 font-semibold">Protein</span>
                                <span className="text-xs font-bold font-mono text-slate-850">
                                  {formatGrams(calcResult.calculations.macros.protein)}
                                </span>
                              </div>
                              <div className="bg-amber-50/50 rounded-lg p-2 text-center border border-amber-100/50">
                                <span className="block text-[9px] text-amber-750 font-semibold">Carbs</span>
                                <span className="text-xs font-bold font-mono text-slate-850">
                                  {formatGrams(calcResult.calculations.macros.carbs)}
                                </span>
                              </div>
                              <div className="bg-emerald-50/50 rounded-lg p-2 text-center border border-emerald-100/50">
                                <span className="block text-[9px] text-emerald-750 font-semibold">Fat</span>
                                <span className="text-xs font-bold font-mono text-slate-850">
                                  {formatGrams(calcResult.calculations.macros.fat)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {calcResult && (
                      <div className="text-[10px] font-mono text-slate-400 border-t border-slate-100/80 pt-2.5 mt-2 flex justify-between">
                        <span>POST: /api/calculate</span>
                        <span className="text-emerald-500 font-bold">200 OK SUCCESS</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Whole foods list API suggestions explorer */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-5 gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
                      <Utensils className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-850 text-sm">Service-Layer Suggestions API</h3>
                      <p className="text-xs text-slate-500">Verify server-side macro food guides database retrieval</p>
                    </div>
                  </div>

                  <button 
                    onClick={loadFoods}
                    disabled={loadingFoods}
                    className="rounded-xl border border-indigo-200 text-indigo-650 px-3.5 py-1.5 text-xs font-semibold hover:bg-indigo-50 disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {loadingFoods ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3 w-3 text-indigo-500" />
                        Fetch Suggestions Database
                      </>
                    )}
                  </button>
                </div>

                {foodsError && (
                  <div className="text-xs text-rose-650 font-medium bg-rose-50 border border-rose-100 p-3 rounded-lg mb-4">
                    {foodsError}
                  </div>
                )}

                {!foodsData && !foodsError && (
                  <div className="text-xs text-slate-400 py-6 text-center leading-relaxed">
                    Click the button to query <code>MacroController.suggestions</code> on Express backend and fetch classified whole food macro ratios dynamically.
                  </div>
                )}

                {foodsData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Protein Column */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-sky-100 pb-1.5">
                        <span className="text-xs font-bold text-sky-800 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-sky-500"></span> Lean Proteins
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">P / C / F</span>
                      </div>
                      <div className="space-y-2">
                        {foodsData.foods.protein.map((food, i) => (
                          <div key={i} className="bg-slate-50/50 rounded-lg p-2.5 border border-slate-100 hover:border-slate-200 transition-all">
                            <span className="block text-xs font-medium text-slate-800 leading-snug">{food.name}</span>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-mono">
                              <span>Size: {food.size}</span>
                              <span className="font-semibold text-slate-700">{food.protein}g / {food.carbs}g / {food.fat}g</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Carbs Column */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-amber-100 pb-1.5">
                        <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-amber-500"></span> Complex Carbs
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">P / C / F</span>
                      </div>
                      <div className="space-y-2">
                        {foodsData.foods.carbs.map((food, i) => (
                          <div key={i} className="bg-slate-50/50 rounded-lg p-2.5 border border-slate-100 hover:border-slate-200 transition-all">
                            <span className="block text-xs font-medium text-slate-800 leading-snug">{food.name}</span>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-mono">
                              <span>Size: {food.size}</span>
                              <span className="font-semibold text-slate-700">{food.protein}g / {food.carbs}g / {food.fat}g</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fats Column */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
                        <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Healthy Fats
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">P / C / F</span>
                      </div>
                      <div className="space-y-2">
                        {foodsData.foods.fat.map((food, i) => (
                          <div key={i} className="bg-slate-50/50 rounded-lg p-2.5 border border-slate-100 hover:border-slate-200 transition-all">
                            <span className="block text-xs font-medium text-slate-800 leading-snug">{food.name}</span>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-mono">
                              <span>Size: {food.size}</span>
                              <span className="font-semibold text-slate-700">{food.protein}g / {food.carbs}g / {food.fat}g</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* File Architecture explorer blueprint */}
              <ProjectStructureOverview />

            </div>

            {/* Right column: Status indicator, help info, NPM commands */}
            <div className="space-y-8">
              
              {/* Telemetry connection health widget */}
              <StatusIndicator />

              {/* viva presentation round key facts */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <BookOpen className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-semibold text-slate-800 text-sm">Viva Response Cheat Sheet</h3>
                </div>
                
                <ul className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                  <li className="flex gap-2">
                    <span className="text-indigo-500 font-bold shrink-0">Q1.</span>
                    <div>
                      <span className="font-bold text-slate-800">How is decoupled logic achieved?</span>
                      <p className="mt-0.5 text-slate-500">Body metrics formulas (Mifflin BMR, TDEE, ratios) reside in pure backend services (<code>helpers.ts</code>/<code>macroService.ts</code>) decoupled completely from presentation DOM elements.</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-500 font-bold shrink-0">Q2.</span>
                    <div>
                      <span className="font-bold text-slate-800">Is state persistent across views?</span>
                      <p className="mt-0.5 text-slate-500">Yes! Client updates (like toggling target priority and logs) update backend models in-memory, reflecting dynamically across all sub-tabs.</p>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-indigo-500 font-bold shrink-0">Q3.</span>
                    <div>
                      <span className="font-bold text-slate-800">How does nutrition scaling operate?</span>
                      <p className="mt-0.5 text-slate-500">The backend dynamically profiles food weights. Entering <code>150g</code> of a food triggers scaled nutrient densities linearly from unit indices (Value * Weight / 100).</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* NPM Script commands */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                  <HelpCircle className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-semibold text-slate-800 text-sm">NPM Scripts reference</h3>
                </div>

                <div className="space-y-3 font-mono text-[11px]">
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <span className="block text-indigo-600 font-bold mb-1">npm run dev</span>
                    <span className="text-slate-500">Boots tsx hot-transpile Express listening to port 3000 alongside Vite static assets.</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <span className="block text-indigo-600 font-bold mb-1">npm run build</span>
                    <span className="text-slate-500 font-sans">Compiles dist assets & bundles TS server into standalone CommonJS cjs.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-16 text-center text-xs text-slate-400">
        <p>© 2026 Calorie Tracker &amp; Macro Dashboard. Crafted with premium design principles linked with live Express Server REST APIs.</p>
      </footer>

      {/* 7. Warning Modal with explicit excess details fetched directly from live endpoints */}
      {isWarningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Blur dimmer */}
          <div 
            onClick={() => setIsWarningModalOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Modal Content container layout */}
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-md w-full z-10 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex flex-col items-center text-center">
              
              {/* Alert Sign */}
              <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 mb-5 shadow-sm">
                <AlertTriangle className="h-7 w-7" />
              </div>

              {/* Title */}
              <h3 className="text-lg sm:text-xl font-bold text-slate-950 tracking-tight leading-snug">
                ⚠️ Daily Budget Exceeded!
              </h3>

              {/* Description body */}
              <p className="mt-2.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Your total logged intakes have surpassed the allocated calorie budget for your <strong className="text-slate-700 font-semibold">{currentGoal}</strong> program. Please adjust your next meals.
              </p>

              {/* Aggregated alert metrics */}
              <div className="w-full mt-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Assigned Budget:</span>
                  <span className="font-semibold text-slate-705">{targets.calories} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Logged Consumed:</span>
                  <span className="font-semibold text-rose-650">{consumed.calories} kcal</span>
                </div>
                <div className="border-t border-slate-200/50 pt-2 flex justify-between">
                  <span className="text-slate-500 font-bold">Excess Balance:</span>
                  <span className="font-extrabold text-rose-500">
                    {Math.max(0, consumed.calories - targets.calories)} kcal over
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
                
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsWarningModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-250 py-2.5 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer order-2 sm:order-1"
                >
                  Close
                </button>

                {/* Review Meals Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsWarningModalOpen(false);
                    // scroll into history table
                    document.getElementById('history-title')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex-1 rounded-xl bg-indigo-600 py-2.5 px-4 text-xs font-semibold text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-md shadow-indigo-100 hover:shadow order-1 sm:order-2"
                >
                  Review Meals
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
