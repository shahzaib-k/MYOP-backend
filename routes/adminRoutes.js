import express from "express";
import {
  changeOrderStatus,
  createUser,
  getDashboard,
  getOrderDetails,
  listOrders,
  listUsers,
  updateUserStatus,
} from "../controllers/adminController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { validateUpdateOrderStatus } from "../middleware/validateOrder.js";
import { validateRegister } from "../middleware/validateAuth.js";
import {
  validateOrderQuery,
  validateUserStatus,
} from "../middleware/validateAdmin.js";

const router = express.Router();

router.use(protect, restrictTo("admin"));

router.get("/dashboard", getDashboard);

router.get("/orders", validateOrderQuery, listOrders);
router.get("/orders/:id", getOrderDetails);
router.put("/orders/:id/status", validateUpdateOrderStatus, changeOrderStatus);

router.get("/users", listUsers);
router.post("/users", validateRegister, createUser);
router.put("/users/:id/status", validateUserStatus, updateUserStatus);

export default router;
