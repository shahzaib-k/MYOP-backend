import express from "express";
import {
  changePassword,
  getProfile,
  login,
  register,
  updateProfile,
} from "../controllers/authController.js";
import {
  validateChangePassword,
  validateLogin,
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

export default router;
