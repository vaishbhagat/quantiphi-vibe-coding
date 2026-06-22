import { Router } from 'express';
import { MacroController } from '../controllers/macroController';

const router = Router();

// Authentication endpoints
router.post('/auth/signup', MacroController.signup);
router.post('/auth/signin', MacroController.signin);

// Retrieve all fitness goals and default presets catalog: GET /api/goals
router.get('/goals', MacroController.getGoals);

// Compute macro split allocations dynamically: POST /api/calculate
router.post('/calculate', MacroController.compute);

// Add a meal to daily log: POST /api/addMeal
router.post('/addMeal', MacroController.addMeal);

// Delete logged meal: DELETE /api/deleteMeal/:id
router.delete('/deleteMeal/:id', MacroController.deleteMeal);

// Retrieve aggregated calculation targets and daily logs list: GET /api/dashboard
router.get('/dashboard', MacroController.getDashboard);

// Retrieve predefined whole food suggestions database: GET /api/suggestions
router.get('/suggestions', MacroController.suggestions);

// Retrieve system health check info: GET /api/health
router.get('/health', MacroController.health);

export default router;
