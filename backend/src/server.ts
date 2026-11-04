import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: (_origin, callback) => {
      // Allow all origins (localhost, any Vercel domain, etc.)
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Connect to MongoDB
connectDB();

// Root endpoint
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "CampusFix Backend Service",
    database: "Connected to MongoDB Atlas",
  });
});

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CampusFix Backend Service",
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/complaints", complaintRoutes);
app.use("/api/analytics", analyticsRoutes);

app.listen(PORT, () => {
  console.log(`[CampusFix Backend] Server running on http://localhost:${PORT}`);
});

export default app;
