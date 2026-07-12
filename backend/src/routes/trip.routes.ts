import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  dispatchTrip,
  startLoading,
  endLoading,
  startTransit,
  completeTrip,
  cancelTrip
} from '../controllers/trip.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Ensure upload folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'trip-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

const tripUploadFields = upload.fields([
  { name: 'invoice', maxCount: 1 },
  { name: 'challan', maxCount: 1 },
  { name: 'eway_bill', maxCount: 1 },
  { name: 'purchase_order', maxCount: 1 },
  { name: 'other_documents', maxCount: 1 },
  { name: 'proof', maxCount: 1 }
]);

router.use(authenticate);

// List all trips
router.get('/', getTrips);

// Get single trip
router.get('/:id', getTripById);

// Create new trip with attachments
router.post('/', requireRole(['FLEET_MANAGER', 'DRIVER']), tripUploadFields, createTrip);

// Update trip with attachments
router.put('/:id', requireRole(['FLEET_MANAGER', 'DRIVER']), tripUploadFields, updateTrip);

// Dispatch a trip
router.put('/:id/dispatch', requireRole(['FLEET_MANAGER', 'DRIVER']), dispatchTrip);

// Loading timestamps milestones
router.put('/:id/loading/start', requireRole(['FLEET_MANAGER', 'DRIVER']), startLoading);
router.put('/:id/loading/end', requireRole(['FLEET_MANAGER', 'DRIVER']), endLoading);

// Start Transit
router.put('/:id/transit/start', requireRole(['FLEET_MANAGER', 'DRIVER']), startTransit);

// Complete a trip
router.put('/:id/complete', requireRole(['FLEET_MANAGER', 'DRIVER']), upload.single('proof'), completeTrip);

// Cancel a trip
router.put('/:id/cancel', requireRole(['FLEET_MANAGER', 'DRIVER']), cancelTrip);

export default router;
