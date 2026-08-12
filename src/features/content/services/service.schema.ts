import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { metaSchema } from '../common/schemas.js';

extendZodWithOpenApi(z);

export const serviceLocaleContentSchema = z.object({
  slug: z.string(),
  title: z.string(),
  subtitle: z.string(),
  shortDescription: z.string(),
  details: z.string(),
  tag: z.string(),
  body: z.string(),
  features: z.array(z.string()),
  whoThisIsFor: z.string(),
});

export const serviceContentSchema = z.object({
  en: serviceLocaleContentSchema,
  de: serviceLocaleContentSchema,
});

export const servicesSchema = z.object({
  id: z.string(),
  icon: z.string(),
  imageUrl: z.string(),
  alt: z.string(),
  displayOrder: z.number(),
  content: serviceContentSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const getServicesResponseSchema = z.object({
  items: z.array(servicesSchema),
  meta: metaSchema,
});

export type ServiceLocaleContent = {
  slug: string;
  title: string;
  subtitle: string;
  shortDescription: string;
  details: string;
  tag: string;
  body: string;
  features: string[];
  whoThisIsFor: string;
};

export type ServiceContent = {
  en?: ServiceLocaleContent;
  de?: ServiceLocaleContent;
};

export type ServiceDetail = {
  id: string;
  icon: string;
  imageUrl: string;
  alt: string;
  displayOrder: number;
  content: ServiceContent;
  createdAt: string;
  updatedAt: string;
};
