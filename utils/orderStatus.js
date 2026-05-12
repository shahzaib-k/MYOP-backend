export const ORDER_STATUSES = ["pending", "preparing", "completed", "cancelled"];

export const isValidOrderStatus = (status) => ORDER_STATUSES.includes(status);
