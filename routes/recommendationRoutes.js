import express from "express";
import {
  getPlatterReview,
  getPlatterSuggestion,
} from "../controllers/recommendationController.js";
import {
  validateReview,
  validateSuggestion,
} from "../middleware/validateRecommendation.js";

const router = express.Router();

router.post("/platter", validateSuggestion, getPlatterSuggestion);
router.post("/review", validateReview, getPlatterReview);

export default router;
