import express from "express";
import {
  createFoodItem,
  deleteFoodItem,
  getFoodItems,
  getFoodItemsByCategory,
  updateFoodItem,
} from "../controllers/foodController.js";
import {
  validateCreateFood,
  validateUpdateFood,
} from "../middleware/validateFood.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getFoodItems);
router.get("/category/:category", getFoodItemsByCategory);

router.post(
  "/",
  protect,
  restrictTo("admin"),
  validateCreateFood,
  createFoodItem
);
router.put(
  "/:id",
  protect,
  restrictTo("admin"),
  validateUpdateFood,
  updateFoodItem
);
router.delete("/:id", protect, restrictTo("admin"), deleteFoodItem);

export default router;
