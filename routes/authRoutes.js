import express from "express";
import {
  changePassword,
  getProfile,
  login,
  register,
  registerPushToken,
  updateProfile,
} from "../controllers/authController.js";
import {
  validateChangePassword,
  validateLogin,
  validatePushToken,
  validateRegister,
  validateUpdateProfile,
} from "../middleware/validateAuth.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/me", protect, getProfile);
router.put("/me", protect, validateUpdateProfile, updateProfile);
router.put("/me/password", protect, validateChangePassword, changePassword);
router.post("/me/push-token", protect, validatePushToken, registerPushToken);

export default router;
