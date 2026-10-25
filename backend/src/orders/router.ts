import { Router } from 'express';
import { authenticate } from '../auth/middleware.js';
import type { UserRepository } from '../auth/types.js';
import { createOrderController } from './controller.js';
import { SupabaseOrderRepository } from './repository.js';
import { OrderService } from './service.js';
import type { OrderRepository } from './types.js';

export function createOrderRouter(users: UserRepository, orders: OrderRepository = new SupabaseOrderRepository()) {
  const router = Router();
  const controller = createOrderController(new OrderService(orders));
  router.use(authenticate(users));
  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  return router;
}
