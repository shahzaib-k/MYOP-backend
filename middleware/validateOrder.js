import AppError from "../utils/AppError.js";
import { ORDER_STATUSES, isValidOrderStatus } from "../utils/orderStatus.js";

const requiredOrderFields = ["userId", "items", "totalPrice", "status"];
const requiredItemFields = ["foodId", "name", "price", "quantity"];

const isEmpty = (value) => {
  return value === undefined || value === null || String(value).trim() === "";
};

const isPositiveNumber = (value) => {
  return !Number.isNaN(Number(value)) && Number(value) > 0;
};

const getItemsTotal = (items) => {
  return items.reduce((total, item) => {
    return total + Number(item.price) * Number(item.quantity);
  }, 0);
};

const hasMatchingTotalPrice = (items, totalPrice) => {
  return Math.abs(getItemsTotal(items) - Number(totalPrice)) < 0.01;
};

const validateOrderItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "Items must be a non-empty array";
  }

  for (const [index, item] of items.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return `Item at index ${index} must be a valid object`;
    }

    const missingFields = requiredItemFields.filter((field) => isEmpty(item[field]));

    if (missingFields.length > 0) {
      return `Item at index ${index} is missing: ${missingFields.join(", ")}`;
    }

    if (!isPositiveNumber(item.price)) {
      return `Item price at index ${index} must be a valid positive number`;
    }

    if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
      return `Item quantity at index ${index} must be a positive integer`;
    }
  }

  return null;
};

export const validateCreateOrder = (req, res, next) => {
  const body = req.body || {};
  const missingFields = requiredOrderFields.filter((field) => isEmpty(body[field]));

  if (missingFields.length > 0) {
    return next(
      new AppError("Missing required order fields", 400, {
        missingFields,
      })
    );
  }

  const itemsError = validateOrderItems(body.items);

  if (itemsError) {
    return next(new AppError(itemsError, 400));
  }

  if (!isPositiveNumber(body.totalPrice)) {
    return next(new AppError("Total price must be a valid positive number", 400));
  }

  if (!hasMatchingTotalPrice(body.items, body.totalPrice)) {
    return next(new AppError("Total price must match item prices and quantities", 400));
  }

  if (!isValidOrderStatus(body.status)) {
    return next(
      new AppError("Invalid order status", 400, {
        allowedStatuses: ORDER_STATUSES,
      })
    );
  }

  next();
};

export const validateUpdateOrderStatus = (req, res, next) => {
  const body = req.body || {};
  const receivedFields = Object.keys(body);
  const invalidFields = receivedFields.filter((field) => field !== "status");

  if (receivedFields.length === 0) {
    return next(new AppError("Status is required", 400));
  }

  if (invalidFields.length > 0) {
    return next(
      new AppError("Only status can be updated from this endpoint", 400, {
        invalidFields,
      })
    );
  }

  if (isEmpty(body.status)) {
    return next(new AppError("Status is required", 400));
  }

  if (!isValidOrderStatus(body.status)) {
    return next(
      new AppError("Invalid order status", 400, {
        allowedStatuses: ORDER_STATUSES,
      })
    );
  }

  next();
};
