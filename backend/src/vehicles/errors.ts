import { AppError } from '../auth/errors.js';

export class VehicleNotFoundError extends AppError {
  constructor() {
    super(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
  }
}

