import { Request, Response } from 'express';
import { prisma } from '../../index';

// GET list of trips with filtering
export const getTrips = async (req: Request, res: Response) => {
  try {
    const { status, trip_type, vehicle_id, driver_id, search } = req.query;

    const whereClause: any = {};

    if (status) whereClause.status = status;
    if (trip_type) whereClause.trip_type = trip_type;
    if (vehicle_id) whereClause.vehicle_id = vehicle_id;
    if (driver_id) whereClause.driver_id = driver_id;

    if (search) {
      whereClause.OR = [
        { source: { contains: search as string, mode: 'insensitive' } },
        { destination: { contains: search as string, mode: 'insensitive' } },
        { pickup_customer_name: { contains: search as string, mode: 'insensitive' } },
        { delivery_customer_name: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const trips = await prisma.trip.findMany({
      where: whereClause,
      include: { vehicle: true, driver: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
};

// GET single trip detail
export const getTripById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { vehicle: true, driver: true }
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (error) {
    console.error('Error fetching trip detail:', error);
    res.status(500).json({ error: 'Failed to fetch trip details' });
  }
};

// POST create trip (handles file uploads)
export const createTrip = async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const trip_type = body.trip_type || 'DELIVERY';
    const vehicle_id = body.vehicle_id;
    const driver_id = body.driver_id;
    const cargo_weight = Number(body.cargo_weight) || 0;
    const planned_distance = Number(body.planned_distance) || 0;

    // Fetch and validate vehicle
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status !== 'AVAILABLE') return res.status(400).json({ error: 'Vehicle is currently on another trip / in maintenance' });
    
    // Cargo weight validation vs capacity
    if (trip_type === 'DELIVERY' && cargo_weight > vehicle.max_load_capacity) {
      return res.status(400).json({ error: `Cargo weight (${cargo_weight} kg) exceeds vehicle maximum capacity (${vehicle.max_load_capacity} kg)` });
    }

    // Fetch and validate driver
    const driver = await prisma.driver.findUnique({ where: { id: driver_id } });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.status !== 'AVAILABLE') return res.status(400).json({ error: `Driver status is currently ${driver.status} (Not Available)` });
    if (driver.license_expiry_date && new Date(driver.license_expiry_date) < new Date()) {
      return res.status(400).json({ error: 'Driver license has expired! Select a driver with valid license.' });
    }

    // Attachments paths
    const invoice_file_path = files?.['invoice']?.[0] ? `uploads/${files['invoice'][0].filename}` : null;
    const challan_file_path = files?.['challan']?.[0] ? `uploads/${files['challan'][0].filename}` : null;
    const eway_bill_file_path = files?.['eway_bill']?.[0] ? `uploads/${files['eway_bill'][0].filename}` : null;
    const purchase_order_file_path = files?.['purchase_order']?.[0] ? `uploads/${files['purchase_order'][0].filename}` : null;
    const other_doc_file_path = files?.['other_documents']?.[0] ? `uploads/${files['other_documents'][0].filename}` : null;

    // Create Trip record
    const trip = await prisma.trip.create({
      data: {
        trip_type,
        source: body.source,
        destination: body.destination,
        cargo_weight,
        planned_distance,
        priority: body.priority || 'MEDIUM',
        expected_delivery: body.expected_delivery ? new Date(body.expected_delivery) : null,
        special_instructions: body.special_instructions,
        remarks: body.remarks,

        // Pickup Customer Details
        pickup_customer_name: body.pickup_customer_name,
        pickup_company_name: body.pickup_company_name,
        pickup_gst_number: body.pickup_gst_number,
        pickup_contact_person: body.pickup_contact_person,
        pickup_mobile: body.pickup_mobile,
        pickup_alt_mobile: body.pickup_alt_mobile,
        pickup_email: body.pickup_email,
        pickup_street: body.pickup_street,
        pickup_area: body.pickup_area,
        pickup_city: body.pickup_city,
        pickup_state: body.pickup_state,
        pickup_country: body.pickup_country,
        pickup_pincode: body.pickup_pincode,
        pickup_maps_link: body.pickup_maps_link,

        // Delivery Customer Details
        delivery_customer_name: body.delivery_customer_name,
        delivery_company_name: body.delivery_company_name,
        delivery_gst_number: body.delivery_gst_number,
        delivery_contact_person: body.delivery_contact_person,
        delivery_mobile: body.delivery_mobile,
        delivery_alt_mobile: body.delivery_alt_mobile,
        delivery_email: body.delivery_email,
        delivery_street: body.delivery_street,
        delivery_area: body.delivery_area,
        delivery_city: body.delivery_city,
        delivery_state: body.delivery_state,
        delivery_country: body.delivery_country,
        delivery_pincode: body.delivery_pincode,
        delivery_maps_link: body.delivery_maps_link,

        // Goods Details
        goods_name: body.goods_name,
        goods_quantity: Number(body.goods_quantity) || null,
        goods_volume: Number(body.goods_volume) || null,
        goods_package_count: Number(body.goods_package_count) || null,
        is_fragile: body.is_fragile === 'true' || body.is_fragile === true,
        is_perishable: body.is_perishable === 'true' || body.is_perishable === true,
        is_hazardous: body.is_hazardous === 'true' || body.is_hazardous === true,
        special_handling_notes: body.special_handling_notes,

        // Route details
        estimated_duration: Number(body.estimated_duration) || null,
        stops_count: Number(body.stops_count) || 0,
        route_notes: body.route_notes,

        // Financial estimates
        driver_allowance: Number(body.driver_allowance) || 0,
        loading_charges: Number(body.loading_charges) || 0,
        unloading_charges: Number(body.unloading_charges) || 0,
        toll_estimate: Number(body.toll_estimate) || 0,
        misc_estimate: Number(body.misc_estimate) || 0,
        expected_revenue: Number(body.expected_revenue) || 0,

        // File uploads
        invoice_file_path,
        challan_file_path,
        eway_bill_file_path,
        purchase_order_file_path,
        other_doc_file_path,

        // Relations
        vehicle_id: vehicle.id,
        driver_id: driver.id,
        status: 'DRAFT',
      }
    });

    res.status(201).json(trip);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
};

// PUT update trip details
export const updateTrip = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const body = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot modify completed or cancelled trips' });
    }

    const invoice_file_path = files?.['invoice']?.[0] ? `uploads/${files['invoice'][0].filename}` : trip.invoice_file_path;
    const challan_file_path = files?.['challan']?.[0] ? `uploads/${files['challan'][0].filename}` : trip.challan_file_path;
    const eway_bill_file_path = files?.['eway_bill']?.[0] ? `uploads/${files['eway_bill'][0].filename}` : trip.eway_bill_file_path;
    const purchase_order_file_path = files?.['purchase_order']?.[0] ? `uploads/${files['purchase_order'][0].filename}` : trip.purchase_order_file_path;
    const other_doc_file_path = files?.['other_documents']?.[0] ? `uploads/${files['other_documents'][0].filename}` : trip.other_doc_file_path;

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        source: body.source || trip.source,
        destination: body.destination || trip.destination,
        cargo_weight: body.cargo_weight ? Number(body.cargo_weight) : trip.cargo_weight,
        planned_distance: body.planned_distance ? Number(body.planned_distance) : trip.planned_distance,
        priority: body.priority || trip.priority,
        expected_delivery: body.expected_delivery ? new Date(body.expected_delivery) : trip.expected_delivery,
        special_instructions: body.special_instructions || trip.special_instructions,
        remarks: body.remarks || trip.remarks,

        pickup_customer_name: body.pickup_customer_name || trip.pickup_customer_name,
        pickup_company_name: body.pickup_company_name || trip.pickup_company_name,
        pickup_gst_number: body.pickup_gst_number || trip.pickup_gst_number,
        pickup_contact_person: body.pickup_contact_person || trip.pickup_contact_person,
        pickup_mobile: body.pickup_mobile || trip.pickup_mobile,
        pickup_alt_mobile: body.pickup_alt_mobile || trip.pickup_alt_mobile,
        pickup_email: body.pickup_email || trip.pickup_email,
        pickup_street: body.pickup_street || trip.pickup_street,
        pickup_area: body.pickup_area || trip.pickup_area,
        pickup_city: body.pickup_city || trip.pickup_city,
        pickup_state: body.pickup_state || trip.pickup_state,
        pickup_country: body.pickup_country || trip.pickup_country,
        pickup_pincode: body.pickup_pincode || trip.pickup_pincode,
        pickup_maps_link: body.pickup_maps_link || trip.pickup_maps_link,

        delivery_customer_name: body.delivery_customer_name || trip.delivery_customer_name,
        delivery_company_name: body.delivery_company_name || trip.delivery_company_name,
        delivery_gst_number: body.delivery_gst_number || trip.delivery_gst_number,
        delivery_contact_person: body.delivery_contact_person || trip.delivery_contact_person,
        delivery_mobile: body.delivery_mobile || trip.delivery_mobile,
        delivery_alt_mobile: body.delivery_alt_mobile || trip.delivery_alt_mobile,
        delivery_email: body.delivery_email || trip.delivery_email,
        delivery_street: body.delivery_street || trip.delivery_street,
        delivery_area: body.delivery_area || trip.delivery_area,
        delivery_city: body.delivery_city || trip.delivery_city,
        delivery_state: body.delivery_state || trip.delivery_state,
        delivery_country: body.delivery_country || trip.delivery_country,
        delivery_pincode: body.delivery_pincode || trip.delivery_pincode,
        delivery_maps_link: body.delivery_maps_link || trip.delivery_maps_link,

        goods_name: body.goods_name || trip.goods_name,
        goods_quantity: body.goods_quantity ? Number(body.goods_quantity) : trip.goods_quantity,
        goods_volume: body.goods_volume ? Number(body.goods_volume) : trip.goods_volume,
        goods_package_count: body.goods_package_count ? Number(body.goods_package_count) : trip.goods_package_count,
        is_fragile: body.is_fragile !== undefined ? (body.is_fragile === 'true' || body.is_fragile === true) : trip.is_fragile,
        is_perishable: body.is_perishable !== undefined ? (body.is_perishable === 'true' || body.is_perishable === true) : trip.is_perishable,
        is_hazardous: body.is_hazardous !== undefined ? (body.is_hazardous === 'true' || body.is_hazardous === true) : trip.is_hazardous,
        special_handling_notes: body.special_handling_notes || trip.special_handling_notes,

        estimated_duration: body.estimated_duration ? Number(body.estimated_duration) : trip.estimated_duration,
        stops_count: body.stops_count ? Number(body.stops_count) : trip.stops_count,
        route_notes: body.route_notes || trip.route_notes,

        driver_allowance: body.driver_allowance ? Number(body.driver_allowance) : trip.driver_allowance,
        loading_charges: body.loading_charges ? Number(body.loading_charges) : trip.loading_charges,
        unloading_charges: body.unloading_charges ? Number(body.unloading_charges) : trip.unloading_charges,
        toll_estimate: body.toll_estimate ? Number(body.toll_estimate) : trip.toll_estimate,
        misc_estimate: body.misc_estimate ? Number(body.misc_estimate) : trip.misc_estimate,
        expected_revenue: body.expected_revenue ? Number(body.expected_revenue) : trip.expected_revenue,

        invoice_file_path,
        challan_file_path,
        eway_bill_file_path,
        purchase_order_file_path,
        other_doc_file_path,
      }
    });

    res.json(updatedTrip);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: 'Failed to update trip details' });
  }
};

// PUT dispatch trip
export const dispatchTrip = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    const trip = await prisma.trip.findUnique({ where: { id }, include: { vehicle: true } });
    if (!trip || trip.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Trip must be in DRAFT state to dispatch' });
    }

    await prisma.$transaction([
      prisma.trip.update({ 
        where: { id }, 
        data: { 
          status: 'DISPATCHED', 
          start_time: new Date(), 
          start_odometer: trip.vehicle.odometer 
        } 
      }),
      prisma.vehicle.update({ where: { id: trip.vehicle_id }, data: { status: 'ON_TRIP' } }),
      prisma.driver.update({ where: { id: trip.driver_id }, data: { status: 'ON_TRIP' } })
    ]);

    res.json({ message: 'Trip dispatched successfully' });
  } catch (error) {
    console.error('Error dispatching trip:', error);
    res.status(500).json({ error: 'Failed to dispatch trip' });
  }
};

// Loading start
export const startLoading = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const trip = await prisma.trip.update({
      where: { id },
      data: { loading_start_time: new Date() }
    });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log loading start' });
  }
};

// Loading end
export const endLoading = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const trip = await prisma.trip.update({
      where: { id },
      data: { loading_end_time: new Date() }
    });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log loading completion' });
  }
};

// Start Transit (Shifts to IN_PROGRESS)
export const startTransit = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const trip = await prisma.trip.update({
      where: { id },
      data: { status: 'IN_PROGRESS', departure_time: new Date() }
    });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to shift trip to In Transit' });
  }
};

// PUT complete trip
export const completeTrip = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { final_odometer, fuel_consumed, fuel_cost, receiver_name, receiver_mobile, remarks } = req.body;
    const file = req.file;

    const trip = await prisma.trip.findUnique({ where: { id }, include: { vehicle: true } });
    if (!trip || (trip.status !== 'DISPATCHED' && trip.status !== 'IN_PROGRESS')) {
      return res.status(400).json({ error: 'Trip must be in DISPATCHED or IN_PROGRESS state to complete' });
    }

    const finalOdoVal = Number(final_odometer);
    if (finalOdoVal < (trip.start_odometer || trip.vehicle.odometer || 0)) {
      return res.status(400).json({ error: `Final odometer cannot be less than start odometer (${trip.start_odometer || trip.vehicle.odometer} km)` });
    }

    const actual_distance = finalOdoVal - (trip.start_odometer || trip.vehicle.odometer || 0);
    const customer_signature_path = file ? `uploads/${file.filename}` : null;

    await prisma.$transaction([
      prisma.trip.update({ 
        where: { id }, 
        data: { 
          status: 'COMPLETED', 
          end_time: new Date(), 
          final_odometer: finalOdoVal, 
          actual_distance,
          fuel_consumed: fuel_consumed ? Number(fuel_consumed) : trip.fuel_consumed,
          fuel_cost: fuel_cost ? Number(fuel_cost) : trip.fuel_cost,
          receiver_name,
          receiver_mobile,
          customer_signature_path,
          remarks: remarks || trip.remarks
        } 
      }),
      prisma.vehicle.update({ 
        where: { id: trip.vehicle_id }, 
        data: { status: 'AVAILABLE', odometer: finalOdoVal } 
      }),
      prisma.driver.update({ 
        where: { id: trip.driver_id }, 
        data: { status: 'AVAILABLE' } 
      }),
      prisma.odometerLog.create({
        data: {
          vehicle_id: trip.vehicle_id,
          odometer: finalOdoVal,
          remarks: `Trip #${id} completion reading`
        }
      }),
      ...(fuel_consumed && fuel_cost ? [
        prisma.fuelLog.create({
          data: {
            vehicle_id: trip.vehicle_id,
            liters: Number(fuel_consumed),
            cost: Number(fuel_cost),
            date: new Date(),
            fuel_station: 'Main Depot Refueling',
            odometer: finalOdoVal
          }
        }),
        prisma.expense.create({
          data: {
            vehicle_id: trip.vehicle_id,
            expense_type: 'FUEL',
            amount: Number(fuel_cost),
            date: new Date(),
            description: `Fuel logged on Trip ${id}`
          }
        })
      ] : [])
    ]);

    res.json({ message: 'Trip completed successfully' });
  } catch (error) {
    console.error('Error completing trip:', error);
    res.status(500).json({ error: 'Failed to complete trip' });
  }
};

// PUT cancel trip
export const cancelTrip = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip || trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot cancel completed or already cancelled trips' });
    }

    const updates: any = [
      prisma.trip.update({ where: { id }, data: { status: 'CANCELLED' } })
    ];

    if (trip.status === 'DISPATCHED' || trip.status === 'IN_PROGRESS') {
      updates.push(prisma.vehicle.update({ where: { id: trip.vehicle_id }, data: { status: 'AVAILABLE' } }));
      updates.push(prisma.driver.update({ where: { id: trip.driver_id }, data: { status: 'AVAILABLE' } }));
    }

    await prisma.$transaction(updates);

    res.json({ message: 'Trip cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel trip' });
  }
};
