import app from "./app.js";
import { ensureDefaultAdmin } from "./services/authService.js";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", async (error) => {
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
