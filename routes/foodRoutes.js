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

const router = express.Router();

router.post("/", validateCreateFood, createFoodItem);
router.get("/", getFoodItems);
router.get("/category/:category", getFoodItemsByCategory);
router.put("/:id", validateUpdateFood, updateFoodItem);
router.delete("/:id", deleteFoodItem);

export default router;
