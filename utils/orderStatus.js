export const ORDER_STATUSES = ["pending", "preparing", "completed", "cancelled"];

export const DEFAULT_ORDER_STATUS = "pending";

export const ORDER_STATUS_TRANSITIONS = {
  pending: ["preparing", "cancelled"],
  preparing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const isValidOrderStatus = (status) => ORDER_STATUSES.includes(status);

export const getAllowedNextStatuses = (currentStatus) => {
  return ORDER_STATUS_TRANSITIONS[currentStatus] || [];
};

export const canTransitionStatus = (currentStatus, nextStatus) => {
  return getAllowedNextStatuses(currentStatus).includes(nextStatus);
};
