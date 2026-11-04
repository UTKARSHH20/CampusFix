import { Router } from "express";
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateDispatch,
  resolveComplaint,
  rateComplaint,
  deleteComplaint,
} from "../controllers/complaintController.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/", createComplaint);
router.get("/", getComplaints);
router.get("/:id", getComplaintById);
router.patch("/:id/dispatch", requireAdmin, updateDispatch);
router.post("/:id/dispatch", requireAdmin, updateDispatch);
router.patch("/:id/resolve", requireAdmin, resolveComplaint);
router.post("/:id/resolve", requireAdmin, resolveComplaint);
router.post("/:id/rate", rateComplaint);
router.delete("/:id", deleteComplaint);

export default router;
