/**
 * Back-end utility helpers for the Calorie Tracker & Macro Dashboard.
 */

export interface BMRParams {
  weightKg: number; // in kg
  heightCm: number; // in cm
  age: number;      // in years
  gender: 'male' | 'female';
}

/**
 * Calculates Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
 */
export function calculateMifflinBMR(params: BMRParams): number {
  const { weightKg, heightCm, age, gender } = params;
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  return gender === 'male' ? base + 5 : base - 161;
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) based on activity multiplier
 */
export function calculateTDEE(bmr: number, activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'extreme'): number {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    extreme: 1.9,
  };
  return Math.round(bmr * (multipliers[activityLevel] || 1.2));
}

/**
 * Suggests macronutrient breakdown (in grams and kcal) for a target calorie goal and fitness goal.
 */
export function generateMacroSplit(
  targetCalories: number, 
  ratio: 'balanced' | 'lowCarb' | 'highProtein'
): { protein: number; carbs: number; fat: number } {
  // Ratios out of 100% (protein, carb, fat)
  const splits = {
    balanced: { p: 0.30, c: 0.40, f: 0.30 },
    lowCarb: { p: 0.35, c: 0.20, f: 0.45 },
    highProtein: { p: 0.40, c: 0.35, f: 0.25 },
  };

  const selected = splits[ratio] || splits.balanced;

  // 1g Protein = 4 kcal, 1g Carb = 4 kcal, 1g Fat = 9 kcal
  const proteinGrams = Math.round((targetCalories * selected.p) / 4);
  const carbsGrams = Math.round((targetCalories * selected.c) / 4);
  const fatGrams = Math.round((targetCalories * selected.f) / 9);

  return {
    protein: proteinGrams,
    carbs: carbsGrams,
    fat: fatGrams,
  };
}
