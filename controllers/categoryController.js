import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "../services/categoryService.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const createFoodCategory = async (req, res, next) => {
  try {
    const category = await createCategory(req.body);
    return sendSuccess(res, 201, "Category created successfully", category);
  } catch (error) {
    next(error);
  }
};

export const getFoodCategories = async (req, res, next) => {
  try {
    const activeOnly = req.query.activeOnly === "true";
    const categories = await getAllCategories({ activeOnly });
    return sendSuccess(res, 200, "Categories fetched successfully", categories);
  } catch (error) {
    next(error);
  }
};

export const getFoodCategory = async (req, res, next) => {
  try {
    const category = await getCategoryById(req.params.id);
    return sendSuccess(res, 200, "Category fetched successfully", category);
  } catch (error) {
    next(error);
  }
};

export const updateFoodCategory = async (req, res, next) => {
  try {
    const category = await updateCategory(req.params.id, req.body);
    return sendSuccess(res, 200, "Category updated successfully", category);
  } catch (error) {
    next(error);
  }
};

export const deleteFoodCategory = async (req, res, next) => {
  try {
    await deleteCategory(req.params.id);
    return sendSuccess(res, 200, "Category deleted successfully");
  } catch (error) {
    next(error);
  }
};
