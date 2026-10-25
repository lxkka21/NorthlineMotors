import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../auth/errors.js';

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
  }

  console.error('Unhandled request error');
  return response.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' } });
}

