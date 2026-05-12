import { sendError } from "../utils/responseHelper.js";

export const notFoundHandler = (req, res) => {
  return sendError(res, 404, `Route not found: ${req.originalUrl}`);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  console.error(err);

  return sendError(res, statusCode, message, err.errors || null);
};
