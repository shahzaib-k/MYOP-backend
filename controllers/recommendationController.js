import {
  reviewPlatter,
  suggestPlatter,
} from "../services/recommendationService.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const getPlatterSuggestion = async (req, res, next) => {
  try {
    const suggestion = await suggestPlatter(req.body);
    return sendSuccess(res, 200, "Platter suggestion generated", suggestion);
  } catch (error) {
    next(error);
  }
};

export const getPlatterReview = async (req, res, next) => {
  try {
    const review = await reviewPlatter(req.body);
    return sendSuccess(res, 200, "Platter reviewed against budget", review);
  } catch (error) {
    next(error);
  }
};
