import type { NextFunction, Request, Response } from 'express';
import { VehicleService } from './service.js';

function routeId(request: Request) {
  const id = request.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export function createVehicleController(service: VehicleService) {
  return {
    create: async (request: Request, response: Response, next: NextFunction) => {
      try { response.status(201).json({ vehicle: await service.create(request.body) }); } catch (error) { next(error); }
    },
    list: async (request: Request, response: Response, next: NextFunction) => {
      try { response.json({ vehicles: await service.list(request.query) }); } catch (error) { next(error); }
    },
    update: async (request: Request, response: Response, next: NextFunction) => {
      try { response.json({ vehicle: await service.update(routeId(request), request.body) }); } catch (error) { next(error); }
    },
    remove: async (request: Request, response: Response, next: NextFunction) => {
      try { await service.delete(routeId(request)); response.status(204).send(); } catch (error) { next(error); }
    },
  };
}
