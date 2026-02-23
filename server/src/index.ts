/**
 * AegisVault Backend Server
 * Express + TypeScript + PostgreSQL + Prisma
 */

import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import passwordRoutes from "./routes/password.routes";
import documentRoutes from "./routes/document.routes";
import noteRoutes from "./routes/note.routes";
import activityRoutes from "./routes/activity.routes";
import { errorHandler } from "./middleware/error.middleware";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    // allow any origin in development for convenience (adjust in prod)
    origin: (origin, callback) => {
      if (!origin || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else if (
        process.env.FRONTEND_URL &&
        origin === process.env.FRONTEND_URL
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/passwords", passwordRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/activity", activityRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "AegisVault API is running" });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`AegisVault Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});

export default app;
