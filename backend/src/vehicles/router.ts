import { Router } from 'express';
import { authenticate, requireRole } from '../auth/middleware.js';
import type { UserRepository } from '../auth/types.js';
import { createVehicleController } from './controller.js';
import { SupabaseVehicleRepository } from './repository.js';
import { VehicleService } from './service.js';
import type { VehicleRepository } from './types.js';

export function createVehicleRouter(users: UserRepository, vehicles: VehicleRepository = new SupabaseVehicleRepository()) {
  const router = Router();
  const controller = createVehicleController(new VehicleService(vehicles));

  router.use(authenticate(users));
  router.post('/', controller.create);
  router.get('/search', controller.list);
  router.get('/', controller.list);
  router.put('/:id', controller.update);
  router.delete('/:id', requireRole('admin'), controller.remove);

  return router;
}

