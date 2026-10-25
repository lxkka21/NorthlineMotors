import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { createAuthRouter } from './auth/router.js';
import { SupabaseUserRepository } from './auth/repository.js';
import { authenticate, requireRole } from './auth/middleware.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import type { UserRepository } from './auth/types.js';
import { createVehicleRouter } from './vehicles/router.js';
import type { VehicleRepository } from './vehicles/types.js';
import { createInventoryRouter } from './inventory/router.js';
import { SupabaseInventoryRepository } from './inventory/repository.js';
import type { InventoryRepository } from './inventory/types.js';
import { createOrderRouter } from './orders/router.js';
import type { OrderRepository } from './orders/types.js';

export function createApp(options: { userRepository?: UserRepository; vehicleRepository?: VehicleRepository; orderRepository?: OrderRepository } = {}) {
  const app = express();
  const userRepository = options.userRepository ?? new SupabaseUserRepository();

  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_ORIGIN }));
  app.use(express.json());

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', service: 'car-dealership-inventory-api' });
  });
  app.use('/api/auth', createAuthRouter(userRepository));
  app.get('/api/admin/ping', authenticate(userRepository), requireRole('admin'), (_request, response) => {
    response.json({ status: 'ok' });
  });
  app.use('/api/vehicles', createVehicleRouter(userRepository, options.vehicleRepository));
  const inventoryRepository: InventoryRepository = options.vehicleRepository && 'purchase' in options.vehicleRepository
    ? options.vehicleRepository as VehicleRepository & InventoryRepository
    : new SupabaseInventoryRepository();
  app.use('/api/vehicles', createInventoryRouter(userRepository, inventoryRepository));
  app.use('/api/orders', createOrderRouter(userRepository, options.orderRepository));
  app.use(errorHandler);

  return app;
}

export const app = createApp();
