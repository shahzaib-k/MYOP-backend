import express from "express";
import {
  createCustomerOrder,
  deleteCustomerOrder,
  getOrder,
  getOrders,
  updateCustomerOrderStatus,
} from "../controllers/orderController.js";
import {
  validateCreateOrder,
  validateUpdateOrderStatus,
} from "../middleware/validateOrder.js";

const router = express.Router();

router.post("/", validateCreateOrder, createCustomerOrder);
router.get("/", getOrders);
router.get("/:id", getOrder);
router.put("/:id/status", validateUpdateOrderStatus, updateCustomerOrderStatus);
router.delete("/:id", deleteCustomerOrder);

export default router;
