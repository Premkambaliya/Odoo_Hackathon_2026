import { prisma } from './index';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database with sample data...');

  // Clean up
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const password_hash = await bcrypt.hash('password123', 10);

  // 1. Users & Drivers
  console.log('Creating users and drivers...');
  const manager = await prisma.user.create({ data: { email: 'manager@transitops.com', password_hash, role: 'FLEET_MANAGER' } });
  const safety = await prisma.user.create({ data: { email: 'safety@transitops.com', password_hash, role: 'SAFETY_OFFICER' } });
  const finance = await prisma.user.create({ data: { email: 'finance@transitops.com', password_hash, role: 'FINANCIAL_ANALYST' } });
  
  const driverUser1 = await prisma.user.create({ data: { email: 'driver1@transitops.com', password_hash, role: 'DRIVER' } });
  const driverUser2 = await prisma.user.create({ data: { email: 'driver2@transitops.com', password_hash, role: 'DRIVER' } });
  const driverUser3 = await prisma.user.create({ data: { email: 'driver3@transitops.com', password_hash, role: 'DRIVER' } });

  const driver1 = await prisma.driver.create({
    data: { 
      user_id: driverUser1.id, 
      name: 'John Doe', 
      license_number: 'DL-001', 
      license_category: 'Heavy', 
      license_expiry_date: new Date('2028-01-01'), 
      contact_number: '1112223333', 
      status: 'AVAILABLE',
      profile_photo_path: 'uploads/driver-john.jpg',
      address: '123 ERP Lane, Mumbai',
      emergency_contact_name: 'Mary Doe',
      emergency_contact_phone: '9998887776',
      joining_date: new Date('2024-01-10'),
      monthly_salary: 35000,
      aadhaar_number: '1234-5678-9012',
      license_file_path: 'uploads/dl-john.pdf',
      aadhaar_file_path: 'uploads/aadhaar-john.pdf',
      safety_score: 95,
      payrollRecords: {
        create: [
          { month: 'May 2026', base_salary: 35000, bonus: 2000, deductions: 500, final_salary: 36500, payment_status: 'PAID', payment_date: new Date('2026-06-02') },
          { month: 'June 2026', base_salary: 35000, bonus: 1500, deductions: 1000, final_salary: 35500, payment_status: 'PAID', payment_date: new Date('2026-07-01') },
          { month: 'July 2026', base_salary: 35000, bonus: 0, deductions: 0, final_salary: 35000, payment_status: 'PENDING' }
        ]
      },
      violations: {
        create: [
          { description: 'Over-speeding violation on Highway 4', points_deducted: 5, date: new Date('2026-06-15') }
        ]
      }
    }
  });
  const driver2 = await prisma.driver.create({
    data: { 
      user_id: driverUser2.id, 
      name: 'Jane Smith', 
      license_number: 'DL-002', 
      license_category: 'Light', 
      license_expiry_date: new Date('2027-06-15'), 
      contact_number: '4445556666', 
      status: 'ON_TRIP',
      profile_photo_path: 'uploads/driver-jane.jpg',
      address: '456 Tech Park, Pune',
      emergency_contact_name: 'Robert Smith',
      emergency_contact_phone: '8887776665',
      joining_date: new Date('2025-03-01'),
      monthly_salary: 38000,
      aadhaar_number: '9876-5432-1098',
      license_file_path: 'uploads/dl-jane.pdf',
      aadhaar_file_path: 'uploads/aadhaar-jane.pdf',
      safety_score: 100,
      payrollRecords: {
        create: [
          { month: 'June 2026', base_salary: 38000, bonus: 1000, deductions: 0, final_salary: 39000, payment_status: 'PAID', payment_date: new Date('2026-07-01') }
        ]
      }
    }
  });
  const driver3 = await prisma.driver.create({
    data: { 
      user_id: driverUser3.id, 
      name: 'Mike Ross', 
      license_number: 'DL-003', 
      license_category: 'Heavy', 
      license_expiry_date: new Date('2026-08-05'), // Expiring soon in our timeline!
      contact_number: '7778889999', 
      status: 'OFF_DUTY',
      profile_photo_path: 'uploads/driver-mike.jpg',
      address: '789 Lawyer Row, Bangalore',
      emergency_contact_name: 'Harvey Specter',
      emergency_contact_phone: '7776665554',
      joining_date: new Date('2025-05-15'),
      monthly_salary: 32000,
      aadhaar_number: '5555-6666-7777',
      license_file_path: 'uploads/dl-mike.pdf',
      aadhaar_file_path: 'uploads/aadhaar-mike.pdf',
      safety_score: 100
    }
  });

  // 2. Vehicles
  console.log('Creating vehicles...');
  const vehicle1 = await prisma.vehicle.create({
    data: { 
      registration_number: 'TRK-100', 
      name_model: 'Volvo FH16', 
      manufacturer: 'Volvo',
      type: 'Truck', 
      fuel_type: 'Diesel',
      max_load_capacity: 20000, 
      odometer: 15000, 
      acquisition_cost: 150000, 
      status: 'AVAILABLE',
      rc_number: 'RC-TRK-100',
      rc_file_path: 'uploads/rc_trk100.pdf',
      insurance_file_path: 'uploads/insurance_trk100.pdf',
      puc_file_path: 'uploads/puc_trk100.pdf'
    }
  });
  const vehicle2 = await prisma.vehicle.create({
    data: { 
      registration_number: 'VAN-200', 
      name_model: 'Ford Transit', 
      manufacturer: 'Ford',
      type: 'Van', 
      fuel_type: 'Diesel',
      max_load_capacity: 1500, 
      odometer: 5000, 
      acquisition_cost: 35000, 
      status: 'ON_TRIP',
      rc_number: 'RC-VAN-200',
      rc_file_path: 'uploads/rc_van200.pdf',
      insurance_file_path: 'uploads/insurance_van200.pdf',
      puc_file_path: 'uploads/puc_van200.pdf'
    }
  });
  const vehicle3 = await prisma.vehicle.create({
    data: { 
      registration_number: 'TRK-300', 
      name_model: 'Scania R500', 
      manufacturer: 'Scania',
      type: 'Truck', 
      fuel_type: 'Diesel',
      max_load_capacity: 18000, 
      odometer: 45000, 
      acquisition_cost: 130000, 
      status: 'IN_SHOP',
      rc_number: 'RC-TRK-300',
      rc_file_path: 'uploads/rc_trk300.pdf',
      insurance_file_path: 'uploads/insurance_trk300.pdf',
      puc_file_path: 'uploads/puc_trk300.pdf'
    }
  });

  // 3. Trips
  console.log('Creating trips...');
  const trip1 = await prisma.trip.create({
    data: { source: 'New York', destination: 'Boston', vehicle_id: vehicle2.id, driver_id: driver2.id, cargo_weight: 1000, planned_distance: 350, status: 'DISPATCHED', start_time: new Date() }
  });
  const trip2 = await prisma.trip.create({
    data: { source: 'Los Angeles', destination: 'San Francisco', vehicle_id: vehicle1.id, driver_id: driver1.id, cargo_weight: 15000, planned_distance: 600, status: 'COMPLETED', start_time: new Date('2026-07-10T08:00:00Z'), end_time: new Date('2026-07-11T16:00:00Z'), final_odometer: 15600, fuel_consumed: 120 }
  });
  const trip3 = await prisma.trip.create({
    data: { source: 'Chicago', destination: 'Detroit', vehicle_id: vehicle1.id, driver_id: driver1.id, cargo_weight: 5000, planned_distance: 450, status: 'DRAFT' }
  });

  // 4. Maintenance Logs & Expenses
  console.log('Creating maintenance and fuel logs...');
  await prisma.maintenanceLog.create({
    data: { vehicle_id: vehicle3.id, description: 'Engine Replacement', cost: 5000, is_active: true }
  });
  await prisma.maintenanceLog.create({
    data: { vehicle_id: vehicle1.id, description: 'Routine Oil Change', cost: 200, is_active: false, end_date: new Date() }
  });
  await prisma.expense.create({
    data: { vehicle_id: vehicle1.id, expense_type: 'MAINTENANCE', amount: 200, description: 'Routine Oil Change' }
  });

  // 5. Fuel Logs & Expenses
  await prisma.fuelLog.create({
    data: { vehicle_id: vehicle1.id, liters: 120, cost: 360, date: new Date('2026-07-11T16:00:00Z') }
  });
  await prisma.expense.create({
    data: { vehicle_id: vehicle1.id, expense_type: 'FUEL', amount: 360, description: 'Fuel log of 120 liters', date: new Date('2026-07-11T16:00:00Z') }
  });
  await prisma.expense.create({
    data: { vehicle_id: vehicle2.id, expense_type: 'TOLL', amount: 15, description: 'Highway Toll' }
  });

  console.log('✅ Database successfully seeded!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
