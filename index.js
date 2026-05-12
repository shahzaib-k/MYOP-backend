import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import foodRoutes from "./routes/foodRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorMiddleware.js";
import { sendSuccess } from "./utils/responseHelper.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  sendSuccess(res, 200, "Make Your Own Platter API is running");
});

app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, (error) => {
  if (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }

  console.log(`Server running on port ${PORT}`);
});

export { app, server };
