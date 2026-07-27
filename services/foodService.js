import { getDatabase } from "../config/firebase.js";
import AppError from "../utils/AppError.js";
import { ensureCategoryExists } from "./categoryService.js";

const getFoodsRef = () => getDatabase().ref("foods");

const formatFood = (id, food) => ({
  id,
  ...food,
});

export const createFood = async (foodData) => {
  const category = await ensureCategoryExists(foodData.category);
  const foodsRef = getFoodsRef();
  const newFoodRef = foodsRef.push();
  const now = new Date().toISOString();

  const food = {
    name: foodData.name.trim(),
    price: Number(foodData.price),
    category: category.name,
    image: foodData.image.trim(),
    description: foodData.description.trim(),
    createdAt: now,
    updatedAt: now,
  };

  await newFoodRef.set(food);

  return formatFood(newFoodRef.key, food);
};

export const getAllFoods = async () => {
  const foodsRef = getFoodsRef();
  const snapshot = await foodsRef.once("value");
  const foods = snapshot.val() || {};

  return Object.entries(foods).map(([id, food]) => formatFood(id, food));
};

export const getFoodsByCategory = async (category) => {
  const foodsRef = getFoodsRef();
  const snapshot = await foodsRef
    .orderByChild("category")
    .equalTo(category)
    .once("value");
  const foods = snapshot.val() || {};

  return Object.entries(foods).map(([id, food]) => formatFood(id, food));
};

export const updateFood = async (id, foodData) => {
  const foodsRef = getFoodsRef();
  const foodRef = foodsRef.child(id);
  const snapshot = await foodRef.once("value");

  if (!snapshot.exists()) {
    throw new AppError("Food item not found", 404);
  }

  const updates = {
    ...foodData,
    updatedAt: new Date().toISOString(),
  };

  if (updates.price !== undefined) {
    updates.price = Number(updates.price);
  }

  for (const key of ["name", "category", "image", "description"]) {
    if (updates[key] !== undefined) {
      updates[key] = updates[key].trim();
    }
  }

  if (updates.category !== undefined) {
    const category = await ensureCategoryExists(updates.category);
    updates.category = category.name;
  }

  await foodRef.update(updates);

  const updatedSnapshot = await foodRef.once("value");
  return formatFood(id, updatedSnapshot.val());
};

export const getFoodById = async (id) => {
  const snapshot = await getFoodsRef().child(id).once("value");

  if (!snapshot.exists()) {
    throw new AppError("Food item not found", 404);
  }

  return formatFood(id, snapshot.val());
};

export const getFoodsByIds = async (ids) => {
  const uniqueIds = [...new Set(ids)];
  const snapshots = await Promise.all(
    uniqueIds.map((id) => getFoodsRef().child(id).once("value"))
  );

  const foods = new Map();
  const missingIds = [];

  snapshots.forEach((snapshot, index) => {
    const id = uniqueIds[index];

    if (snapshot.exists()) {
      foods.set(id, formatFood(id, snapshot.val()));
    } else {
      missingIds.push(id);
    }
  });

  return { foods, missingIds };
};

export const deleteFood = async (id) => {
  const foodsRef = getFoodsRef();
  const foodRef = foodsRef.child(id);
  const snapshot = await foodRef.once("value");

  if (!snapshot.exists()) {
    throw new AppError("Food item not found", 404);
  }

  await foodRef.remove();
};
