import AppError from "../utils/AppError.js";
import { extractTokenFromHeader, verifyToken } from "../utils/jwt.js";
import { getUserById } from "../services/authService.js";

export const protect = async (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new AppError("Authentication token is required", 401);
    }

    const decoded = verifyToken(token);
    const user = await getUserById(decoded.userId);

    if (user.isActive === false) {
      throw new AppError("Account is disabled", 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.statusCode === 404) {
      return next(new AppError("User no longer exists", 401));
    }

    next(error);
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication token is required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    req.user = await getUserById(decoded.userId);
  } catch {
    req.user = undefined;
  }

  next();
};
