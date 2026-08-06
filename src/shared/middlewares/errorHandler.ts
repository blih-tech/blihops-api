import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';
import {
  buildErrorEnvelope,
  buildInternalErrorEnvelope,
} from '../errors/errorEnvelope.js';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational || err.statusCode >= 500) {
      req.log.error({ err }, err.message);
    } else {
      req.log.warn({ err }, err.message);
    }
    res.status(err.statusCode).json(buildErrorEnvelope(err));
    return;
  }

  req.log.error({ err }, 'Unhandled error');
  res.status(500).json(buildInternalErrorEnvelope());
}
