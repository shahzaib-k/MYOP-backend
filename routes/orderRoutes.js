import express from "express";
import {
  cancelCustomerOrder,
  confirmCustomerOrderPayment,
  createCustomerOrder,
  deleteCustomerOrder,
  getMyOrders,
  getOrder,
} from "../controllers/orderController.js";
import { validateCreateOrder } from "../middleware/validateOrder.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", validateCreateOrder, createCustomerOrder);
router.get("/", getMyOrders);
router.get("/:id", getOrder);
router.put("/:id/cancel", cancelCustomerOrder);
router.post("/:id/confirm-payment", confirmCustomerOrderPayment);
router.delete("/:id", restrictTo("admin"), deleteCustomerOrder);

export default router;
