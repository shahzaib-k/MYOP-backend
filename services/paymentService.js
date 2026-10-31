import { getPaymentCurrency, getPublishableKey, getStripe } from "../config/stripe.js";
import AppError from "../utils/AppError.js";

// Stripe amounts are in the smallest currency unit (paisa for PKR).
const toMinorUnits = (amount) => Math.round(amount * 100);

export const createPaymentIntent = async (order) => {
  const stripe = getStripe();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: toMinorUnits(order.totalPrice),
    currency: getPaymentCurrency(),
    automatic_payment_methods: { enabled: true },
    receipt_email: order.customerEmail || undefined,
    metadata: { orderId: order.orderId, userId: order.userId },
  });

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    publishableKey: getPublishableKey(),
  };
};

/** Reads the real state from Stripe — the client's word is never trusted. */
export const getPaymentIntentOutcome = async (paymentIntentId, order) => {
  const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.metadata?.orderId !== order.orderId) {
    throw new AppError("Payment does not belong to this order", 400);
  }

  if (paymentIntent.status === "succeeded") return "paid";
  if (paymentIntent.status === "canceled") return "failed";
  if (paymentIntent.last_payment_error) return "failed";
  return "pending";
};

export const cancelPaymentIntent = async (paymentIntentId) => {
  try {
    await getStripe().paymentIntents.cancel(paymentIntentId);
  } catch (error) {
    console.error("Could not cancel Stripe payment intent:", error.message);
  }
};
