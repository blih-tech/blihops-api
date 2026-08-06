import type { ErrorResponse } from '../types/response.js';
import { AppError } from './AppError.js';
import { ErrorCodes } from './errorCodes.js';

export function buildErrorEnvelope(error: AppError): ErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined && { details: error.details }),
    },
  };
}

export function buildInternalErrorEnvelope(
  message = 'Internal server error',
): ErrorResponse {
  return {
    error: {
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message,
    },
  };
}
