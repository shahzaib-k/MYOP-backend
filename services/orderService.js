import { getDatabase } from "../config/firebase.js";
import AppError from "../utils/AppError.js";
import { getFoodsByIds } from "./foodService.js";
import {
  DEFAULT_ORDER_STATUS,
  canTransitionStatus,
  getAllowedNextStatuses,
} from "../utils/orderStatus.js";
import { filterOrders, paginate, sortOrdersByDate } from "../utils/orderFilters.js";

const PRICE_TOLERANCE = 0.01;

const getOrdersRef = () => getDatabase().ref("orders");

const formatOrder = (id, order) => ({
  ...order,
  orderId: id,
});

const roundAmount = (amount) => Math.round(amount * 100) / 100;

/**
 * Rebuilds order items from the `foods` node so item prices can never be
 * supplied by the client.
 */
const buildVerifiedItems = async (requestedItems) => {
  const { foods, missingIds } = await getFoodsByIds(
    requestedItems.map((item) => item.foodId)
  );

  if (missingIds.length > 0) {
    throw new AppError("Some food items no longer exist", 400, { missingIds });
  }

  return requestedItems.map((item) => {
    const food = foods.get(item.foodId);
    const quantity = Number(item.quantity);

    return {
      foodId: food.id,
      name: food.name,
      category: food.category,
      price: Number(food.price),
      quantity,
      subtotal: roundAmount(Number(food.price) * quantity),
    };
  });
};

const buildStatusHistoryEntry = (status, changedBy) => ({
  status,
  changedAt: new Date().toISOString(),
  changedBy: changedBy || "system",
});

export const createOrder = async (orderData, user) => {
  const items = await buildVerifiedItems(orderData.items);
  const totalPrice = roundAmount(
    items.reduce((total, item) => total + item.subtotal, 0)
  );

  if (
    orderData.totalPrice !== undefined &&
    Math.abs(Number(orderData.totalPrice) - totalPrice) > PRICE_TOLERANCE
  ) {
    throw new AppError("Total price does not match current food prices", 400, {
      expectedTotal: totalPrice,
      receivedTotal: Number(orderData.totalPrice),
    });
  }

  const budget =
    orderData.budget === undefined ? null : roundAmount(Number(orderData.budget));

  if (budget !== null && totalPrice > budget + PRICE_TOLERANCE) {
    throw new AppError("Order total exceeds the selected budget", 400, {
      budget,
      totalPrice,
    });
  }

  const newOrderRef = getOrdersRef().push();
  const now = new Date().toISOString();

  const order = {
    orderId: newOrderRef.key,
    userId: user.userId,
    customerName: user.name,
    customerEmail: user.email,
    items,
    totalPrice,
    budget,
    remainingBudget: budget === null ? null : roundAmount(budget - totalPrice),
    status: DEFAULT_ORDER_STATUS,
    statusHistory: [buildStatusHistoryEntry(DEFAULT_ORDER_STATUS, user.userId)],
    createdAt: now,
    updatedAt: now,
  };

  await newOrderRef.set(order);

  return order;
};

export const getAllOrders = async (filters = {}) => {
  const snapshot = await getOrdersRef().once("value");
  const orders = Object.entries(snapshot.val() || {}).map(([id, order]) =>
    formatOrder(id, order)
  );

  const filtered = filterOrders(orders, filters);
  const sorted = sortOrdersByDate(filtered, filters.sort);
  const { items, pagination } = paginate(sorted, filters);

  return { orders: items, pagination };
};

export const getOrderById = async (id) => {
  const snapshot = await getOrdersRef().child(id).once("value");

  if (!snapshot.exists()) {
    throw new AppError("Order not found", 404);
  }

  return formatOrder(id, snapshot.val());
};

export const getOrderForUser = async (id, user) => {
  const order = await getOrderById(id);

  if (user.role !== "admin" && order.userId !== user.userId) {
    throw new AppError("You do not have permission to view this order", 403);
  }

  return order;
};

export const updateOrderStatus = async (id, status, changedBy) => {
  const orderRef = getOrdersRef().child(id);
  const snapshot = await orderRef.once("value");

  if (!snapshot.exists()) {
    throw new AppError("Order not found", 404);
  }

  const order = snapshot.val();

  if (order.status === status) {
    throw new AppError(`Order is already marked as ${status}`, 400);
  }

  if (!canTransitionStatus(order.status, status)) {
    throw new AppError(
      `Order status cannot change from ${order.status} to ${status}`,
      400,
      { allowedStatuses: getAllowedNextStatuses(order.status) }
    );
  }

  const statusHistory = [
    ...(order.statusHistory || []),
    buildStatusHistoryEntry(status, changedBy),
  ];

  await orderRef.update({
    status,
    statusHistory,
    updatedAt: new Date().toISOString(),
  });

  const updatedSnapshot = await orderRef.once("value");
  return formatOrder(id, updatedSnapshot.val());
};

export const cancelOwnOrder = async (id, user) => {
  const order = await getOrderForUser(id, user);

  return updateOrderStatus(order.orderId, "cancelled", user.userId);
};

export const deleteOrder = async (id) => {
  const orderRef = getOrdersRef().child(id);
  const snapshot = await orderRef.once("value");

  if (!snapshot.exists()) {
    throw new AppError("Order not found", 404);
  }

  await orderRef.remove();
};
