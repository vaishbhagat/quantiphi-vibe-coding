import { calculateMifflinBMR, calculateTDEE, generateMacroSplit, BMRParams } from '../utils/helpers';

export type FitnessGoal = 'Weight Loss' | 'Maintenance' | 'Muscle Gain';
export type CarbonRatio = 'balanced' | 'lowCarb' | 'highProtein';

export interface PhysicalProfile extends BMRParams {
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'extreme';
  ratio: CarbonRatio;
  goal: FitnessGoal;
}

export interface Meal {
  id: string;
  food: string;
  weight: number; // weight in grams
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

export interface GoalPreset {
  goal: FitnessGoal;
  targetCalories: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  description: string;
}

// In-Memory User Accounts Storage
export interface UserAccount {
  email: string;
  passwordHash: string;
  currentGoal: FitnessGoal;
  currentProfile: PhysicalProfile;
  meals: Meal[];
}

export const userAccounts: Record<string, UserAccount> = {
  'guest@calorietracker.com': {
    email: 'guest@calorietracker.com',
    passwordHash: 'guest123',
    currentGoal: 'Weight Loss',
    currentProfile: {
      weightKg: 75,
      heightCm: 180,
      age: 28,
      gender: 'male',
      activityLevel: 'moderate',
      ratio: 'balanced',
      goal: 'Weight Loss'
    },
    meals: [
      {
        id: 'seed-1',
        food: 'Grilled Chicken Breast',
        weight: 200,
        calories: 330,
        protein: 62,
        carbs: 0,
        fat: 7,
        timestamp: '08:30 AM'
      },
      {
        id: 'seed-2',
        food: 'Cooked Jasmine Rice',
        weight: 150,
        calories: 195,
        protein: 4,
        carbs: 42,
        fat: 0,
        timestamp: '12:15 PM'
      },
      {
        id: 'seed-3',
        food: 'Whole Large Boiled Eggs',
        weight: 100,
        calories: 155,
        protein: 13,
        carbs: 1,
        fat: 11,
        timestamp: '03:45 PM'
      }
    ]
  }
};

/**
 * Retrieves or registers a user gracefully with default presets to prevent crashes.
 */
export function getUserAccount(email?: string): UserAccount {
  const cleanEmail = (email && email.trim().toLowerCase()) || 'guest@calorietracker.com';
  if (!userAccounts[cleanEmail]) {
    userAccounts[cleanEmail] = {
      email: cleanEmail,
      passwordHash: 'password123',
      currentGoal: 'Weight Loss',
      currentProfile: {
        weightKg: 75,
        heightCm: 180,
        age: 28,
        gender: 'male',
        activityLevel: 'moderate',
        ratio: 'balanced',
        goal: 'Weight Loss'
      },
      meals: []
    };
  }
  return userAccounts[cleanEmail];
}

export class MacroService {
  /**
   * User Signup
   */
  public static registerUser(email: string, passwordHash: string): { success: boolean; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, message: 'Email address cannot be empty.' };
    }
    if (userAccounts[cleanEmail]) {
      return { success: false, message: 'This email is already registered.' };
    }
    userAccounts[cleanEmail] = {
      email: cleanEmail,
      passwordHash,
      currentGoal: 'Weight Loss',
      currentProfile: {
        weightKg: 75,
        heightCm: 180,
        age: 28,
        gender: 'male',
        activityLevel: 'moderate',
        ratio: 'balanced',
        goal: 'Weight Loss'
      },
      meals: []
    };
    return { success: true, message: 'User account registered successfully.' };
  }

  /**
   * User Signin
   */
  public static authenticateUser(email: string, passwordHash: string): { success: boolean; user?: any; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    const account = userAccounts[cleanEmail];
    if (!account) {
      return { success: false, message: 'No registered user found with this email.' };
    }
    if (account.passwordHash !== passwordHash) {
      return { success: false, message: 'Invalid or incorrect password.' };
    }
    return { 
      success: true, 
      message: 'Logged in successfully.',
      user: { email: account.email }
    };
  }

  /**
   * Responds with the Fitness Goal configuration targets catalog
   */
  public static getFitnessGoals(): GoalPreset[] {
    return [
      {
        goal: 'Weight Loss',
        targetCalories: 1800,
        proteinTarget: 140,
        carbsTarget: 160,
        fatTarget: 55,
        description: 'Moderate caloric restriction targeting fat tissue burning while retaining skeletal muscle mass.'
      },
      {
        goal: 'Maintenance',
        targetCalories: 2300,
        proteinTarget: 150,
        carbsTarget: 250,
        fatTarget: 75,
        description: 'Balance calorie intake to preserve exact body weight and athletic consistency.'
      },
      {
        goal: 'Muscle Gain',
        targetCalories: 2800,
        proteinTarget: 175,
        carbsTarget: 320,
        fatTarget: 85,
        description: 'Mild caloric surplus to promote skeletal muscle synthesis paired with heavy weightlifting.'
      }
    ];
  }

  /**
   * Resolves the active goal presets based on currently active fitness goal setting for a specific user
   */
  public static getActivePreset(email?: string): GoalPreset {
    const account = getUserAccount(email);
    const presets = this.getFitnessGoals();
    const match = presets.find(p => p.goal === account.currentGoal);
    return match || presets[0];
  }

  /**
   * Calculates individual metabolic budgets based on physical metrics
   */
  public static calculateMacros(profileInput: Partial<PhysicalProfile>, email?: string) {
    const account = getUserAccount(email);
    
    // Update active profile parameters
    account.currentProfile = {
      ...account.currentProfile,
      ...profileInput
    };

    if (profileInput.goal) {
      account.currentGoal = profileInput.goal;
    }

    const bmr = Math.round(calculateMifflinBMR(account.currentProfile));
    const tdee = Math.round(calculateTDEE(bmr, account.currentProfile.activityLevel));
    
    // Scale target calories dynamically based on Fitness Goal
    let targetCalories = tdee;
    if (account.currentGoal === 'Weight Loss') {
      targetCalories = Math.round(tdee - 500); // 500 kcal deficit
    } else if (account.currentGoal === 'Muscle Gain') {
      targetCalories = Math.round(tdee + 300); // 300 kcal surplus
    }

    // Force lower logical bound for target calories to ensure safety
    if (targetCalories < 1200) {
      targetCalories = 1200;
    }

    const macros = generateMacroSplit(targetCalories, account.currentProfile.ratio);

    return {
      success: true,
      profile: account.currentProfile,
      calculations: {
        bmr,
        tdee,
        targetCalories,
        macros: {
          protein: macros.protein,
          carbs: macros.carbs,
          fat: macros.fat
        }
      }
    };
  }

  /**
   * Appends a meal, validating parameters, scaling values based on food weights, and returns total balance
   */
  public static addMeal(payload: {
    food: string;
    weight: number;
    proteinPer100g?: number;
    carbsPer100g?: number;
    fatPer100g?: number;
    caloriesPer100g?: number;
  }, email?: string): Meal {
    const { food, weight, proteinPer100g, carbsPer100g, fatPer100g, caloriesPer100g } = payload;
    const account = getUserAccount(email);
    
    // Scale parameters proportionally according to food profiles.
    // Base 100g standards for requested predefined list:
    let defaultKcal = 160;
    let defaultP = 15;
    let defaultC = 18;
    let defaultF = 4.5;

    const foodNormalized = food.toLowerCase();
    if (foodNormalized.includes('chicken breast') || foodNormalized.includes('chicken')) {
      defaultKcal = 165; defaultP = 31; defaultC = 0; defaultF = 3.6;
    } else if (foodNormalized.includes('rice')) {
      defaultKcal = 130; defaultP = 2.7; defaultC = 28; defaultF = 0.3;
    } else if (foodNormalized.includes('banana')) {
      defaultKcal = 89; defaultP = 1.1; defaultC = 23; defaultF = 0.3;
    } else if (foodNormalized.includes('egg')) {
      defaultKcal = 155; defaultP = 13; defaultC = 1.1; defaultF = 11;
    } else if (foodNormalized.includes('paneer')) {
      defaultKcal = 265; defaultP = 18; defaultC = 6; defaultF = 21;
    }

    const baseCal = caloriesPer100g ?? defaultKcal; 
    const baseP = proteinPer100g ?? defaultP;
    const baseC = carbsPer100g ?? defaultC;
    const baseF = fatPer100g ?? defaultF;

    // Nutrient Scaling logic: scaledNutrient = (enteredWeight / 100) * nutrientValue
    const multiplier = weight / 100;
    const calories = Math.round(baseCal * multiplier);
    const protein = Math.round(baseP * multiplier);
    const carbs = Math.round(baseC * multiplier);
    const fat = Math.round(baseF * multiplier);

    const newMeal: Meal = {
      id: `meal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      food,
      weight,
      calories,
      protein,
      carbs,
      fat,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    account.meals.push(newMeal);
    return newMeal;
  }

  /**
   * Returns whether a meal was successfully found and deleted
   */
  public static deleteMeal(id: string, email?: string): boolean {
    const account = getUserAccount(email);
    const originalLength = account.meals.length;
    account.meals = account.meals.filter(meal => meal.id !== id);
    return account.meals.length < originalLength;
  }

  /**
   * Compiles the complete aggregate state of digested nutrients, targets, and exceeding alert limits
   */
  public static getDashboard(email?: string) {
    const account = getUserAccount(email);
    const activePreset = this.getActivePreset(email);
    
    // Perform standard calculations if profile has custom targets, or use active goal preset
    const targetCalories = activePreset.targetCalories;
    const proteinTarget = activePreset.proteinTarget;
    const carbsTarget = activePreset.carbsTarget;
    const fatTarget = activePreset.fatTarget;

    // Gather meal nutrition aggregation
    const totalCalories = account.meals.reduce((acc, meal) => acc + meal.calories, 0);
    const totalProtein = account.meals.reduce((acc, meal) => acc + meal.protein, 0);
    const totalCarbs = account.meals.reduce((acc, meal) => acc + meal.carbs, 0);
    const totalFat = account.meals.reduce((acc, meal) => acc + meal.fat, 0);

    const remainingCalories = Math.max(0, targetCalories - totalCalories);
    const isExceeded = totalCalories > targetCalories;

    return {
      currentGoal: account.currentGoal,
      profile: account.currentProfile,
      targets: {
        calories: targetCalories,
        protein: proteinTarget,
        carbs: carbsTarget,
        fat: fatTarget
      },
      consumed: {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat
      },
      status: {
        remainingCalories,
        isExceeded,
        excessCalories: isExceeded ? totalCalories - targetCalories : 0,
        consumedPercentage: Math.round((totalCalories / targetCalories) * 100)
      },
      meals: account.meals
    };
  }

  /**
   * Updates the selected in-memory fitness goal
   */
  public static setFitnessGoal(goal: FitnessGoal, email?: string): void {
    const account = getUserAccount(email);
    if (['Weight Loss', 'Maintenance', 'Muscle Gain'].includes(goal)) {
      account.currentGoal = goal;
    }
  }

  /**
   * Suggests rich structural food options
   */
  public static getFoodSuggestions() {
    return {
      protein: [
        { name: 'Grilled Chicken Breast', protein: 31, carbs: 0, fat: 3.6, calories: 165, size: '100g' },
        { name: 'Egg Whites (Boiled)', protein: 11, carbs: 0.7, fat: 0.2, calories: 52, size: '100g' },
        { name: 'Tuna in Water', protein: 26, carbs: 0, fat: 1, calories: 116, size: '100g' },
        { name: 'Nonfat Greek Yogurt', protein: 10, carbs: 3.6, fat: 0.4, calories: 59, size: '100g' }
      ],
      carbs: [
        { name: 'Cooked Jasmine Rice', protein: 2.7, carbs: 28, fat: 0.3, calories: 130, size: '105'.includes('5') ? 130 : 130, size_lbl: '100g' },
        { name: 'Baked Salmon Fillet', protein: 20, carbs: 0, fat: 13, calories: 208, size: '100g' },
        { name: 'Baked Sweet Potato', protein: 1.6, carbs: 20, fat: 0.1, calories: 86, size: '100g' },
        { name: 'Steel Cut Oats', protein: 13, carbs: 68, fat: 6.5, calories: 375, size: '100g' }
      ],
      fat: [
        { name: 'Avocado (Fresh)', protein: 2, carbs: 8.5, fat: 15, calories: 160, size: '100g' },
        { name: 'Whole Almond Kernels', protein: 21, carbs: 22, fat: 49, calories: 579, size: '100g' },
        { name: 'Raw Chia Seeds', protein: 17, carbs: 42, fat: 31, calories: 486, size: '100g' },
        { name: 'Grass-Fed Butter', protein: 0.9, carbs: 0.1, fat: 81, calories: 717, size: '100g' }
      ]
    };
  }
}
