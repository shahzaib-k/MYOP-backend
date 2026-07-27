import { getDatabase } from "../config/firebase.js";
import { ORDER_STATUSES } from "../utils/orderStatus.js";
import { sortOrdersByDate } from "../utils/orderFilters.js";

const RECENT_ORDERS_LIMIT = 5;
const TOP_ITEMS_LIMIT = 5;

const roundAmount = (amount) => Math.round(amount * 100) / 100;

const readNode = async (node) => {
  const snapshot = await getDatabase().ref(node).once("value");
  return snapshot.val() || {};
};

const buildStatusCounts = (orders) => {
  const counts = Object.fromEntries(ORDER_STATUSES.map((status) => [status, 0]));

  for (const order of orders) {
    if (counts[order.status] !== undefined) {
      counts[order.status] += 1;
    }
  }

  return counts;
};

const buildTopSellingItems = (orders) => {
  const totals = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      const current = totals.get(item.foodId) || {
        foodId: item.foodId,
        name: item.name,
        quantity: 0,
        revenue: 0,
      };

      current.quantity += Number(item.quantity) || 0;
      current.revenue += Number(item.subtotal ?? item.price * item.quantity) || 0;
      totals.set(item.foodId, current);
    }
  }

  return [...totals.values()]
    .map((item) => ({ ...item, revenue: roundAmount(item.revenue) }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, TOP_ITEMS_LIMIT);
};

const buildRecentOrders = (orders) => {
  return sortOrdersByDate(orders, "desc")
    .slice(0, RECENT_ORDERS_LIMIT)
    .map((order) => ({
      orderId: order.orderId,
      customerName: order.customerName || "",
      totalPrice: order.totalPrice,
      status: order.status,
      createdAt: order.createdAt,
    }));
};

export const getDashboardStats = async () => {
  const [ordersNode, foodsNode, categoriesNode, usersNode] = await Promise.all([
    readNode("orders"),
    readNode("foods"),
    readNode("categories"),
    readNode("users"),
  ]);

  const orders = Object.entries(ordersNode).map(([id, order]) => ({
    ...order,
    orderId: id,
  }));

  const users = Object.values(usersNode);
  const completedRevenue = orders
    .filter((order) => order.status === "completed")
    .reduce((total, order) => total + (Number(order.totalPrice) || 0), 0);

  const budgetedOrders = orders.filter((order) => Number(order.budget) > 0);
  const averageBudget = budgetedOrders.length
    ? budgetedOrders.reduce((total, order) => total + Number(order.budget), 0) /
      budgetedOrders.length
    : 0;

  return {
    totals: {
      orders: orders.length,
      foods: Object.keys(foodsNode).length,
      categories: Object.keys(categoriesNode).length,
      customers: users.filter((user) => user.role === "customer").length,
      admins: users.filter((user) => user.role === "admin").length,
    },
    ordersByStatus: buildStatusCounts(orders),
    revenue: {
      completed: roundAmount(completedRevenue),
      averageOrderValue: orders.length
        ? roundAmount(
            orders.reduce(
              (total, order) => total + (Number(order.totalPrice) || 0),
              0
            ) / orders.length
          )
        : 0,
      averageBudget: roundAmount(averageBudget),
    },
    topSellingItems: buildTopSellingItems(orders),
    recentOrders: buildRecentOrders(orders),
  };
};
