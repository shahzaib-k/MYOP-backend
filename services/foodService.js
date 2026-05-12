import { getDatabase } from "../config/firebase.js";
import AppError from "../utils/AppError.js";

const getFoodsRef = () => getDatabase().ref("foods");

const formatFood = (id, food) => ({
  id,
  ...food,
});

export const createFood = async (foodData) => {
  const foodsRef = getFoodsRef();
  const newFoodRef = foodsRef.push();
  const now = new Date().toISOString();

  const food = {
    name: foodData.name.trim(),
    price: Number(foodData.price),
    category: foodData.category.trim(),
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

  await foodRef.update(updates);

  const updatedSnapshot = await foodRef.once("value");
  return formatFood(id, updatedSnapshot.val());
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
