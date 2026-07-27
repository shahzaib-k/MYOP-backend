import bcrypt from "bcryptjs";
import { getDatabase } from "../config/firebase.js";
import AppError from "../utils/AppError.js";
import { signToken } from "../utils/jwt.js";

const SALT_ROUNDS = 10;

const getUsersRef = () => getDatabase().ref("users");

const normalizeEmail = (email) => email.trim().toLowerCase();

const formatUser = (id, user) => ({
  userId: id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  role: user.role,
  isActive: user.isActive !== false,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const findUserByEmail = async (email) => {
  const snapshot = await getUsersRef()
    .orderByChild("email")
    .equalTo(normalizeEmail(email))
    .once("value");

  if (!snapshot.exists()) {
    return null;
  }

  const [id, user] = Object.entries(snapshot.val())[0];

  return { id, user };
};

const createUser = async ({ name, email, password, phone, role }) => {
  const existing = await findUserByEmail(email);

  if (existing) {
    throw new AppError("Email is already registered", 409);
  }

  const newUserRef = getUsersRef().push();
  const now = new Date().toISOString();

  const user = {
    name: name.trim(),
    email: normalizeEmail(email),
    password: await bcrypt.hash(password, SALT_ROUNDS),
    phone: phone?.trim() || "",
    role,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  await newUserRef.set(user);

  return formatUser(newUserRef.key, user);
};

const createSession = (user) => ({
  user,
  token: signToken({
    userId: user.userId,
    email: user.email,
    role: user.role,
  }),
});

export const registerCustomer = async (userData) => {
  const user = await createUser({ ...userData, role: "customer" });

  return createSession(user);
};

export const registerUserWithRole = async (userData) => {
  const user = await createUser({
    ...userData,
    role: userData.role || "customer",
  });

  return user;
};

export const loginUser = async ({ email, password }) => {
  const found = await findUserByEmail(email);

  if (!found) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await bcrypt.compare(password, found.user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  if (found.user.isActive === false) {
    throw new AppError("Account is disabled", 403);
  }

  return createSession(formatUser(found.id, found.user));
};

export const getUserById = async (id) => {
  const snapshot = await getUsersRef().child(id).once("value");

  if (!snapshot.exists()) {
    throw new AppError("User not found", 404);
  }

  return formatUser(id, snapshot.val());
};

export const getAllUsers = async ({ role } = {}) => {
  const snapshot = await getUsersRef().once("value");
  const users = snapshot.val() || {};

  return Object.entries(users)
    .map(([id, user]) => formatUser(id, user))
    .filter((user) => (role ? user.role === role : true));
};

export const updateUserProfile = async (id, updates) => {
  const userRef = getUsersRef().child(id);
  const snapshot = await userRef.once("value");

  if (!snapshot.exists()) {
    throw new AppError("User not found", 404);
  }

  const allowedUpdates = {};

  for (const key of ["name", "phone"]) {
    if (updates[key] !== undefined) {
      allowedUpdates[key] = updates[key].trim();
    }
  }

  allowedUpdates.updatedAt = new Date().toISOString();

  await userRef.update(allowedUpdates);

  const updatedSnapshot = await userRef.once("value");
  return formatUser(id, updatedSnapshot.val());
};

export const changeUserPassword = async (id, { currentPassword, newPassword }) => {
  const userRef = getUsersRef().child(id);
  const snapshot = await userRef.once("value");

  if (!snapshot.exists()) {
    throw new AppError("User not found", 404);
  }

  const isPasswordValid = await bcrypt.compare(
    currentPassword,
    snapshot.val().password
  );

  if (!isPasswordValid) {
    throw new AppError("Current password is incorrect", 401);
  }

  await userRef.update({
    password: await bcrypt.hash(newPassword, SALT_ROUNDS),
    updatedAt: new Date().toISOString(),
  });
};

export const setUserActiveStatus = async (id, isActive) => {
  const userRef = getUsersRef().child(id);
  const snapshot = await userRef.once("value");

  if (!snapshot.exists()) {
    throw new AppError("User not found", 404);
  }

  await userRef.update({
    isActive: Boolean(isActive),
    updatedAt: new Date().toISOString(),
  });

  const updatedSnapshot = await userRef.once("value");
  return formatUser(id, updatedSnapshot.val());
};

export const ensureDefaultAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return null;
  }

  const existing = await findUserByEmail(email);

  if (existing) {
    return formatUser(existing.id, existing.user);
  }

  return createUser({
    name: process.env.ADMIN_NAME || "Administrator",
    email,
    password,
    role: "admin",
  });
};
