import AppError from "../utils/AppError.js";
import { getAllFoods, getFoodsByIds } from "./foodService.js";
import { getAllCategories } from "./categoryService.js";
import {
  buildPlatterSuggestion,
  findAddOns,
  findCheaperAlternatives,
  summarizePlatter,
} from "../utils/budgetPlanner.js";

const roundAmount = (amount) => Math.round(amount * 100) / 100;

const getSelectableFoods = async (categories) => {
  const [foods, activeCategories] = await Promise.all([
    getAllFoods(),
    getAllCategories({ activeOnly: true }),
  ]);

  const activeNames = new Set(activeCategories.map((category) => category.name));
  const requested = categories?.length
    ? new Set(categories.map((name) => name.trim().toLowerCase()))
    : null;

  return foods.filter((food) => {
    if (!activeNames.has(food.category)) {
      return false;
    }

    return requested ? requested.has(food.category.toLowerCase()) : true;
  });
};

export const suggestPlatter = async ({ budget, categories, maxItems }) => {
  const foods = await getSelectableFoods(categories);

  if (foods.length === 0) {
    throw new AppError("No food items are available for a suggestion", 404);
  }

  const suggestion = buildPlatterSuggestion(foods, {
    budget: Number(budget),
    ...(maxItems ? { maxItems: Number(maxItems) } : {}),
  });

  if (suggestion.items.length === 0) {
    throw new AppError("No food items fit inside this budget", 404, {
      budget: Number(budget),
      cheapestPrice: Math.min(...foods.map((food) => Number(food.price))),
    });
  }

  return suggestion;
};

export const reviewPlatter = async ({ budget, items }) => {
  const { foods, missingIds } = await getFoodsByIds(
    items.map((item) => item.foodId)
  );

  if (missingIds.length > 0) {
    throw new AppError("Some food items no longer exist", 400, { missingIds });
  }

  const platterItems = items.map((item) => {
    const food = foods.get(item.foodId);

    return {
      foodId: food.id,
      name: food.name,
      category: food.category,
      price: Number(food.price),
      quantity: Number(item.quantity),
      subtotal: roundAmount(Number(food.price) * Number(item.quantity)),
    };
  });

  const { totalPrice, itemCount } = summarizePlatter(platterItems);
  const remainingBudget = roundAmount(Number(budget) - totalPrice);
  const withinBudget = remainingBudget >= 0;
  const allFoods = await getSelectableFoods();

  return {
    items: platterItems,
    itemCount,
    totalPrice,
    budget: roundAmount(Number(budget)),
    remainingBudget,
    withinBudget,
    amountOverBudget: withinBudget ? 0 : roundAmount(Math.abs(remainingBudget)),
    addOns: withinBudget
      ? findAddOns(
          allFoods,
          remainingBudget,
          platterItems.map((item) => item.foodId)
        )
      : [],
    alternatives: withinBudget
      ? []
      : findCheaperAlternatives(
          allFoods,
          platterItems,
          roundAmount(Math.abs(remainingBudget))
        ),
  };
};
