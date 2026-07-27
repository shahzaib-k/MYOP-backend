const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const matchesSearch = (order, search) => {
  const term = search.trim().toLowerCase();

  if (term === "") {
    return true;
  }

  const haystack = [
    order.orderId,
    order.userId,
    order.customerName,
    order.customerEmail,
    ...(order.items || []).map((item) => item.name),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(term);
};

const isWithinDateRange = (order, startDate, endDate) => {
  const createdAt = new Date(order.createdAt).getTime();

  if (Number.isNaN(createdAt)) {
    return true;
  }

  if (startDate) {
    const start = new Date(startDate).getTime();

    if (!Number.isNaN(start) && createdAt < start) {
      return false;
    }
  }

  if (endDate) {
    const end = new Date(endDate).getTime();

    if (!Number.isNaN(end) && createdAt > end) {
      return false;
    }
  }

  return true;
};

export const filterOrders = (orders, { status, userId, search, startDate, endDate } = {}) => {
  return orders.filter((order) => {
    if (status && order.status !== status) {
      return false;
    }

    if (userId && order.userId !== userId) {
      return false;
    }

    if (search && !matchesSearch(order, search)) {
      return false;
    }

    return isWithinDateRange(order, startDate, endDate);
  });
};

export const sortOrdersByDate = (orders, sort = "desc") => {
  const direction = sort === "asc" ? 1 : -1;

  return [...orders].sort((a, b) => {
    return (
      direction *
      (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    );
  });
};

export const paginate = (items, { page = 1, limit = DEFAULT_LIMIT } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const totalItems = items.length;
  const totalPages = Math.max(Math.ceil(totalItems / safeLimit), 1);
  const safePage = Math.min(Math.max(Number(page) || 1, 1), totalPages);
  const startIndex = (safePage - 1) * safeLimit;

  return {
    items: items.slice(startIndex, startIndex + safeLimit),
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems,
      totalPages,
    },
  };
};
