import mongoose from 'mongoose';
import { SUPPORTED_SCOPES } from '../constants/oauth.js';

const oauthClientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    clientId: {
      type: String,
      required: true,
      unique: true,
    },
    // Bcrypt hash of the client secret. The plaintext secret is only ever shown once,
    // at registration time - identical trust model to a user password.
    clientSecretHash: {
      type: String,
      required: true,
      select: false,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Exact-match allow-list. The authorize and token endpoints both re-validate the
    // redirect_uri against this list - this is the primary defense against authorization
    // code interception via an attacker-controlled redirect.
    redirectUris: {
      type: [String],
      required: true,
      validate: {
        validator: (uris) => Array.isArray(uris) && uris.length > 0,
        message: 'At least one redirect URI is required',
      },
    },
    scopes: {
      type: [String],
      default: [],
      validate: {
        validator: (scopes) => scopes.every((scope) => SUPPORTED_SCOPES.includes(scope)),
        message: 'One or more scopes are not supported',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

oauthClientSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.clientSecretHash;
    delete ret.__v;
    return ret;
  },
});

export const OAuthClient = mongoose.model('OAuthClient', oauthClientSchema);
