import { Router } from 'express';

import * as noteController from '../controllers/note.controller.js';

const router = Router();

router.get('/', noteController.list);
router.post('/', noteController.create);
router.get('/:id', noteController.getById);
router.put('/:id', noteController.update);
router.delete('/:id', noteController.remove);

export default router;
