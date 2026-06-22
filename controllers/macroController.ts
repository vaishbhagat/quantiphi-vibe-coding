import { Request, Response } from 'express';
import { MacroService, FitnessGoal, PhysicalProfile } from '../services/macroService';

export class MacroController {
  /**
   * POST /api/auth/signup
   * Register a new user
   */
  public static signup(req: Request, res: Response): void {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required.' });
        return;
      }
      const result = MacroService.registerUser(email, password);
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Failed to complete registration' });
    }
  }

  /**
   * POST /api/auth/signin
   * Log in an existing user
   */
  public static signin(req: Request, res: Response): void {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email and password are required.' });
        return;
      }
      const result = MacroService.authenticateUser(email, password);
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Failed to authenticate user.' });
    }
  }

  /**
   * GET /api/goals
   * Responds with target calorie & macro allocations for fitness targets list
   */
  public static getGoals(req: Request, res: Response): void {
    try {
      const goals = MacroService.getFitnessGoals();
      res.json({ success: true, goals });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Failed to fetch goal configurations' });
    }
  }

  /**
   * POST /api/calculate
   * Physical stats calculation based on Mifflin-St Jeor formula, dynamically scaling target calorie levels
   */
  public static compute(req: Request, res: Response): void {
    try {
      const userEmail = req.headers['x-user-email'] as string | undefined;
      const { 
        weightKg, 
        heightCm, 
        age, 
        gender, 
        activityLevel, 
        ratio,
        goal
      } = req.body;

      if (!weightKg || !heightCm || !age || !gender || !activityLevel || !ratio || !goal) {
        res.status(400).json({ 
          success: false,
          error: 'Missing required parameters: weightKg, heightCm, age, gender, activityLevel, ratio, and goal are required.' 
        });
        return;
      }

      const input: Partial<PhysicalProfile> = {
        weightKg: Number(weightKg),
        heightCm: Number(heightCm),
        age: Number(age),
        gender: gender === 'male' ? 'male' : 'female',
        activityLevel: activityLevel,
        ratio: ratio,
        goal: goal as FitnessGoal
      };

      const result = MacroService.calculateMacros(input, userEmail);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Error occurred during metabolic estimation' });
    }
  }

  /**
   * POST /api/addMeal
   * Scales nutritional details based on food weights, appends card meal to dashboard log, and returns summary
   */
  public static addMeal(req: Request, res: Response): void {
    try {
      const userEmail = req.headers['x-user-email'] as string | undefined;
      const { food, weight, proteinPer100g, carbsPer100g, fatPer100g, caloriesPer100g } = req.body;

      if (!food || !weight) {
        res.status(400).json({ 
          success: false, 
          error: 'Required inputs "food" (string) and "weight" (number in grams) are missing.' 
        });
        return;
      }

      const parsedWeight = parseFloat(weight);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        res.status(400).json({ 
          success: false, 
          error: 'Ingredient weight must be a positive numeric value.' 
        });
        return;
      }

      const meal = MacroService.addMeal({
        food,
        weight: parsedWeight,
        proteinPer100g: proteinPer105g(proteinPer100g),
        carbsPer100g: carbsPer100g ? parseFloat(carbsPer100g) : undefined,
        fatPer100g: fatPer100g ? parseFloat(fatPer100g) : undefined,
        caloriesPer100g: caloriesPer100g ? parseFloat(caloriesPer100g) : undefined
      }, userEmail);

      // Fetch dynamic updated dashboard state
      const dashboard = MacroService.getDashboard(userEmail);

      res.status(201).json({
        success: true,
        message: 'Meal successfully logged.',
        meal,
        dashboard
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Failed to register meal entry' });
    }
  }

  /**
   * DELETE /api/deleteMeal/:id
   * Removes meal from active index list and returns updated dashboard aggregates
   */
  public static deleteMeal(req: Request, res: Response): void {
    try {
      const userEmail = req.headers['x-user-email'] as string | undefined;
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ success: false, error: 'Target ID is required to prune meal history.' });
        return;
      }

      const didDelete = MacroService.deleteMeal(id, userEmail);

      if (!didDelete) {
        res.status(404).json({ success: false, error: 'Target meal entry was not found in active log list.' });
        return;
      }

      const dashboard = MacroService.getDashboard(userEmail);

      res.json({
        success: true,
        message: 'Meal was successfully deleted from daily history log.',
        dashboard
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Error occurred during item deletion' });
    }
  }

  /**
   * GET /api/dashboard
   * Summarizes all active calculations, targets, nutrient aggregates, remaining calories, and exceeding limits
   */
  public static getDashboard(req: Request, res: Response): void {
    try {
      const userEmail = req.headers['x-user-email'] as string | undefined;
      
      // Optional query param to switch current active goal before fetching state
      const { goal } = req.query;
      if (goal) {
        MacroService.setFitnessGoal(goal as FitnessGoal, userEmail);
      }

      const dashboard = MacroService.getDashboard(userEmail);
      res.json({ success: true, dashboard });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Failed to aggregate dashboard state values' });
    }
  }

  /**
   * GET /api/suggestions
   * Responds with the custom list of whole food suggestion preset categories
   */
  public static suggestions(req: Request, res: Response): void {
    try {
      const foods = MacroService.getFoodSuggestions();
      res.json({ success: true, foods });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Failed to retrieve food suggestions database' });
    }
  }

  /**
   * GET /api/health
   * Dynamic JSON system health responder
   */
  public static health(req: Request, res: Response): void {
    try {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Macro Scale API Engine'
      });
    } catch (error: any) {
      res.status(500).json({ status: 'unstable', error: error?.message });
    }
  }
}

function proteinPer105g(val: any): number | undefined {
  return val ? parseFloat(val) : undefined;
}
