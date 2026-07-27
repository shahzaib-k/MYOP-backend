import AppError from "../utils/AppError.js";

const allowedFields = ["name", "description", "image", "isActive"];
const textFields = ["name", "description", "image"];

const isEmpty = (value) => {
  return value === undefined || value === null || String(value).trim() === "";
};

export const validateCreateCategory = (req, res, next) => {
  const body = req.body || {};

  if (isEmpty(body.name)) {
    return next(
      new AppError("Missing required category fields", 400, {
        missingFields: ["name"],
      })
    );
  }

  const invalidFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field)
  );

  if (invalidFields.length > 0) {
    return next(
      new AppError("Invalid category fields provided", 400, { invalidFields })
    );
  }

  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    return next(new AppError("isActive must be a boolean value", 400));
  }

  next();
};

export const validateUpdateCategory = (req, res, next) => {
  const body = req.body || {};
  const receivedFields = Object.keys(body);

  if (receivedFields.length === 0) {
    return next(new AppError("At least one field is required for update", 400));
  }

  const invalidFields = receivedFields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (invalidFields.length > 0) {
    return next(
      new AppError("Invalid category fields provided", 400, { invalidFields })
    );
  }

  if (body.name !== undefined && isEmpty(body.name)) {
    return next(new AppError("Category name cannot be empty", 400));
  }

  const emptyTextFields = textFields.filter((field) => {
    return field !== "name" && body[field] !== undefined && body[field] === null;
  });

  if (emptyTextFields.length > 0) {
    return next(
      new AppError("Category fields cannot be null", 400, {
        emptyFields: emptyTextFields,
      })
    );
  }

  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    return next(new AppError("isActive must be a boolean value", 400));
  }

  next();
};
