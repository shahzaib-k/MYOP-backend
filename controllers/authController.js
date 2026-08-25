import {
  changeUserPassword,
  loginUser,
  registerCustomer,
  updateUserProfile,
} from "../services/authService.js";
import { savePushToken } from "../services/notificationService.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const register = async (req, res, next) => {
  try {
    const session = await registerCustomer(req.body);
    return sendSuccess(res, 201, "Account created successfully", session);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const session = await loginUser(req.body);
    return sendSuccess(res, 200, "Logged in successfully", session);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, "Profile fetched successfully", req.user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await updateUserProfile(req.user.userId, req.body);
    return sendSuccess(res, 200, "Profile updated successfully", user);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    await changeUserPassword(req.user.userId, req.body);
    return sendSuccess(res, 200, "Password updated successfully");
  } catch (error) {
    next(error);
  }
};

export const registerPushToken = async (req, res, next) => {
  try {
    await savePushToken(req.user.userId, req.body.token);
    return sendSuccess(res, 200, "Push token registered successfully");
  } catch (error) {
    next(error);
  }
};
