import dns from "node:dns";
import mongoose from "mongoose";

// Ensure SRV DNS resolution succeeds across ISPs and Windows networks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if custom DNS cannot be configured
}

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/campusfix";

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    console.log(`[MongoDB] Connected successfully to database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("[MongoDB] Connection failed:", error);
    // Don't crash immediately so server can still serve health status or run with mock data
  }

  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] Runtime error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Disconnected. Reconnecting...");
  });
}
