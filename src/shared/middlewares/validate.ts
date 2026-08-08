import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';

import { ValidationError } from '../errors/httpErrors.js';

type RequestPart = 'body' | 'params' | 'query';

export function validate(part: RequestPart, schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(ValidationError.fromZod(result.error));
      return;
    }

    const target = req as unknown as {
      body: unknown;
      params: unknown;
      query: unknown;
    };
    target[part] = result.data;
    next();
  };
}
