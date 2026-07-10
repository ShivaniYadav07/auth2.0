import { Router } from 'express';
import * as oauthController from '../controllers/oauthController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireSession } from '../middleware/requireSession.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiters.js';
import { registerClientSchema } from '../validators/oauthClientValidators.js';
import {
  authorizeQuerySchema,
  authorizeDecisionSchema,
  tokenRequestSchema,
  revokeRequestSchema,
} from '../validators/oauthValidators.js';

const router = Router();

// Client management - requires a logged-in (first-party) user, who becomes the client's owner.
router.post(
  '/clients',
  authenticate,
  validate(registerClientSchema),
  oauthController.registerClient,
);
router.get('/clients', authenticate, oauthController.listClients);

// Authorization Code flow. These are gated on the Identity Server browser SESSION (the
// `sid` cookie), not on a Bearer access token: the user must already be logged in to this
// server - exactly like Google/Auth0's hosted consent pages - before consent is shown.
router.get(
  '/authorize',
  requireSession,
  validate(authorizeQuerySchema),
  oauthController.getAuthorizationRequest,
);
router.post(
  '/authorize/decision',
  requireSession,
  validate(authorizeDecisionSchema),
  oauthController.submitAuthorizationDecision,
);
router.post('/token', authLimiter, validate(tokenRequestSchema), oauthController.issueToken);
router.post('/revoke', authLimiter, validate(revokeRequestSchema), oauthController.revokeToken);

export default router;
