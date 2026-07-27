import { getDashboardStats } from "../services/adminService.js";
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from "../services/orderService.js";
import {
  getAllUsers,
  registerUserWithRole,
  setUserActiveStatus,
} from "../services/authService.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const getDashboard = async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    return sendSuccess(res, 200, "Dashboard stats fetched successfully", stats);
  } catch (error) {
    next(error);
  }
};

export const listOrders = async (req, res, next) => {
  try {
    const { orders, pagination } = await getAllOrders(req.query);
    return sendSuccess(res, 200, "Orders fetched successfully", {
      orders,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetails = async (req, res, next) => {
  try {
    const order = await getOrderById(req.params.id);
    return sendSuccess(res, 200, "Order fetched successfully", order);
  } catch (error) {
    next(error);
  }
};

export const changeOrderStatus = async (req, res, next) => {
  try {
    const order = await updateOrderStatus(
      req.params.id,
      req.body.status,
      req.user.userId
    );

    return sendSuccess(res, 200, "Order status updated successfully", order);
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const users = await getAllUsers({ role: req.query.role });
    return sendSuccess(res, 200, "Users fetched successfully", users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const user = await registerUserWithRole(req.body);
    return sendSuccess(res, 201, "User created successfully", user);
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req, res, next) => {
  try {
    const user = await setUserActiveStatus(req.params.id, req.body.isActive);
    return sendSuccess(res, 200, "User status updated successfully", user);
  } catch (error) {
    next(error);
  }
};
