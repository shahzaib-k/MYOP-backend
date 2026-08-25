import { Expo } from "expo-server-sdk";
import { getDatabase } from "../config/firebase.js";
import AppError from "../utils/AppError.js";

const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });

const getPushTokensRef = (userId) => getDatabase().ref(`users/${userId}/pushTokens`);

const readPushTokens = async (userId) => {
  const snapshot = await getPushTokensRef(userId).once("value");
  return snapshot.val() || [];
};

export const savePushToken = async (userId, token) => {
  if (!Expo.isExpoPushToken(token)) {
    throw new AppError("A valid Expo push token is required", 400);
  }

  const tokens = await readPushTokens(userId);

  if (!tokens.includes(token)) {
    await getPushTokensRef(userId).set([...tokens, token]);
  }
};

const removePushToken = async (userId, token) => {
  const tokens = await readPushTokens(userId);
  await getPushTokensRef(userId).set(tokens.filter((existing) => existing !== token));
};

/**
 * Best-effort push notification: a delivery failure must never break order
 * creation or a status update, so every error is caught and logged here
 * rather than propagated.
 *
 * Only immediate ticket errors are handled (e.g. a token Expo already knows
 * is dead). Catching every stale token would need polling
 * getPushNotificationReceiptsAsync ~15 minutes after sending, which is more
 * infrastructure (a delayed job) than this app currently has.
 */
export const sendPushNotification = async (userId, { title, body, data = {} }) => {
  try {
    const tokens = (await readPushTokens(userId)).filter((token) =>
      Expo.isExpoPushToken(token)
    );

    if (tokens.length === 0) {
      console.log(`[push] No push tokens registered for user ${userId} — skipping.`);
      return;
    }

    console.log(`[push] Sending "${title}" to user ${userId} (${tokens.length} token(s)).`);

    const messages = tokens.map((token) => ({
      to: token,
      title,
      body,
      data,
      sound: "default",
    }));

    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);

      tickets.forEach((ticket, index) => {
        if (ticket.status === "error") {
          console.error(`[push] Error for user ${userId}:`, ticket.message, ticket.details);

          if (ticket.details?.error === "DeviceNotRegistered") {
            removePushToken(userId, chunk[index].to).catch(() => {});
          }
        } else {
          console.log(`[push] Accepted by Expo for user ${userId}, ticket id ${ticket.id}`);
        }
      });
    }
  } catch (error) {
    console.error(`Failed to send push notification to user ${userId}:`, error.message);
  }
};
