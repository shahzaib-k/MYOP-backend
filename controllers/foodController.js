import {
  createFood,
  deleteFood,
  getAllFoods,
  getFoodsByCategory,
  updateFood,
} from "../services/foodService.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const createFoodItem = async (req, res, next) => {
  try {
    const food = await createFood(req.body);
    return sendSuccess(res, 201, "Food item created successfully", food);
  } catch (error) {
    next(error);
  }
};

export const getFoodItems = async (req, res, next) => {
  try {
    const foods = await getAllFoods();
    return sendSuccess(res, 200, "Food items fetched successfully", foods);
  } catch (error) {
    next(error);
  }
};

export const getFoodItemsByCategory = async (req, res, next) => {
  try {
    const foods = await getFoodsByCategory(req.params.category);
    return sendSuccess(res, 200, "Food items fetched by category", foods);
  } catch (error) {
    next(error);
  }
};

export const updateFoodItem = async (req, res, next) => {
  try {
    const food = await updateFood(req.params.id, req.body);
    return sendSuccess(res, 200, "Food item updated successfully", food);
  } catch (error) {
    next(error);
  }
};

export const deleteFoodItem = async (req, res, next) => {
  try {
    await deleteFood(req.params.id);
    return sendSuccess(res, 200, "Food item deleted successfully");
  } catch (error) {
    next(error);
  }
};
