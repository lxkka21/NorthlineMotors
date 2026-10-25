import type { NextFunction, Request, Response } from 'express';
import { OrderService } from './service.js';

function routeId(request: Request) {
  const id = request.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export function createOrderController(service: OrderService) {
  return {
    create: async (request: Request, response: Response, next: NextFunction) => {
      try { response.status(201).json({ order: await service.create(request.authUser!.id, request.body) }); } catch (error) { next(error); }
    },
    list: async (request: Request, response: Response, next: NextFunction) => {
      try { response.json({ orders: await service.list(request.authUser!.id, request.authUser!.role === 'admin') }); } catch (error) { next(error); }
    },
    get: async (request: Request, response: Response, next: NextFunction) => {
      try { response.json({ order: await service.get(routeId(request), request.authUser!.id, request.authUser!.role === 'admin') }); } catch (error) { next(error); }
    },
  };
}
