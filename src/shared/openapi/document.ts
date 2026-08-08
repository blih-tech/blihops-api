import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';

import { auth } from '../auth/auth.js';
import { env } from '../configs/env.js';
import { registry } from './registry.js';
import './auth.paths.js';
import '../../features/content/paths.js';

const AUTH_BASE_PATH = '/api/v1/auth';

const AUTH_PATHS = new Set([
  '/ok',
  '/sign-in/email',
  '/sign-out',
  '/get-session',
  '/request-password-reset',
  '/reset-password',
  '/reset-password/{token}',
]);

const PUBLIC_PATHS = new Set([
  '/api/v1/auth/ok',
  '/api/v1/auth/sign-in/email',
  '/api/v1/auth/request-password-reset',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/reset-password/{token}',
  '/api/v1/auth/accept-invite',
  '/api/v1/content/tags',
  '/api/v1/content/categories',
  '/api/v1/content/logos',
  '/api/v1/content/testimonials',
  '/api/v1/content/services-hero',
]);

const COOKIE_SECURITY = [{ apiKeyCookie: [] }];
const COOKIE_OR_BEARER_SECURITY = [{ apiKeyCookie: [] }, { bearerAuth: [] }];

type Operation = { security?: unknown };
type PathItem = Record<string, Operation>;
type Paths = Record<string, PathItem>;

const keepAuthPaths = (paths: Record<string, unknown>): Paths =>
  Object.fromEntries(
    Object.entries(paths)
      .filter(([path]) => AUTH_PATHS.has(path))
      .map(([path, value]) => [`${AUTH_BASE_PATH}${path}`, value as PathItem]),
  );

export async function generateOpenApiDocument() {
  const betterAuthSpec = await auth.api.generateOpenAPISchema({});

  const customSpec = new OpenApiGeneratorV3(
    registry.definitions,
  ).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Blih Ops API',
      version: '0.1.0',
    },
  });

  const paths: Paths = {
    ...keepAuthPaths(betterAuthSpec.paths ?? {}),
    ...(customSpec.paths as unknown as Paths),
  };

  const securitySchemes = {
    ...betterAuthSpec.components?.securitySchemes,
    apiKeyCookie: {
      ...betterAuthSpec.components?.securitySchemes?.apiKeyCookie,
      name: 'better-auth.session_token',
      description:
        'Session cookie set by sign-in. In Swagger UI: sign in via POST /api/v1/auth/sign-in/email, then authorize with the cookie value.',
    },
  };

  for (const [path, item] of Object.entries(paths)) {
    for (const operation of Object.values(item)) {
      if (PUBLIC_PATHS.has(path)) {
        delete operation.security;
      } else if (path === '/api/v1/auth/invite') {
        operation.security = COOKIE_OR_BEARER_SECURITY;
      } else {
        operation.security = COOKIE_SECURITY;
      }
    }
  }

  return {
    openapi: '3.1.1',
    info: {
      title: 'Blih Ops API',
      version: '0.1.0',
      description:
        'Backend API for Blih Ops. Auth endpoints cover sign-in, sign-out, password reset, invitations, and account activation.',
    },
    servers: [{ url: env.API_URL }],
    tags: [
      { name: 'Auth', description: 'Authentication and account management' },
      { name: 'Content', description: 'Managed website content' },
    ],
    paths,
    components: {
      schemas: {
        ...betterAuthSpec.components?.schemas,
        ...customSpec.components?.schemas,
      },
      securitySchemes,
    },
    security: [],
  };
}
