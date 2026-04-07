import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env";
import authRoutes from "./routes/auth";
import bookingRoutes from "./routes/bookings";
import attorneyRoutes from "./routes/attorneys";
import attorneyDashboardRoutes from "./routes/dashboard/attorney";
import clientDashboardRoutes from "./routes/dashboard/client";
import stripeRoutes from "./routes/stripe";
import uploadRoutes from "./routes/upload";

const app = express();

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/attorneys", attorneyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/dashboard/attorney", attorneyDashboardRoutes);
app.use("/api/dashboard/client", clientDashboardRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/upload", uploadRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
