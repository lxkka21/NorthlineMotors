import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../auth/errors.js';

type SafeErrorDetails = {
  name: string;
  message: string;
  code?: string;
  cause?: { name: string; message: string; code?: string };
};

function safeCauseDetails(cause: unknown) {
  if (cause instanceof Error) {
    const details: { name: string; message: string; code?: string } = {
      name: cause.name,
      message: cause.message,
    };
    const code = (cause as Error & { code?: unknown }).code;
    if (typeof code === 'string') details.code = code;
    return details;
  }

  if (typeof cause === 'object' && cause !== null) {
    const candidate = cause as { name?: unknown; message?: unknown; code?: unknown };
    const details: { name: string; message: string; code?: string } = {
      name: typeof candidate.name === 'string' ? candidate.name : 'UnknownError',
      message: typeof candidate.message === 'string' ? candidate.message : 'Unknown error',
    };
    if (typeof candidate.code === 'string') details.code = candidate.code;
    return details;
  }

  return undefined;
}

function safeErrorDetails(error: unknown) {
  if (error instanceof Error) {
    const details: SafeErrorDetails = {
      name: error.name,
      message: error.message,
    };
    const code = (error as Error & { code?: unknown }).code;
    if (typeof code === 'string') details.code = code;
    const cause = safeCauseDetails(error.cause);
    if (cause) details.cause = cause;
    return details;
  }

  if (typeof error === 'object' && error !== null) {
    const candidate = error as { name?: unknown; message?: unknown; code?: unknown; cause?: unknown };
    const details: SafeErrorDetails = {
      name: typeof candidate.name === 'string' ? candidate.name : 'UnknownError',
      message: typeof candidate.message === 'string' ? candidate.message : 'Unknown error',
    };
    if (typeof candidate.code === 'string') details.code = candidate.code;
    const cause = safeCauseDetails(candidate.cause);
    if (cause) details.cause = cause;
    return details;
  }

  return { name: 'UnknownError', message: 'Unknown error' };
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    return response.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
  }

  console.error('Unhandled request error', safeErrorDetails(error));
  return response.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' } });
}
