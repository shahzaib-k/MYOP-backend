import AppError from "../utils/AppError.js";
import { USER_ROLES, isValidRole } from "../utils/roles.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const isEmpty = (value) => {
  return value === undefined || value === null || String(value).trim() === "";
};

const getMissingFields = (body, fields) => {
  return fields.filter((field) => isEmpty(body[field]));
};

export const validateRegister = (req, res, next) => {
  const body = req.body || {};
  const missingFields = getMissingFields(body, ["name", "email", "password"]);

  if (missingFields.length > 0) {
    return next(
      new AppError("Missing required registration fields", 400, { missingFields })
    );
  }

  if (!EMAIL_PATTERN.test(body.email.trim())) {
    return next(new AppError("A valid email address is required", 400));
  }

  if (String(body.password).length < MIN_PASSWORD_LENGTH) {
    return next(
      new AppError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        400
      )
    );
  }

  if (body.role !== undefined && !isValidRole(body.role)) {
    return next(
      new AppError("Invalid user role", 400, { allowedRoles: USER_ROLES })
    );
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const body = req.body || {};
  const missingFields = getMissingFields(body, ["email", "password"]);

  if (missingFields.length > 0) {
    return next(
      new AppError("Missing required login fields", 400, { missingFields })
    );
  }

  next();
};

export const validateUpdateProfile = (req, res, next) => {
  const body = req.body || {};
  const allowedFields = ["name", "phone"];
  const receivedFields = Object.keys(body);

  if (receivedFields.length === 0) {
    return next(new AppError("At least one field is required for update", 400));
  }

  const invalidFields = receivedFields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (invalidFields.length > 0) {
    return next(
      new AppError("Invalid profile fields provided", 400, { invalidFields })
    );
  }

  const emptyFields = receivedFields.filter((field) => isEmpty(body[field]));

  if (emptyFields.length > 0) {
    return next(
      new AppError("Profile fields cannot be empty", 400, { emptyFields })
    );
  }

  next();
};

export const validateChangePassword = (req, res, next) => {
  const body = req.body || {};
  const missingFields = getMissingFields(body, ["currentPassword", "newPassword"]);

  if (missingFields.length > 0) {
    return next(
      new AppError("Missing required password fields", 400, { missingFields })
    );
  }

  if (String(body.newPassword).length < MIN_PASSWORD_LENGTH) {
    return next(
      new AppError(
        `New password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        400
      )
    );
  }

  if (body.currentPassword === body.newPassword) {
    return next(
      new AppError("New password must be different from the current password", 400)
    );
  }

  next();
};
