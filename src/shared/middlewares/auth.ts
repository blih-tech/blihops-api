import type { NextFunction, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';

import { auth } from '../auth/auth.js';
import { ForbiddenError, UnauthorizedError } from '../errors/httpErrors.js';

export type RequestAuth = typeof auth.$Infer.Session;
export type AuthRole = 'admin' | 'client' | 'talent';

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    next(new UnauthorizedError('Authentication required'));
    return;
  }

  req.auth = session;
  next();
}

export function requireRole(...roles: AuthRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.auth === undefined) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.auth.user.role)) {
      next(new ForbiddenError('Insufficient permissions'));
      return;
    }

    next();
  };
}
