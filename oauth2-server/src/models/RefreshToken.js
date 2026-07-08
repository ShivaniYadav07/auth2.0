import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    // SHA-256 hash of the opaque refresh token - see utils/crypto.js for the rationale.
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Null for first-party session refresh tokens (register/login/logout on this server).
    // Populated for tokens issued to a third-party client via the OAuth token endpoint.
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OAuthClient',
      default: null,
    },
    scope: {
      type: String,
      default: '',
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    // Rotation chain pointer: when a refresh token is used, it is revoked and a new one is
    // issued in its place. Recording the successor lets us recognize reuse of an
    // already-rotated (stolen) token and revoke the entire chain as a compromise response.
    replacedByTokenHash: {
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

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ user: 1, client: 1 });

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
