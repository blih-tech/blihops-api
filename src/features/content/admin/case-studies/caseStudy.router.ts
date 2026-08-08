import { Router } from 'express';

import { validate } from '../../../../shared/middlewares/validate.js';
import {
  adminCaseStudyListQuerySchema,
  caseStudyIdParamsSchema,
  createCaseStudyBodySchema,
  patchCaseStudyBodySchema,
} from './caseStudy.schema.js';
import {
  createCaseStudyController,
  deleteCaseStudyController,
  getAdminCaseStudyController,
  getAdminCaseStudiesController,
  publishCaseStudyController,
  unpublishCaseStudyController,
  updateCaseStudyController,
} from './caseStudy.controller.js';

export const adminCaseStudyRouter = Router();

adminCaseStudyRouter.get(
  '/',
  validate('query', adminCaseStudyListQuerySchema),
  getAdminCaseStudiesController,
);

adminCaseStudyRouter.get(
  '/:id',
  validate('params', caseStudyIdParamsSchema),
  getAdminCaseStudyController,
);

adminCaseStudyRouter.post(
  '/',
  validate('body', createCaseStudyBodySchema),
  createCaseStudyController,
);

adminCaseStudyRouter.patch(
  '/:id',
  validate('params', caseStudyIdParamsSchema),
  validate('body', patchCaseStudyBodySchema),
  updateCaseStudyController,
);

adminCaseStudyRouter.post(
  '/:id/publish',
  validate('params', caseStudyIdParamsSchema),
  publishCaseStudyController,
);

adminCaseStudyRouter.post(
  '/:id/unpublish',
  validate('params', caseStudyIdParamsSchema),
  unpublishCaseStudyController,
);

adminCaseStudyRouter.delete(
  '/:id',
  validate('params', caseStudyIdParamsSchema),
  deleteCaseStudyController,
);
