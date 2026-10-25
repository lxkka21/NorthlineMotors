import { ValidationError } from '../auth/errors.js';
import { VehicleNotFoundError } from './errors.js';
import { createVehicleSchema, searchVehicleSchema, updateVehicleSchema } from './validation.js';
import type { VehicleRepository } from './types.js';

export class VehicleService {
  constructor(private readonly vehicles: VehicleRepository) {}

  async create(input: unknown) {
    const parsed = createVehicleSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError('Vehicle fields are invalid');
    return this.vehicles.create(parsed.data);
  }

  async list(filters: unknown = {}) {
    const parsed = searchVehicleSchema.safeParse(filters);
    if (!parsed.success) throw new ValidationError('Vehicle search filters are invalid');
    return this.vehicles.list(parsed.data);
  }

  async update(id: string, input: unknown) {
    const parsed = updateVehicleSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError('Vehicle fields are invalid');
    const vehicle = await this.vehicles.update(id, parsed.data);
    if (!vehicle) throw new VehicleNotFoundError();
    return vehicle;
  }

  async delete(id: string) {
    if (!(await this.vehicles.findById(id))) throw new VehicleNotFoundError();
    if (!(await this.vehicles.delete(id))) throw new VehicleNotFoundError();
  }
}

