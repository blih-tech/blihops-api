import type { Handler, Router } from 'express';
import { Router as createRouter } from 'express';
import swaggerUi from 'swagger-ui-express';

import { generateOpenApiDocument } from '../openapi/document.js';

export const openapiRouter: Router = createRouter();

let cachedDocument: Promise<
  Awaited<ReturnType<typeof generateOpenApiDocument>>
> | null = null;

openapiRouter.get('/openapi.json', async (_req, res) => {
  cachedDocument ??= generateOpenApiDocument();
  res.json(await cachedDocument);
});

let docsHandlers: Promise<Handler[]> | null = null;

openapiRouter.use('/docs', (req, res, next) => {
  docsHandlers ??= generateOpenApiDocument().then((document) => [
    ...swaggerUi.serve,
    swaggerUi.setup(document, {
      customSiteTitle: 'Blih Ops API Docs',
    }),
  ]);

  docsHandlers
    .then((handlers) => {
      const run = (index: number): void => {
        if (index >= handlers.length) {
          next();
          return;
        }
        handlers[index]?.(req, res, (err?: unknown) => {
          if (err !== undefined) {
            next(err);
            return;
          }
          run(index + 1);
        });
      };
      run(0);
    })
    .catch(next);
});
