import type { NextFunction, Request, Response } from 'express';
import { InventoryService } from './service.js';

function routeId(request: Request) {
  const id = request.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export function createInventoryController(service: InventoryService) {
  return {
    purchase: async (request: Request, response: Response, next: NextFunction) => {
      try { response.json({ vehicle: await service.purchase(routeId(request)) }); } catch (error) { next(error); }
    },
    restock: async (request: Request, response: Response, next: NextFunction) => {
      try { response.json({ vehicle: await service.restock(routeId(request), request.body) }); } catch (error) { next(error); }
    },
  };
}

