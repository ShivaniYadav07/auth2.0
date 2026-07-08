import * as userService from '../services/userService.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await userService.findUserById(req.auth.userId);
  return sendSuccess(res, { message: 'Current user retrieved', data: { user } });
});
