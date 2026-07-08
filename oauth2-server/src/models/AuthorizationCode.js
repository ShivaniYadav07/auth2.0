import mongoose from 'mongoose';

const authorizationCodeSchema = new mongoose.Schema(
  {
    // SHA-256 hash of the code. The plaintext code only ever exists in the redirect URL
    // and the token-exchange request body, never at rest.
    codeHash: {
      type: String,
      required: true,
      unique: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OAuthClient',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Must match exactly on token exchange (RFC 6749 4.1.3).
    redirectUri: {
      type: String,
      required: true,
    },
    scope: {
      type: String,
      default: '',
    },
    // Authorization codes are single-use. Flipping this on redemption (instead of
    // deleting the doc) lets us detect and log replay attempts.
    used: {
      type: Boolean,
      default: false,
    },
    // TTL index below removes expired codes automatically; codes are short-lived (~60s)
    // by design to minimize the window for interception.
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

authorizationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthorizationCode = mongoose.model('AuthorizationCode', authorizationCodeSchema);
