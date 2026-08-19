import { Router } from 'express';

import healthRoutes from './health.routes.js';
import noteRoutes from './note.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/notes', noteRoutes);

export default router;
