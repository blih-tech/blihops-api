import type { ErrorDetail } from '../types/response.js';

export interface AppErrorOptions {
  code: string;
  statusCode: number;
  details?: ErrorDetail[] | undefined;
  cause?: unknown;
  isOperational?: boolean;
}

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: ErrorDetail[] | undefined;
  readonly isOperational: boolean;

  constructor(message: string, options: AppErrorOptions) {
    super(message);
    this.name = new.target.name;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}
