import Stripe from "stripe";
import AppError from "../utils/AppError.js";

let stripeClient = null;

/**
 * Sandbox only: the secret key must be a test key (`sk_test_...`), so a live
 * key can never be used by accident.
 */
export const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new AppError("Online payments are not configured on the server", 503);
  }

  if (!secretKey.startsWith("sk_test_")) {
    throw new AppError(
      "Only Stripe test-mode keys (sk_test_...) are allowed in this environment",
      503
    );
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
};

export const getPublishableKey = () => process.env.STRIPE_PUBLISHABLE_KEY || null;

export const getPaymentCurrency = () =>
  (process.env.STRIPE_CURRENCY || "pkr").toLowerCase();
