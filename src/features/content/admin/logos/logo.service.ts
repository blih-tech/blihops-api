import { NotFoundError } from '../../../../shared/errors/httpErrors.js';
import { isRecordNotFound } from '../../common/prismaErrors.js';
import type { LogoResponse } from '../../logos/logo.schema.js';
import { toLogoResponse } from '../../logos/logo.service.js';
import {
  createLogoRecord,
  deleteLogoRecord,
  findLogoById,
  updateLogoRecord,
} from './logo.repository.js';

export type CreateLogoPayload = { imageUrl: string; alt: string };
export type UpdateLogoPayload = {
  imageUrl?: string | undefined;
  alt?: string | undefined;
};

export async function createLogo(
  payload: CreateLogoPayload,
): Promise<LogoResponse> {
  const logo = await createLogoRecord(payload);
  return toLogoResponse(logo);
}

export async function updateLogo(
  id: string,
  payload: UpdateLogoPayload,
): Promise<LogoResponse> {
  const existingLogo = await findLogoById(id);
  if (existingLogo === null) {
    throw new NotFoundError('Logo not found');
  }

  try {
    const logo = await updateLogoRecord(id, {
      imageUrl: payload.imageUrl ?? existingLogo.imageUrl,
      alt: payload.alt ?? existingLogo.alt,
    });
    return toLogoResponse(logo);
  } catch (err) {
    if (isRecordNotFound(err)) {
      throw new NotFoundError('Logo not found');
    }
    throw err;
  }
}

export async function deleteLogo(id: string): Promise<void> {
  const existingLogo = await findLogoById(id);
  if (existingLogo === null) {
    throw new NotFoundError('Logo not found');
  }

  try {
    await deleteLogoRecord(id);
  } catch (err) {
    if (isRecordNotFound(err)) {
      throw new NotFoundError('Logo not found');
    }
    throw err;
  }
}
