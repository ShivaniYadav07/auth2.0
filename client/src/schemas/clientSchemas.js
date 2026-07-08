import { z } from 'zod';
import { SUPPORTED_SCOPES } from '../utils/oauthConstants';

// The form collects redirect URIs as newline-separated text; transform/pipe turns that
// into the string[] the backend's registerClientSchema expects, one URL per line.
export const clientFormSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required').max(100),
  redirectUris: z
    .string()
    .trim()
    .min(1, 'At least one redirect URI is required')
    .transform((val) =>
      val
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(z.string().url('Each redirect URI must be a valid URL'))
        .min(1, 'At least one redirect URI is required'),
    ),
  scopes: z.array(z.enum(SUPPORTED_SCOPES)).optional().default([]),
});
