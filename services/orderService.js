import { getDatabase } from "../config/firebase.js";
import AppError from "../utils/AppError.js";

const getOrdersRef = () => getDatabase().ref("orders");

const formatOrder = (id, order) => ({
  ...order,
  orderId: id,
});

const formatOrderItem = (item) => ({
  foodId: item.foodId.trim(),
  name: item.name.trim(),
  price: Number(item.price),
  quantity: Number(item.quantity),
});

export const createOrder = async (orderData) => {
  const ordersRef = getOrdersRef();
  const newOrderRef = ordersRef.push();
  const now = new Date().toISOString();

  const order = {
    orderId: newOrderRef.key,
    userId: orderData.userId.trim(),
    items: orderData.items.map(formatOrderItem),
    totalPrice: Number(orderData.totalPrice),
    status: orderData.status,
    createdAt: now,
    updatedAt: now,
  };

  await newOrderRef.set(order);

  return order;
};

export const getAllOrders = async () => {
  const ordersRef = getOrdersRef();
  const snapshot = await ordersRef.once("value");
  const orders = snapshot.val() || {};

  return Object.entries(orders).map(([id, order]) => formatOrder(id, order));
};

export const getOrderById = async (id) => {
  const orderRef = getOrdersRef().child(id);
  const snapshot = await orderRef.once("value");

  if (!snapshot.exists()) {
    throw new AppError("Order not found", 404);
  }

  return formatOrder(id, snapshot.val());
};

export const updateOrderStatus = async (id, status) => {
  const orderRef = getOrdersRef().child(id);
  const snapshot = await orderRef.once("value");

  if (!snapshot.exists()) {
    throw new AppError("Order not found", 404);
  }

  await orderRef.update({
    status,
    updatedAt: new Date().toISOString(),
  });

  const updatedSnapshot = await orderRef.once("value");
  return formatOrder(id, updatedSnapshot.val());
};

export const deleteOrder = async (id) => {
  const orderRef = getOrdersRef().child(id);
  const snapshot = await orderRef.once("value");

  if (!snapshot.exists()) {
    throw new AppError("Order not found", 404);
  }

  await orderRef.remove();
};
