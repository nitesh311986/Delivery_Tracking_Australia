import { Router } from 'express';
import {
  getKpis,
  getRunsheets,
  getCompanies,
  exportCsv,
  getRunsheetPdf,
  dispatchReport,
} from '../controllers/adminController.js';
import {
  listDrivers,
  createDriver,
  updateDriver,
  deactivateDriver,
} from '../controllers/adminDriverController.js';
import { authGuard } from '../middleware/authGuard.js';
import { recordAudit } from '../middleware/auditLogger.js';

const router = Router();

router.get('/analytics/kpis', authGuard, recordAudit('VIEW_KPIS', 'admin_analytics'), getKpis);
router.get('/drivers', authGuard, recordAudit('LIST_DRIVERS', 'admin_driver'), listDrivers);
router.post('/drivers', authGuard, recordAudit('CREATE_DRIVER', 'admin_driver'), createDriver);
router.put('/drivers/:id', authGuard, recordAudit('UPDATE_DRIVER', 'admin_driver'), updateDriver);
router.delete('/drivers/:id', authGuard, recordAudit('DEACTIVATE_DRIVER', 'admin_driver'), deactivateDriver);
router.get('/companies', authGuard, recordAudit('LIST_COMPANIES', 'admin_company'), getCompanies);
router.get('/runsheets', authGuard, recordAudit('LIST_RUNSHEETS', 'admin_runsheet'), getRunsheets);
router.get('/reports/csv', authGuard, recordAudit('EXPORT_CSV', 'admin_report'), exportCsv);
router.get('/reports/pdf/:id', authGuard, recordAudit('EXPORT_PDF', 'admin_report'), getRunsheetPdf);
router.post(
  '/reports/dispatch-email',
  authGuard,
  recordAudit('DISPATCH_REPORT', 'admin_report'),
  dispatchReport
);

export default router;
