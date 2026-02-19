import express from 'express';
import { authenticate } from '../middleware/auth';
import * as categoryController from '../controllers/category.controller';
import * as brandController from '../controllers/brand.controller';

const router = express.Router();

// Categories
router.get('/categories', authenticate, categoryController.getCategories);
router.post('/categories', authenticate, categoryController.createCategory);
router.put('/categories/:id', authenticate, categoryController.updateCategory);
router.delete('/categories/:id', authenticate, categoryController.deleteCategory);

// Brands
router.get('/brands', authenticate, brandController.getBrands);
router.post('/brands', authenticate, brandController.createBrand);

export default router;
