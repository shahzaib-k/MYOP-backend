import AppError from "../utils/AppError.js";

export const validateUserStatus = (req, res, next) => {
  const body = req.body || {};

  if (typeof body.isActive !== "boolean") {
    return next(new AppError("isActive must be a boolean value", 400));
  }

  if (req.params.id === req.user.userId) {
    return next(new AppError("You cannot change your own account status", 400));
  }

  next();
};

export const validateOrderQuery = (req, res, next) => {
  const { page, limit } = req.query;

  if (page !== undefined && (Number.isNaN(Number(page)) || Number(page) < 1)) {
    return next(new AppError("Page must be a positive number", 400));
  }

  if (limit !== undefined && (Number.isNaN(Number(limit)) || Number(limit) < 1)) {
    return next(new AppError("Limit must be a positive number", 400));
  }

  next();
};
