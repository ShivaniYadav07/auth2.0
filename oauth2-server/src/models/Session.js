import mongoose from 'mongoose';

/**
 * A durable first-party browser login session on the Identity Server.
 *
 * This is deliberately separate from access/refresh tokens. Access tokens are short-lived
 * bearer credentials for calling APIs; this session answers a different question - "is the
 * person behind this browser currently signed in to the Identity Server?" - which is exactly
 * what /oauth/authorize needs before it can show a consent screen. It is the server-side
 * anchor for the `sid` cookie, mirroring how accounts.google.com keeps a login session that
 * outlives any single OAuth flow.
 */
const sessionSchema = new mongoose.Schema(
  {
    // SHA-256 hash of the opaque session id held in the `sid` cookie - see utils/crypto.js
    // for why high-entropy tokens are hashed (not bcrypt'd) at rest.
    sessionTokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Informational only (helps a future "your sessions" screen); not used for auth decisions.
    userAgent: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// Let MongoDB expire sessions automatically once they pass expiresAt.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.model('Session', sessionSchema);
