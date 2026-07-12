import { Request, Response } from 'express';
import { prisma } from '../../index';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Helper to remove old uploaded files
const removeFile = (relativePath: string) => {
  if (!relativePath) return;
  const fullPath = path.join(__dirname, '../../', relativePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.error(`Failed to delete driver file: ${fullPath}`, err);
    }
  }
};

// GET all drivers with search and filtering
export const getDrivers = async (req: Request, res: Response) => {
  try {
    const { status, category, expiry, search } = req.query;

    const filter: any = {};
    if (status) filter.status = status as any;
    if (category) filter.license_category = String(category);

    const now = new Date();
    if (expiry === 'expired') {
      filter.license_expiry_date = { lt: now };
    } else if (expiry === 'expiring_soon') {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30);
      filter.license_expiry_date = {
        gte: now,
        lte: targetDate,
      };
    }

    if (search) {
      filter.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { contact_number: { contains: String(search), mode: 'insensitive' } },
        { license_number: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    // We also want to include the active trip/assigned vehicle if they are ON_TRIP
    const drivers = await prisma.driver.findMany({
      where: filter,
      include: {
        user: { select: { email: true } },
        trips: {
          where: { status: 'DISPATCHED' },
          include: { vehicle: true },
        },
      },
    });

    const formattedDrivers = drivers.map(d => {
      const activeTrip = d.trips[0];
      return {
        id: d.id,
        user_id: d.user_id,
        email: d.user.email,
        name: d.name,
        contact_number: d.contact_number,
        license_number: d.license_number,
        license_category: d.license_category,
        license_expiry_date: d.license_expiry_date,
        safety_score: d.safety_score,
        status: d.status,
        profile_photo_path: d.profile_photo_path,
        aadhaar_number: d.aadhaar_number,
        aadhaar_file_path: d.aadhaar_file_path,
        license_file_path: d.license_file_path,
        pan_file_path: d.pan_file_path,
        medical_cert_path: d.medical_cert_path,
        police_verification_path: d.police_verification_path,
        assigned_vehicle: activeTrip ? `${activeTrip.vehicle.manufacturer} ${activeTrip.vehicle.name_model} (${activeTrip.vehicle.registration_number})` : '—',
        current_trip: activeTrip ? `${activeTrip.source} → ${activeTrip.destination}` : '—',
      };
    });

    res.json(formattedDrivers);
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

// GET a single driver details with dashboard analytics
export const getDriverById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const driver = await prisma.driver.findUnique({
      where: { id: id as string },
      include: {
        user: { select: { email: true } },
        trips: {
          orderBy: { createdAt: 'desc' },
          include: { vehicle: true },
        },
        violations: {
          orderBy: { date: 'desc' },
        },
        payrollRecords: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Find active trip
    const activeTrip = driver.trips.find(t => t.status === 'DISPATCHED');

    // Calculate Analytics
    const completedTrips = driver.trips.filter(t => t.status === 'COMPLETED');
    const totalTrips = driver.trips.length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const tripsThisMonth = driver.trips.filter(t => {
      const tDate = new Date(t.createdAt);
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    }).length;

    const totalDistanceDriven = completedTrips.reduce((acc, t) => acc + (t.actual_distance || t.planned_distance || 0), 0);
    const totalFuelCost = completedTrips.reduce((acc, t) => acc + (t.fuel_cost || 0), 0);
    const totalFuelConsumed = completedTrips.reduce((acc, t) => acc + (t.fuel_consumed || 0), 0);
    const avgFuelEfficiency = totalFuelConsumed > 0 ? (totalDistanceDriven / totalFuelConsumed) : 0;

    // We can assume totalExpenses is fuel costs + violations (or simple calculation)
    const totalExpenses = totalFuelCost;

    // Working days: days since joining
    const joinDate = driver.joining_date || driver.createdAt;
    const workingTimeDiff = Math.abs(now.getTime() - new Date(joinDate).getTime());
    const totalWorkingDays = Math.max(1, Math.ceil(workingTimeDiff / (1000 * 60 * 60 * 24)));

    res.json({
      driver: {
        id: driver.id,
        user_id: driver.user_id,
        email: driver.user.email,
        name: driver.name,
        contact_number: driver.contact_number,
        license_number: driver.license_number,
        license_category: driver.license_category,
        license_expiry_date: driver.license_expiry_date,
        safety_score: driver.safety_score,
        status: driver.status,
        profile_photo_path: driver.profile_photo_path,
        address: driver.address,
        emergency_contact_name: driver.emergency_contact_name,
        emergency_contact_phone: driver.emergency_contact_phone,
        joining_date: driver.joining_date,
        monthly_salary: driver.monthly_salary,
        license_issue_date: driver.license_issue_date,
        license_file_path: driver.license_file_path,
        aadhaar_number: driver.aadhaar_number,
        aadhaar_file_path: driver.aadhaar_file_path,
        pan_file_path: driver.pan_file_path,
        medical_cert_path: driver.medical_cert_path,
        police_verification_path: driver.police_verification_path,
        internal_notes: driver.internal_notes,
        admin_remarks: driver.admin_remarks,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt,
        assigned_vehicle: activeTrip ? {
          id: activeTrip.vehicle.id,
          registration_number: activeTrip.vehicle.registration_number,
          manufacturer: activeTrip.vehicle.manufacturer,
          name_model: activeTrip.vehicle.name_model,
        } : null,
        current_trip: activeTrip ? {
          id: activeTrip.id,
          source: activeTrip.source,
          destination: activeTrip.destination,
        } : null,
      },
      stats: {
        totalTrips,
        tripsThisMonth,
        totalDistanceDriven,
        totalFuelCost,
        totalExpenses,
        totalWorkingDays,
        avgFuelEfficiency: avgFuelEfficiency.toFixed(2),
      },
      trips: driver.trips,
      violations: driver.violations,
      payrollRecords: driver.payrollRecords,
    });
  } catch (error) {
    console.error('Error fetching driver details:', error);
    res.status(500).json({ error: 'Failed to fetch driver details' });
  }
};

// CREATE a new driver
export const createDriver = async (req: Request, res: Response) => {
  try {
    const {
      name,
      license_number,
      license_category,
      license_expiry_date,
      license_issue_date,
      contact_number,
      email,
      password,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      joining_date,
      monthly_salary,
      aadhaar_number,
      status,
      internal_notes,
      admin_remarks
    } = req.body;

    // Check unique license number
    const existingDriver = await prisma.driver.findUnique({ where: { license_number } });
    if (existingDriver) {
      return res.status(400).json({ error: 'License number must be unique' });
    }

    // Check unique email
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Capture uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const photoFile = files?.['profile_photo']?.[0];
    const licenseFile = files?.['license_file']?.[0];
    const aadhaarFile = files?.['aadhaar_file']?.[0];
    const panFile = files?.['pan_file']?.[0];
    const medicalFile = files?.['medical_cert']?.[0];
    const policeFile = files?.['police_verification']?.[0];

    // DL and Aadhaar are mandatory
    if (!licenseFile) return res.status(400).json({ error: 'Driving License document file is required' });
    if (!aadhaarFile) return res.status(400).json({ error: 'Aadhaar Card document file is required' });

    const profile_photo_path = photoFile ? `uploads/${photoFile.filename}` : null;
    const license_file_path = `uploads/${licenseFile.filename}`;
    const aadhaar_file_path = `uploads/${aadhaarFile.filename}`;
    const pan_file_path = panFile ? `uploads/${panFile.filename}` : null;
    const medical_cert_path = medicalFile ? `uploads/${medicalFile.filename}` : null;
    const police_verification_path = policeFile ? `uploads/${policeFile.filename}` : null;

    // Create user login profile
    const password_hash = await bcrypt.hash(password || 'driver123', 10);
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        role: 'DRIVER'
      }
    });

    const driver = await prisma.driver.create({
      data: {
        user_id: user.id,
        name,
        license_number,
        license_category,
        license_expiry_date: new Date(license_expiry_date),
        license_issue_date: license_issue_date ? new Date(license_issue_date) : null,
        contact_number,
        address,
        emergency_contact_name,
        emergency_contact_phone,
        joining_date: joining_date ? new Date(joining_date) : null,
        monthly_salary: monthly_salary ? Number(monthly_salary) : 0,
        aadhaar_number,
        status: status || 'AVAILABLE',
        profile_photo_path,
        license_file_path,
        aadhaar_file_path,
        pan_file_path,
        medical_cert_path,
        police_verification_path,
        internal_notes,
        admin_remarks,
      }
    });

    res.status(201).json(driver);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
};

// UPDATE driver details
export const updateDriver = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      name,
      license_number,
      license_category,
      license_expiry_date,
      license_issue_date,
      contact_number,
      address,
      emergency_contact_name,
      emergency_contact_phone,
      joining_date,
      monthly_salary,
      aadhaar_number,
      status,
      safety_score,
      internal_notes,
      admin_remarks
    } = req.body;

    const driver = await prisma.driver.findUnique({ where: { id: id as string } });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const photoFile = files?.['profile_photo']?.[0];
    const licenseFile = files?.['license_file']?.[0];
    const aadhaarFile = files?.['aadhaar_file']?.[0];
    const panFile = files?.['pan_file']?.[0];
    const medicalFile = files?.['medical_cert']?.[0];
    const policeFile = files?.['police_verification']?.[0];

    const updates: any = {
      ...(name && { name }),
      ...(license_number && { license_number }),
      ...(license_category && { license_category }),
      ...(license_expiry_date && { license_expiry_date: new Date(license_expiry_date) }),
      ...(license_issue_date && { license_issue_date: new Date(license_issue_date) }),
      ...(contact_number && { contact_number }),
      ...(address !== undefined && { address }),
      ...(emergency_contact_name !== undefined && { emergency_contact_name }),
      ...(emergency_contact_phone !== undefined && { emergency_contact_phone }),
      ...(joining_date && { joining_date: new Date(joining_date) }),
      ...(monthly_salary !== undefined && { monthly_salary: Number(monthly_salary) }),
      ...(aadhaar_number !== undefined && { aadhaar_number }),
      ...(status && { status: status as any }),
      ...(safety_score !== undefined && { safety_score: Number(safety_score) }),
      ...(internal_notes !== undefined && { internal_notes }),
      ...(admin_remarks !== undefined && { admin_remarks }),
    };

    if (photoFile) {
      if (driver.profile_photo_path) removeFile(driver.profile_photo_path);
      updates.profile_photo_path = `uploads/${photoFile.filename}`;
    }
    if (licenseFile) {
      if (driver.license_file_path) removeFile(driver.license_file_path);
      updates.license_file_path = `uploads/${licenseFile.filename}`;
    }
    if (aadhaarFile) {
      if (driver.aadhaar_file_path) removeFile(driver.aadhaar_file_path);
      updates.aadhaar_file_path = `uploads/${aadhaarFile.filename}`;
    }
    if (panFile) {
      if (driver.pan_file_path) removeFile(driver.pan_file_path);
      updates.pan_file_path = `uploads/${panFile.filename}`;
    }
    if (medicalFile) {
      if (driver.medical_cert_path) removeFile(driver.medical_cert_path);
      updates.medical_cert_path = `uploads/${medicalFile.filename}`;
    }
    if (policeFile) {
      if (driver.police_verification_path) removeFile(driver.police_verification_path);
      updates.police_verification_path = `uploads/${policeFile.filename}`;
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: id as string },
      data: updates,
    });

    res.json(updatedDriver);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
};

// DELETE driver
export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const driver = await prisma.driver.findUnique({ where: { id: id as string } });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Delete files
    if (driver.profile_photo_path) removeFile(driver.profile_photo_path);
    if (driver.license_file_path) removeFile(driver.license_file_path);
    if (driver.aadhaar_file_path) removeFile(driver.aadhaar_file_path);
    if (driver.pan_file_path) removeFile(driver.pan_file_path);
    if (driver.medical_cert_path) removeFile(driver.medical_cert_path);
    if (driver.police_verification_path) removeFile(driver.police_verification_path);

    // Delete in Transaction
    await prisma.$transaction([
      prisma.payroll.deleteMany({ where: { driver_id: id } }),
      prisma.violation.deleteMany({ where: { driver_id: id } }),
      prisma.trip.deleteMany({ where: { driver_id: id } }),
      prisma.driver.delete({ where: { id: id as string } }),
      prisma.user.delete({ where: { id: driver.user_id } })
    ]);

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
};

// Log a safety violation and decrease safety score
export const addViolation = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { description, points_deducted } = req.body;

    const driver = await prisma.driver.findUnique({ where: { id: id as string } });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const deduction = Number(points_deducted) || 5;
    const newScore = Math.max(0, driver.safety_score - deduction);

    await prisma.$transaction([
      prisma.violation.create({
        data: {
          driver_id: id,
          description,
          points_deducted: deduction,
        }
      }),
      prisma.driver.update({
        where: { id },
        data: { safety_score: newScore }
      })
    ]);

    res.json({ message: 'Violation logged', new_safety_score: newScore });
  } catch (error) {
    console.error('Error adding violation:', error);
    res.status(500).json({ error: 'Failed to add violation' });
  }
};

// Process payroll details
export const processPayroll = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { month, base_salary, bonus, deductions, payment_status, payment_date } = req.body;

    const driver = await prisma.driver.findUnique({ where: { id: id as string } });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const base = Number(base_salary) || driver.monthly_salary || 0;
    const bon = Number(bonus) || 0;
    const ded = Number(deductions) || 0;
    const final = base + bon - ded;

    const payroll = await prisma.payroll.create({
      data: {
        driver_id: id,
        month,
        base_salary: base,
        bonus: bon,
        deductions: ded,
        final_salary: final,
        payment_status: payment_status || 'PENDING',
        payment_date: payment_date ? new Date(payment_date) : null,
      }
    });

    res.status(201).json(payroll);
  } catch (error) {
    console.error('Error processing payroll:', error);
    res.status(500).json({ error: 'Failed to process payroll' });
  }
};
