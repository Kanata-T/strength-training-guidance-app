import { Router } from 'express';
import TrainingController from '../controllers/trainingController';

const router = Router();
const trainingController = new TrainingController();

// Route to create a training menu
router.post('/menus', trainingController.createTrainingMenu);

// Route to update a training menu
router.put('/menus/:id', trainingController.updateTrainingMenu);

// Route to retrieve a training menu
router.get('/menus/:id', trainingController.getTrainingMenu);

// Route to retrieve all training menus
router.get('/menus', trainingController.getAllTrainingMenus);

export default router;