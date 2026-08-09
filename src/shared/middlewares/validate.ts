import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';

import { ValidationError } from '../errors/httpErrors.js';

type RequestPart = 'body' | 'params' | 'query';

export type BodyOf<S extends z.ZodTypeAny> = Request<
  Record<string, string>,
  unknown,
  z.infer<S>
>;

export type ParamsOf<S extends z.ZodTypeAny> = Request<
  z.infer<S>,
  unknown,
  unknown
>;

export type QueryOf<S extends z.ZodTypeAny> = Request<
  Record<string, string>,
  unknown,
  unknown,
  z.infer<S>
>;

export type BodyAndParamsOf<
  S extends z.ZodTypeAny,
  P extends z.ZodTypeAny,
> = Request<z.infer<P>, unknown, z.infer<S>>;

export function validate(part: RequestPart, schema: z.ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(ValidationError.fromZod(result.error));
      return;
    }

    if (part === 'query') {
      // Express defines req.query as a getter-only property; shadow it with
      // an own data property (the getter is configurable).
      Object.defineProperty(req, 'query', {
        value: result.data,
        configurable: true,
        enumerable: true,
        writable: true,
      });
    } else {
      const target = req as unknown as {
        body: unknown;
        params: unknown;
        query: unknown;
      };
      target[part] = result.data;
    }
    next();
  };
}
