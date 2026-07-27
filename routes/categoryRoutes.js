import express from "express";
import {
  createFoodCategory,
  deleteFoodCategory,
  getFoodCategories,
  getFoodCategory,
  updateFoodCategory,
} from "../controllers/categoryController.js";
import {
  validateCreateCategory,
  validateUpdateCategory,
} from "../middleware/validateCategory.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getFoodCategories);
router.get("/:id", getFoodCategory);

router.post(
  "/",
  protect,
  restrictTo("admin"),
  validateCreateCategory,
  createFoodCategory
);
router.put(
  "/:id",
  protect,
  restrictTo("admin"),
  validateUpdateCategory,
  updateFoodCategory
);
router.delete("/:id", protect, restrictTo("admin"), deleteFoodCategory);

export default router;
