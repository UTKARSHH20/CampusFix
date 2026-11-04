import { Request, Response } from "express";
import { StorageService } from "../services/storageService.js";

export async function getAnalyticsSummary(_req: Request, res: Response): Promise<void> {
  try {
    const data = await StorageService.getAnalytics();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to calculate analytics." });
  }
}
