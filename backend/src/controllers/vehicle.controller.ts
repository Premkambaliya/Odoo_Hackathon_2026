import { Request, Response } from 'express';
import { prisma } from '../../index';

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const { status, type } = req.query;
    
    const filter: any = {};
    if (status) filter.status = String(status);
    if (type) filter.type = String(type);

    const vehicles = await prisma.vehicle.findMany({ where: filter });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const { registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost } = req.body;

    const existing = await prisma.vehicle.findUnique({ where: { registration_number } });
    if (existing) {
      return res.status(400).json({ error: 'Registration number must be unique' });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        registration_number,
        name_model,
        type,
        max_load_capacity: Number(max_load_capacity),
        odometer: Number(odometer) || 0,
        acquisition_cost: Number(acquisition_cost),
      },
    });

    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name_model, type, max_load_capacity, status } = req.body;

    const vehicle = await prisma.vehicle.update({
      where: { id: id as string },
      data: {
        ...(name_model && { name_model }),
        ...(type && { type }),
        ...(max_load_capacity && { max_load_capacity: Number(max_load_capacity) }),
        ...(status && { status: status as any }),
      },
    });

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};
