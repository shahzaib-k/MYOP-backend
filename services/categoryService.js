import { getDatabase } from "../config/firebase.js";
import AppError from "../utils/AppError.js";

const getCategoriesRef = () => getDatabase().ref("categories");

const formatCategory = (id, category) => ({
  id,
  ...category,
});

const toCategoryList = (categories) => {
  return Object.entries(categories).map(([id, category]) =>
    formatCategory(id, category)
  );
};

const findCategoryByName = async (name, ignoreId = null) => {
  const snapshot = await getCategoriesRef().once("value");
  const categories = snapshot.val() || {};

  const match = Object.entries(categories).find(([id, category]) => {
    if (ignoreId && id === ignoreId) {
      return false;
    }

    return category.name.trim().toLowerCase() === name.trim().toLowerCase();
  });

  return match ? formatCategory(match[0], match[1]) : null;
};

export const createCategory = async (categoryData) => {
  const existing = await findCategoryByName(categoryData.name);

  if (existing) {
    throw new AppError("Category name already exists", 409);
  }

  const categoriesRef = getCategoriesRef();
  const newCategoryRef = categoriesRef.push();
  const now = new Date().toISOString();

  const category = {
    name: categoryData.name.trim(),
    description: categoryData.description?.trim() || "",
    image: categoryData.image?.trim() || "",
    isActive: categoryData.isActive === undefined ? true : Boolean(categoryData.isActive),
    createdAt: now,
    updatedAt: now,
  };

  await newCategoryRef.set(category);

  return formatCategory(newCategoryRef.key, category);
};

export const getAllCategories = async ({ activeOnly = false } = {}) => {
  const snapshot = await getCategoriesRef().once("value");
  const categories = toCategoryList(snapshot.val() || {});

  if (activeOnly) {
    return categories.filter((category) => category.isActive !== false);
  }

  return categories;
};

export const getCategoryById = async (id) => {
  const snapshot = await getCategoriesRef().child(id).once("value");

  if (!snapshot.exists()) {
    throw new AppError("Category not found", 404);
  }

  return formatCategory(id, snapshot.val());
};

export const updateCategory = async (id, categoryData) => {
  const categoryRef = getCategoriesRef().child(id);
  const snapshot = await categoryRef.once("value");

  if (!snapshot.exists()) {
    throw new AppError("Category not found", 404);
  }

  if (categoryData.name !== undefined) {
    const existing = await findCategoryByName(categoryData.name, id);

    if (existing) {
      throw new AppError("Category name already exists", 409);
    }
  }

  const updates = {
    ...categoryData,
    updatedAt: new Date().toISOString(),
  };

  for (const key of ["name", "description", "image"]) {
    if (updates[key] !== undefined) {
      updates[key] = updates[key].trim();
    }
  }

  if (updates.isActive !== undefined) {
    updates.isActive = Boolean(updates.isActive);
  }

  await categoryRef.update(updates);

  const updatedSnapshot = await categoryRef.once("value");
  return formatCategory(id, updatedSnapshot.val());
};

export const deleteCategory = async (id) => {
  const categoryRef = getCategoriesRef().child(id);
  const snapshot = await categoryRef.once("value");

  if (!snapshot.exists()) {
    throw new AppError("Category not found", 404);
  }

  const category = snapshot.val();
  const foodsSnapshot = await getDatabase()
    .ref("foods")
    .orderByChild("category")
    .equalTo(category.name)
    .once("value");

  if (foodsSnapshot.exists()) {
    throw new AppError(
      "Category cannot be deleted while food items are using it",
      409,
      { foodCount: Object.keys(foodsSnapshot.val()).length }
    );
  }

  await categoryRef.remove();
};

export const ensureCategoryExists = async (name) => {
  const category = await findCategoryByName(name);

  if (!category) {
    throw new AppError("Category does not exist", 400, { category: name });
  }

  if (category.isActive === false) {
    throw new AppError("Category is not active", 400, { category: name });
  }

  return category;
};
