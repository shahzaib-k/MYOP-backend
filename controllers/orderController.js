import {
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from "../services/orderService.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const createCustomerOrder = async (req, res, next) => {
  try {
    const order = await createOrder(req.body);
    return sendSuccess(res, 201, "Order created successfully", order);
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const orders = await getAllOrders();
    return sendSuccess(res, 200, "Orders fetched successfully", orders);
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);
    return sendSuccess(res, 200, "Order fetched successfully", order);
  } catch (error) {
    next(error);
  }
};

export const updateCustomerOrderStatus = async (req, res, next) => {
  try {
    const order = await updateOrderStatus(req.params.id, req.body.status);
    return sendSuccess(res, 200, "Order status updated successfully", order);
  } catch (error) {
    next(error);
  }
};

export const deleteCustomerOrder = async (req, res, next) => {
  try {
    await deleteOrder(req.params.id);
    return sendSuccess(res, 200, "Order deleted successfully");
  } catch (error) {
    next(error);
  }
};
