import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import {
  buildErrorEnvelope,
  buildInternalErrorEnvelope,
} from '../errors/errorEnvelope.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    const isServerError = err.statusCode >= 500;
    if (!err.isOperational || isServerError) {
      console.error(err);
    } else {
      console.error(`[${err.statusCode}] ${err.code}: ${err.message}`);
    }
    res.status(err.statusCode).json(buildErrorEnvelope(err));
    return;
  }

  console.error(err);
  res.status(500).json(buildInternalErrorEnvelope());
}
