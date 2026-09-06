import { Router } from 'express';
import {
  getRunsheets,
  getRunsheetById,
  createRunsheet,
  updateRunsheet,
  deleteRunsheet,
  addLeg,
  completeRunsheet,
} from '../controllers/runsheetController.js';
import { authGuard } from '../middleware/authGuard.js';
import { recordAudit } from '../middleware/auditLogger.js';

const router = Router();

router.get('/', authGuard, getRunsheets);
router.get('/:id', authGuard, getRunsheetById);
router.post('/', authGuard, recordAudit('CREATE_RUNSHEET', 'runsheet'), createRunsheet);
router.put('/:id', authGuard, recordAudit('UPDATE_RUNSHEET', 'runsheet'), updateRunsheet);
router.delete('/:id', authGuard, recordAudit('DELETE_RUNSHEET', 'runsheet'), deleteRunsheet);
router.post('/:id/legs', authGuard, recordAudit('ADD_LEG', 'runsheet_leg'), addLeg);
router.put('/:id/complete', authGuard, recordAudit('COMPLETE_RUNSHEET', 'runsheet'), completeRunsheet);

export default router;
