import { Router } from 'express';
import { 
  getDrivers, 
  getDriverById, 
  createDriver, 
  updateDriver, 
  deleteDriver, 
  addViolation, 
  processPayroll 
} from '../controllers/driver.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { driverUpload } from '../middlewares/driverUpload.middleware';

const router = Router();

router.use(authenticate);

// GET all drivers
router.get('/', getDrivers);

// GET single driver dashboard details
router.get('/:id', getDriverById);

// POST a new driver with uploads - Fleet Manager only
router.post('/', requireRole(['FLEET_MANAGER']), driverUpload, createDriver);

// PUT update a driver details/documents - Fleet Manager or Safety Officer
router.put('/:id', requireRole(['FLEET_MANAGER', 'SAFETY_OFFICER']), driverUpload, updateDriver);

// DELETE a driver - Fleet Manager only
router.delete('/:id', requireRole(['FLEET_MANAGER']), deleteDriver);

// POST safety violation - Fleet Manager or Safety Officer
router.post('/:id/violations', requireRole(['FLEET_MANAGER', 'SAFETY_OFFICER']), addViolation);

// POST payroll record - Fleet Manager or Financial Analyst
router.post('/:id/payroll', requireRole(['FLEET_MANAGER', 'FINANCIAL_ANALYST']), processPayroll);

export default router;
