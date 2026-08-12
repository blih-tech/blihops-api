import type { Request, Response } from 'express';

import {
  type BodyAndParamsOf,
  type BodyOf,
  type ParamsOf,
} from '../../../../shared/middlewares/validate.js';
import { sendMany, sendSuccess } from '../../../../shared/utils/response.js';
import { listAllServices } from '../../services/service.service.js';
import {
  createServiceBodySchema,
  patchServiceBodySchema,
  serviceIdParamsSchema,
} from './service.schema.js';
import {
  createService,
  deleteService,
  getAdminService,
  updateService,
} from './service.service.js';

export async function getAdminServicesController(_req: Request, res: Response) {
  const services = await listAllServices();
  sendMany(res, services, {});
}

export async function getAdminServiceController(
  req: ParamsOf<typeof serviceIdParamsSchema>,
  res: Response,
) {
  const service = await getAdminService(req.params.id);
  sendSuccess(res, service);
}

export async function createServiceController(
  req: BodyOf<typeof createServiceBodySchema>,
  res: Response,
) {
  const service = await createService(req.body);
  sendSuccess(res, service, 201);
}

export async function updateServiceController(
  req: BodyAndParamsOf<
    typeof patchServiceBodySchema,
    typeof serviceIdParamsSchema
  >,
  res: Response,
) {
  const service = await updateService(req.params.id, req.body);
  sendSuccess(res, service);
}

export async function deleteServiceController(
  req: ParamsOf<typeof serviceIdParamsSchema>,
  res: Response,
) {
  await deleteService(req.params.id);
  res.status(204).end();
}
