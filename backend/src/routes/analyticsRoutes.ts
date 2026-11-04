import { Router } from "express";
import { getAnalyticsSummary } from "../controllers/analyticsController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/summary", getAnalyticsSummary);

export default router;
