import {
  cancelOwnOrder,
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrderForUser,
} from "../services/orderService.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const createCustomerOrder = async (req, res, next) => {
  try {
    const order = await createOrder(req.body, req.user);
    return sendSuccess(res, 201, "Order created successfully", order);
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const { orders, pagination } = await getAllOrders({
      ...req.query,
      userId: req.user.userId,
    });

    return sendSuccess(res, 200, "Orders fetched successfully", {
      orders,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req, res, next) => {
  try {
    const order = await getOrderForUser(req.params.id, req.user);
    return sendSuccess(res, 200, "Order fetched successfully", order);
  } catch (error) {
    next(error);
  }
};

export const cancelCustomerOrder = async (req, res, next) => {
  try {
    const order = await cancelOwnOrder(req.params.id, req.user);
    return sendSuccess(res, 200, "Order cancelled successfully", order);
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
