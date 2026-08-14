import { ZodError } from 'zod';
import type { ErrorDetail } from '../types/response.js';
import { AppError } from './AppError.js';
import { ErrorCodes } from './errorCodes.js';

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: ErrorDetail[]) {
    super(message, {
      code: ErrorCodes.BAD_REQUEST,
      statusCode: 400,
      details,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, { code: ErrorCodes.UNAUTHORIZED, statusCode: 401 });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, { code: ErrorCodes.FORBIDDEN, statusCode: 403 });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, { code: ErrorCodes.NOT_FOUND, statusCode: 404 });
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, { code: ErrorCodes.CONFLICT, statusCode: 409 });
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: ErrorDetail[]) {
    super(message, {
      code: ErrorCodes.VALIDATION_ERROR,
      statusCode: 422,
      details,
    });
  }

  static fromZod(error: ZodError): ValidationError {
    const details: ErrorDetail[] = error.issues.map((issue) => {
      const path = issue.path.join('.');
      return path === ''
        ? { message: issue.message }
        : { path, message: issue.message };
    });
    return new ValidationError('Validation failed', details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, { code: ErrorCodes.TOO_MANY_REQUESTS, statusCode: 429 });
  }
}

export class ContentIncompleteError extends AppError {
  constructor(message: string, details: ErrorDetail[]) {
    super(message, {
      code: ErrorCodes.CONTENT_INCOMPLETE,
      statusCode: 422,
      details,
    });
  }
}

export class ContentSlugTakenError extends AppError {
  constructor(message = 'This slug is already in use') {
    super(message, {
      code: ErrorCodes.CONTENT_SLUG_TAKEN,
      statusCode: 409,
    });
  }
}

export class ContentPrimaryDeleteBlockedError extends AppError {
  constructor(message: string) {
    super(message, {
      code: ErrorCodes.CONTENT_PRIMARY_DELETE_BLOCKED,
      statusCode: 409,
    });
  }
}

export class ContentInvalidLocaleError extends AppError {
  constructor(message = 'Locale must be either en or de') {
    super(message, {
      code: ErrorCodes.CONTENT_INVALID_LOCALE,
      statusCode: 400,
    });
  }
}

export class LeadNotFoundError extends AppError {
  constructor(message = 'Lead not found') {
    super(message, { code: ErrorCodes.LEAD_NOT_FOUND, statusCode: 404 });
  }
}

export class LeadWebhookInvalidError extends AppError {
  constructor(message = 'Invalid webhook signature') {
    super(message, { code: ErrorCodes.LEAD_WEBHOOK_INVALID, statusCode: 401 });
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, {
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      statusCode: 500,
      isOperational: false,
    });
  }
}
