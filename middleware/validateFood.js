import AppError from "../utils/AppError.js";

const requiredFields = ["name", "price", "category", "image", "description"];
const textFields = ["name", "category", "image", "description"];

const isEmpty = (value) => {
  return value === undefined || value === null || String(value).trim() === "";
};

const isValidPrice = (price) => {
  return !Number.isNaN(Number(price)) && Number(price) > 0;
};

export const validateCreateFood = (req, res, next) => {
  const missingFields = requiredFields.filter((field) => isEmpty(req.body[field]));

  if (missingFields.length > 0) {
    return next(
      new AppError("Missing required food fields", 400, {
        missingFields,
      })
    );
  }

  if (!isValidPrice(req.body.price)) {
    return next(new AppError("Price must be a valid positive number", 400));
  }

  next();
};

export const validateUpdateFood = (req, res, next) => {
  const allowedFields = requiredFields;
  const receivedFields = Object.keys(req.body);
  const invalidFields = receivedFields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (receivedFields.length === 0) {
    return next(new AppError("At least one field is required for update", 400));
  }

  if (invalidFields.length > 0) {
    return next(
      new AppError("Invalid food fields provided", 400, {
        invalidFields,
      })
    );
  }

  const emptyTextFields = textFields.filter((field) => {
    return req.body[field] !== undefined && isEmpty(req.body[field]);
  });

  if (emptyTextFields.length > 0) {
    return next(
      new AppError("Food fields cannot be empty", 400, {
        emptyFields: emptyTextFields,
      })
    );
  }

  if (req.body.price !== undefined && !isValidPrice(req.body.price)) {
    return next(new AppError("Price must be a valid positive number", 400));
  }

  next();
};
