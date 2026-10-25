import { Router } from 'express';
import { authenticate, requireRole } from '../auth/middleware.js';
import type { UserRepository } from '../auth/types.js';
import { createInventoryController } from './controller.js';
import { SupabaseInventoryRepository } from './repository.js';
import { InventoryService } from './service.js';
import type { InventoryRepository } from './types.js';

export function createInventoryRouter(users: UserRepository, inventory: InventoryRepository = new SupabaseInventoryRepository()) {
  const router = Router();
  const controller = createInventoryController(new InventoryService(inventory));

  router.use(authenticate(users));
  router.post('/:id/purchase', controller.purchase);
  router.post('/:id/restock', requireRole('admin'), controller.restock);

  return router;
}

