const DEFAULT_MAX_ITEMS = 6;
const DEFAULT_MAX_PER_CATEGORY = 2;
const SUGGESTION_LIMIT = 5;

const roundAmount = (amount) => Math.round(amount * 100) / 100;

const byPriceDescending = (a, b) => Number(b.price) - Number(a.price);
const byPriceAscending = (a, b) => Number(a.price) - Number(b.price);

const toSuggestionItem = (food) => ({
  foodId: food.id,
  name: food.name,
  category: food.category,
  price: Number(food.price),
  image: food.image || "",
});

/**
 * Greedy platter builder: spends as much of the budget as possible while
 * keeping variety across categories.
 */
export const buildPlatterSuggestion = (
  foods,
  { budget, maxItems = DEFAULT_MAX_ITEMS, maxPerCategory = DEFAULT_MAX_PER_CATEGORY } = {}
) => {
  const affordable = foods
    .filter((food) => Number(food.price) > 0 && Number(food.price) <= budget)
    .sort(byPriceDescending);

  const selected = [];
  const categoryCounts = new Map();
  let remaining = budget;

  const canTake = (food) => {
    const used = categoryCounts.get(food.category) || 0;

    return (
      Number(food.price) <= remaining &&
      used < maxPerCategory &&
      selected.length < maxItems
    );
  };

  const take = (food) => {
    selected.push(toSuggestionItem(food));
    categoryCounts.set(food.category, (categoryCounts.get(food.category) || 0) + 1);
    remaining = roundAmount(remaining - Number(food.price));
  };

  for (const food of affordable) {
    if (canTake(food)) {
      take(food);
    }
  }

  // Second pass: use up whatever budget is left with the cheapest options.
  const selectedIds = new Set(selected.map((item) => item.foodId));

  for (const food of [...affordable].sort(byPriceAscending)) {
    if (!selectedIds.has(food.id) && canTake(food)) {
      take(food);
      selectedIds.add(food.id);
    }
  }

  const totalPrice = roundAmount(
    selected.reduce((total, item) => total + item.price, 0)
  );

  return {
    items: selected,
    totalPrice,
    budget: roundAmount(budget),
    remainingBudget: roundAmount(budget - totalPrice),
  };
};

/**
 * Items that still fit inside the money the customer has left.
 */
export const findAddOns = (foods, remainingBudget, excludedIds = []) => {
  const excluded = new Set(excludedIds);

  return foods
    .filter(
      (food) =>
        !excluded.has(food.id) &&
        Number(food.price) > 0 &&
        Number(food.price) <= remainingBudget
    )
    .sort(byPriceDescending)
    .slice(0, SUGGESTION_LIMIT)
    .map(toSuggestionItem);
};

/**
 * Cheaper swaps from the same category, closest price first, so the customer
 * can get back under budget without losing the shape of their platter.
 */
export const findCheaperAlternatives = (foods, platterItems, amountOverBudget) => {
  const alternatives = [];

  for (const item of platterItems) {
    const cheaper = foods
      .filter(
        (food) =>
          food.category === item.category &&
          food.id !== item.foodId &&
          Number(food.price) < Number(item.price)
      )
      .sort(byPriceDescending)
      .slice(0, SUGGESTION_LIMIT)
      .map((food) => ({
        ...toSuggestionItem(food),
        savings: roundAmount(
          (Number(item.price) - Number(food.price)) * Number(item.quantity || 1)
        ),
      }))
      .filter((option) => option.savings > 0);

    if (cheaper.length > 0) {
      alternatives.push({
        replaceFoodId: item.foodId,
        replaceName: item.name,
        replacePrice: Number(item.price),
        options: cheaper,
        resolvesBudget: cheaper.some(
          (option) => option.savings >= amountOverBudget
        ),
      });
    }
  }

  return alternatives.slice(0, SUGGESTION_LIMIT);
};

export const summarizePlatter = (items) => {
  const totalPrice = items.reduce(
    (total, item) => total + Number(item.price) * Number(item.quantity),
    0
  );

  return {
    totalPrice: roundAmount(totalPrice),
    itemCount: items.reduce((count, item) => count + Number(item.quantity), 0),
  };
};
