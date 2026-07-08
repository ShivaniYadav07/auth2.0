import { z } from 'zod';
import { SUPPORTED_SCOPES } from '../constants/oauth.js';

export const registerClientSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Client name is required').max(100),
    redirectUris: z
      .array(z.string().url('Each redirect URI must be a valid URL'))
      .min(1, 'At least one redirect URI is required'),
    scopes: z.array(z.enum(SUPPORTED_SCOPES)).optional().default([]),
  }),
});
