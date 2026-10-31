export const PAYMENT_METHODS = ["cod", "card"];

export const PAYMENT_STATUSES = ["pending", "paid", "failed"];

export const isValidPaymentMethod = (method) => PAYMENT_METHODS.includes(method);
