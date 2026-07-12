import { Request, Response } from 'express';
import { prisma } from '../../index';
import bcrypt from 'bcryptjs';
import path from 'path';

// GET Profile for logged-in driver
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const driver = await prisma.driver.findUnique({
      where: { user_id: userId },
      include: { user: { select: { email: true } } }
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }

    res.json({
      profile: {
        id: driver.id,
        name: driver.name,
        email: driver.user.email,
        contact_number: driver.contact_number,
        address: driver.address,
        emergency_contact_name: driver.emergency_contact_name,
        emergency_contact_phone: driver.emergency_contact_phone,
        joining_date: driver.joining_date,
        monthly_salary: driver.monthly_salary,
        profile_photo_path: driver.profile_photo_path,
        license_number: driver.license_number,
        license_category: driver.license_category,
        license_expiry_date: driver.license_expiry_date,
        aadhaar_number: driver.aadhaar_number,
        aadhaar_file_path: driver.aadhaar_file_path,
        license_file_path: driver.license_file_path,
        pan_file_path: driver.pan_file_path,
        medical_cert_path: driver.medical_cert_path,
        police_verification_path: driver.police_verification_path,
      }
    });
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    res.status(500).json({ error: 'Failed to fetch driver profile' });
  }
};

// PUT change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { oldPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: newHash }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
};

// GET Dashboard metrics for driver
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const driver = await prisma.driver.findUnique({
      where: { user_id: userId },
      include: {
        trips: {
          orderBy: { createdAt: 'desc' },
          include: { vehicle: true }
        },
        payrollRecords: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    // Active Trip (DISPATCHED or IN_PROGRESS)
    const activeTrip = driver.trips.find(t => t.status === 'DISPATCHED' || t.status === 'IN_PROGRESS');

    // Trips This Month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const tripsThisMonth = driver.trips.filter(t => {
      const tDate = new Date(t.createdAt);
      return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
    }).length;

    // Current Month Salary
    const lastPaidPayroll = driver.payrollRecords.find(p => p.payment_status === 'PAID');
    const currentMonthSalaryDisbursed = lastPaidPayroll ? lastPaidPayroll.final_salary : 0;

    // Assigned Vehicle: last vehicle or current active vehicle
    let assignedVehicle = '—';
    if (activeTrip) {
      assignedVehicle = `${activeTrip.vehicle.manufacturer} ${activeTrip.vehicle.name_model} (${activeTrip.vehicle.registration_number})`;
    } else if (driver.trips.length > 0) {
      const lastTrip = driver.trips[0];
      assignedVehicle = `${lastTrip.vehicle.manufacturer} ${lastTrip.vehicle.name_model} (${lastTrip.vehicle.registration_number})`;
    }

    // Alerts
    const alerts: string[] = [];
    const expiry = new Date(driver.license_expiry_date);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      alerts.push('Your Driving License has EXPIRED! Please upload a updated certificate.');
    } else if (diffDays <= 30) {
      alerts.push(`Your Driving License expires in ${diffDays} days!`);
    }

    if (!driver.aadhaar_number || !driver.aadhaar_file_path) {
      alerts.push('Mandatory Identity Document (Aadhaar Card) is missing. Please contact manager.');
    }

    const unstartedTripsCount = driver.trips.filter(t => t.status === 'DRAFT').length;
    if (unstartedTripsCount > 0) {
      alerts.push(`You have ${unstartedTripsCount} new upcoming trips assigned.`);
    }

    // Notifications Feed
    const notifications: string[] = [];
    if (diffDays <= 15 && diffDays >= 0) {
      notifications.push(`Driving license is expiring in ${diffDays} days.`);
    }
    if (activeTrip) {
      notifications.push(`Active Trip dispatched: ${activeTrip.source} to ${activeTrip.destination}.`);
    }
    if (lastPaidPayroll) {
      notifications.push(`Salary for ${lastPaidPayroll.month} of ₹${lastPaidPayroll.final_salary.toLocaleString()} was credited on ${new Date(lastPaidPayroll.payment_date || '').toLocaleDateString()}.`);
    }

    res.json({
      kpis: {
        status: driver.status,
        assignedVehicle,
        activeTrip: activeTrip ? `${activeTrip.source} → ${activeTrip.destination}` : 'None',
        tripsThisMonth,
        currentMonthSalary: currentMonthSalaryDisbursed,
        safetyScore: driver.safety_score,
      },
      alerts,
      notifications,
    });
  } catch (error) {
    console.error('Error fetching driver dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch driver dashboard' });
  }
};

// GET driver trips
export const getTrips = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const driver = await prisma.driver.findUnique({ where: { user_id: userId } });
    if (!driver) return res.status(404).json({ error: 'Driver profile not found' });

    const trips = await prisma.trip.findMany({
      where: { driver_id: driver.id },
      orderBy: { createdAt: 'desc' },
      include: { vehicle: true }
    });

    res.json(trips);
  } catch (error) {
    console.error('Error fetching driver trips:', error);
    res.status(500).json({ error: 'Failed to fetch driver trips' });
  }
};

// GET driver active trip
export const getActiveTrip = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const driver = await prisma.driver.findUnique({ where: { user_id: userId } });
    if (!driver) return res.status(404).json({ error: 'Driver profile not found' });

    const trip = await prisma.trip.findFirst({
      where: { driver_id: driver.id, status: { in: ['DISPATCHED', 'IN_PROGRESS'] } },
      include: { vehicle: true }
    });

    res.json(trip || null);
  } catch (error) {
    console.error('Error fetching active trip:', error);
    res.status(500).json({ error: 'Failed to fetch active trip' });
  }
};

// POST create internal trip
export const createInternalTrip = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { source, destination, planned_distance, reason, remarks } = req.body;

    const driver = await prisma.driver.findUnique({ where: { user_id: userId } });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    if (driver.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'You are currently not available (Status: ' + driver.status + ')' });
    }

    // Default to the last vehicle they drove
    const lastTrip = await prisma.trip.findFirst({
      where: { driver_id: driver.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!lastTrip) {
      return res.status(400).json({ error: 'No previous vehicle association found. Contact administrator.' });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: lastTrip.vehicle_id } });
    if (!vehicle) return res.status(404).json({ error: 'Assigned vehicle not found' });
    if (vehicle.status !== 'AVAILABLE') return res.status(400).json({ error: 'Vehicle is currently unavailable' });

    const trip = await prisma.trip.create({
      data: {
        trip_type: 'INTERNAL',
        reason,
        remarks,
        source,
        destination,
        cargo_weight: 0, // No weight for internal movements
        planned_distance: Number(planned_distance) || 0,
        start_odometer: vehicle.odometer,
        status: 'DISPATCHED',
        start_time: new Date(),
        driver_id: driver.id,
        vehicle_id: vehicle.id
      }
    });

    // Update statuses
    await prisma.$transaction([
      prisma.driver.update({ where: { id: driver.id }, data: { status: 'ON_TRIP' } }),
      prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: 'ON_TRIP' } })
    ]);

    res.status(201).json(trip);
  } catch (error) {
    console.error('Error creating internal trip:', error);
    res.status(500).json({ error: 'Failed to create internal trip' });
  }
};

// POST add fuel log for active trip
export const addFuelLog = async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id as string;
    const { liters, cost, odometer, fuel_station, remarks } = req.body;

    const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { vehicle: true } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const file = req.file;
    const receipt_path = file ? `uploads/${file.filename}` : null; // Simulating receipt path logging (stored inside log notes)

    const finalRemarks = remarks ? `${remarks} (Receipt: ${receipt_path || 'None'})` : `Logged on Trip #${tripId} (Receipt: ${receipt_path || 'None'})`;

    // Create standard FuelLog
    const fuelLog = await prisma.fuelLog.create({
      data: {
        liters: Number(liters),
        cost: Number(cost),
        fuel_station,
        odometer: odometer ? Number(odometer) : null,
        vehicle_id: trip.vehicle_id,
        remarks: finalRemarks
      } as any // Use as any to prevent strict type checks on extra log fields
    });

    // Update active trip costs
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        fuel_consumed: (trip.fuel_consumed || 0) + Number(liters),
        fuel_cost: (trip.fuel_cost || 0) + Number(cost)
      }
    });

    // Optionally update vehicle odometer if provided
    if (odometer) {
      await prisma.vehicle.update({
        where: { id: trip.vehicle_id },
        data: { odometer: Number(odometer) }
      });
      await prisma.odometerLog.create({
        data: {
          vehicle_id: trip.vehicle_id,
          odometer: Number(odometer),
          remarks: `Fuel filling update at station ${fuel_station}`
        }
      });
    }

    res.status(201).json(fuelLog);
  } catch (error) {
    console.error('Error adding trip fuel log:', error);
    res.status(500).json({ error: 'Failed to log fuel refill' });
  }
};

// POST add expense log for active trip
export const addExpenseLog = async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id as string;
    const { amount, expense_type, remarks } = req.body;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const file = req.file;
    const receipt_path = file ? `uploads/${file.filename}` : null;

    const finalRemarks = remarks ? `${remarks} (Receipt: ${receipt_path || 'None'})` : `Toll/parking logged on Trip #${tripId} (Receipt: ${receipt_path || 'None'})`;

    // Create standard Expense log linked to the vehicle
    const expense = await prisma.expense.create({
      data: {
        expense_type: expense_type as any, // TOLL, PARKING, FOOD, REPAIR, OTHER
        amount: Number(amount),
        vehicle_id: trip.vehicle_id,
        description: finalRemarks
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error adding trip expense:', error);
    res.status(500).json({ error: 'Failed to log expense' });
  }
};

// POST update odometer log
export const updateOdometer = async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id as string;
    const { odometer, remarks } = req.body;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const readingValue = Number(odometer);

    // Create OdometerLog
    const odometerLog = await prisma.odometerLog.create({
      data: {
        vehicle_id: trip.vehicle_id,
        odometer: readingValue,
        remarks: remarks || `Odometer log update during trip #${tripId}`
      }
    });

    // Update vehicle
    await prisma.vehicle.update({
      where: { id: trip.vehicle_id },
      data: { odometer: readingValue }
    });

    res.status(201).json(odometerLog);
  } catch (error) {
    console.error('Error updating odometer:', error);
    res.status(500).json({ error: 'Failed to log odometer reading' });
  }
};

// PUT complete trip
export const completeTrip = async (req: Request, res: Response) => {
  try {
    const tripId = req.params.id as string;
    const { final_odometer, fuel_consumed, remarks } = req.body;

    const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { vehicle: true } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status !== 'DISPATCHED' && trip.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Trip must be in DISPATCHED or IN_PROGRESS state to complete' });
    }

    const file = req.file;
    const final_proof_path = file ? `uploads/${file.filename}` : null;

    const endOdo = Number(final_odometer);
    const startOdo = trip.start_odometer || (trip as any).vehicle.odometer || 0;
    const actualDistance = Math.max(0, endOdo - startOdo);

    // Update active trip
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        status: 'COMPLETED',
        end_time: new Date(),
        final_odometer: endOdo,
        actual_distance: actualDistance,
        fuel_consumed: fuel_consumed ? Number(fuel_consumed) : trip.fuel_consumed,
        final_proof_path,
        remarks: remarks || trip.remarks
      }
    });

    // Update vehicle and driver statuses
    await prisma.$transaction([
      prisma.vehicle.update({
        where: { id: trip.vehicle_id },
        data: {
          status: 'AVAILABLE',
          odometer: endOdo
        }
      }),
      prisma.driver.update({
        where: { id: trip.driver_id },
        data: { status: 'AVAILABLE' }
      }),
      prisma.odometerLog.create({
        data: {
          vehicle_id: trip.vehicle_id,
          odometer: endOdo,
          remarks: `Trip #${tripId} completion odometer reading`
        }
      })
    ]);

    res.json({ message: 'Trip completed successfully', actual_distance: actualDistance });
  } catch (error) {
    console.error('Error completing trip:', error);
    res.status(500).json({ error: 'Failed to complete trip' });
  }
};

// PUT update profile documents and identity fields
export const updateProfileDocuments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { license_number, license_expiry_date, aadhaar_number } = req.body;

    const driver = await prisma.driver.findUnique({ where: { user_id: userId } });
    if (!driver) return res.status(404).json({ error: 'Driver profile not found' });

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const profile_photo_path = files?.['profile_photo']?.[0] ? `uploads/${files['profile_photo'][0].filename}` : driver.profile_photo_path;
    const license_file_path = files?.['license_file']?.[0] ? `uploads/${files['license_file'][0].filename}` : driver.license_file_path;
    const aadhaar_file_path = files?.['aadhaar_file']?.[0] ? `uploads/${files['aadhaar_file'][0].filename}` : driver.aadhaar_file_path;
    const pan_file_path = files?.['pan_file']?.[0] ? `uploads/${files['pan_file'][0].filename}` : driver.pan_file_path;
    const medical_cert_path = files?.['medical_cert']?.[0] ? `uploads/${files['medical_cert'][0].filename}` : driver.medical_cert_path;
    const police_verification_path = files?.['police_verification']?.[0] ? `uploads/${files['police_verification'][0].filename}` : driver.police_verification_path;

    const updateData: any = {
      profile_photo_path,
      license_file_path,
      aadhaar_file_path,
      pan_file_path,
      medical_cert_path,
      police_verification_path,
    };

    if (license_number) updateData.license_number = license_number;
    if (license_expiry_date) updateData.license_expiry_date = new Date(license_expiry_date);
    if (aadhaar_number) updateData.aadhaar_number = aadhaar_number;

    const updatedDriver = await prisma.driver.update({
      where: { id: driver.id },
      data: updateData
    });

    res.json({ message: 'Profile documents updated successfully', driver: updatedDriver });
  } catch (error) {
    console.error('Error updating driver profile documents:', error);
    res.status(500).json({ error: 'Failed to update profile documents' });
  }
};
