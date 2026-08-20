import type { Request, Response } from 'express';

import { sendSuccess } from '../../../shared/utils/response.js';
import {
  getCompletionByToken,
  submitCompletion,
} from './completion.service.js';

export async function getCompletionRequestController(
  req: Request,
  res: Response,
) {
  const { token } = req.params as { token: string };
  const data = await getCompletionByToken(token);
  sendSuccess(res, data);
}

export async function submitCompletionController(req: Request, res: Response) {
  const { token } = req.params as { token: string };
  const body = req.body as {
    photoFileKey: string;
    shortBio: string;
    professionalHeadline: string;
  };
  const data = await submitCompletion(token, body);
  sendSuccess(res, data);
}
