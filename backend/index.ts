import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const app = express();
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'TransitOps API is running' });
});

import authRoutes from './src/routes/auth.routes';
import vehicleRoutes from './src/routes/vehicle.routes';
import driverRoutes from './src/routes/driver.routes';
import tripRoutes from './src/routes/trip.routes';
import maintenanceRoutes from './src/routes/maintenance.routes';
import fuelRoutes from './src/routes/fuel.routes';
import dashboardRoutes from './src/routes/dashboard.routes';

// Setup auth routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// Export prisma client so we can use it in other modules
export { prisma };
