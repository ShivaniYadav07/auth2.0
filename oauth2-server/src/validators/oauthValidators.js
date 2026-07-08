import { z } from 'zod';
import { GRANT_TYPES, RESPONSE_TYPES } from '../constants/oauth.js';

export const authorizeQuerySchema = z.object({
  query: z.object({
    response_type: z.literal(RESPONSE_TYPES.CODE),
    client_id: z.string().min(1),
    redirect_uri: z.string().url(),
    scope: z.string().optional(),
    // Opaque value the client round-trips through the redirect to bind the response to the
    // request it made - the app's primary defense against CSRF on the redirect callback.
    state: z.string().optional(),
  }),
});

export const authorizeDecisionSchema = z.object({
  body: z.object({
    response_type: z.literal(RESPONSE_TYPES.CODE),
    client_id: z.string().min(1),
    redirect_uri: z.string().url(),
    scope: z.string().optional(),
    state: z.string().optional(),
    decision: z.enum(['allow', 'deny']),
  }),
});

const authorizationCodeGrantSchema = z.object({
  grant_type: z.literal(GRANT_TYPES.AUTHORIZATION_CODE),
  code: z.string().min(1),
  redirect_uri: z.string().url(),
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
});

const refreshTokenGrantSchema = z.object({
  grant_type: z.literal(GRANT_TYPES.REFRESH_TOKEN),
  refresh_token: z.string().min(1),
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
});

export const tokenRequestSchema = z.object({
  body: z.discriminatedUnion('grant_type', [authorizationCodeGrantSchema, refreshTokenGrantSchema]),
});

export const revokeRequestSchema = z.object({
  body: z.object({
    token: z.string().min(1),
    client_id: z.string().min(1),
    client_secret: z.string().min(1),
  }),
});
