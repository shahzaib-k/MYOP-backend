import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import foodRoutes from "./routes/foodRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import { sendSuccess } from "./utils/responseHelper.js";
import { ensureDefaultAdmin } from "./services/authService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  sendSuccess(res, 200, "Make Your Own Platter API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, async (error) => {
  if (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }

  console.log(`Server running on port ${PORT}`);

  try {
    const admin = await ensureDefaultAdmin();

    if (admin) {
      console.log(`Default admin account ready: ${admin.email}`);
    }
  } catch (adminError) {
    console.error(`Could not prepare default admin: ${adminError.message}`);
  }
});

export { app, server };
