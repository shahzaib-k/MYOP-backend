import AppError from "../utils/AppError.js";

const isPositiveNumber = (value) => {
  return !Number.isNaN(Number(value)) && Number(value) > 0;
};

const validateBudget = (budget) => {
  if (budget === undefined || budget === null || String(budget).trim() === "") {
    return "Budget is required";
  }

  if (!isPositiveNumber(budget)) {
    return "Budget must be a valid positive number";
  }

  return null;
};

export const validateSuggestion = (req, res, next) => {
  const body = req.body || {};
  const budgetError = validateBudget(body.budget);

  if (budgetError) {
    return next(new AppError(budgetError, 400));
  }

  if (body.categories !== undefined) {
    if (!Array.isArray(body.categories)) {
      return next(new AppError("Categories must be an array of names", 400));
    }

    const invalid = body.categories.some(
      (name) => typeof name !== "string" || name.trim() === ""
    );

    if (invalid) {
      return next(new AppError("Category names must be non-empty strings", 400));
    }
  }

  if (body.maxItems !== undefined) {
    if (!Number.isInteger(Number(body.maxItems)) || Number(body.maxItems) <= 0) {
      return next(new AppError("maxItems must be a positive integer", 400));
    }
  }

  next();
};

export const validateReview = (req, res, next) => {
  const body = req.body || {};
  const budgetError = validateBudget(body.budget);

  if (budgetError) {
    return next(new AppError(budgetError, 400));
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return next(new AppError("Items must be a non-empty array", 400));
  }

  for (const [index, item] of body.items.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return next(new AppError(`Item at index ${index} must be a valid object`, 400));
    }

    if (!item.foodId || String(item.foodId).trim() === "") {
      return next(new AppError(`Item at index ${index} is missing: foodId`, 400));
    }

    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
      return next(
        new AppError(
          `Item quantity at index ${index} must be a positive integer`,
          400
        )
      );
    }
  }

  next();
};
