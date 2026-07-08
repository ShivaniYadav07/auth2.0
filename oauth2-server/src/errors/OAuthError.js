import { AppError } from './AppError.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * OAuth-flow errors must be reported using the RFC 6749 error vocabulary
 * (error, error_description) rather than our generic API envelope, so that
 * standard OAuth clients/libraries can parse them.
 */
export class OAuthError extends AppError {
  constructor(oauthErrorCode, description, statusCode = HTTP_STATUS.BAD_REQUEST) {
    super(description, statusCode, oauthErrorCode);
    this.oauthErrorCode = oauthErrorCode;
  }
}
