import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { StorageService } from "../services/storageService.js";

function getParamId(req: AuthRequest): string {
  const raw = req.params.id;
  return Array.isArray(raw) ? raw[0] : String(raw);
}

export async function createComplaint(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      title,
      description,
      category,
      location,
      locationDetails,
      urgency,
      imageUrls,
    } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: "Title and description are required." });
      return;
    }

    const complaintData = {
      studentId: req.user?.uid || "student-1",
      studentName: req.user?.name || "Student User",
      studentEmail: req.user?.email || "student@campusfix.local",
      title: String(title).trim(),
      description: String(description).trim(),
      category: category || "Other",
      location: location || "Other Campus Area",
      locationDetails: locationDetails || "",
      urgency: urgency || "Medium",
      status: "Submitted",
      priority: urgency === "Urgent" ? "Urgent" : urgency === "High" ? "High" : "Medium",
      department: "Unassigned",
      imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
      resolutionProofUrls: [],
    };

    const saved = await StorageService.create(complaintData);
    res.status(201).json({ complaint: saved });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to create complaint." });
  }
}

export async function getComplaints(req: AuthRequest, res: Response): Promise<void> {
  try {
    const {
      category,
      location,
      status,
      priority,
      department,
      search,
      studentId,
    } = req.query;

    const complaints = await StorageService.getAll({
      category: category ? String(category) : undefined,
      location: location ? String(location) : undefined,
      status: status ? String(status) : undefined,
      priority: priority ? String(priority) : undefined,
      department: department ? String(department) : undefined,
      search: search ? String(search) : undefined,
      studentId: studentId ? String(studentId) : undefined,
    });

    res.json({ complaints });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to retrieve complaints." });
  }
}

export async function getComplaintById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const complaint = await StorageService.getById(id);
    if (!complaint) {
      res.status(404).json({ error: "Complaint not found." });
      return;
    }
    res.json({ complaint });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve complaint." });
  }
}

export async function updateDispatch(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const { department, priority, status, assignedStaff } = req.body;
    const updates: Record<string, unknown> = {};

    if (department !== undefined) updates.department = department;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;
    if (assignedStaff !== undefined) updates.assignedStaff = assignedStaff;

    const updated = await StorageService.update(id, updates);
    if (!updated) {
      res.status(404).json({ error: "Complaint not found." });
      return;
    }

    res.json({ complaint: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update dispatch." });
  }
}

export async function resolveComplaint(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const { resolution, resolutionProofUrls } = req.body;
    const updates: Record<string, unknown> = {
      status: "Resolved",
      resolution: resolution || "Issue resolved by campus maintenance.",
      resolvedAt: new Date().toISOString(),
    };

    if (Array.isArray(resolutionProofUrls)) {
      updates.resolutionProofUrls = resolutionProofUrls;
    }

    const updated = await StorageService.update(id, updates);
    if (!updated) {
      res.status(404).json({ error: "Complaint not found." });
      return;
    }

    res.json({ complaint: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to resolve complaint." });
  }
}

export async function rateComplaint(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const { rating, feedback } = req.body;
    const updates: Record<string, unknown> = {
      rating: Number(rating),
    };
    if (feedback !== undefined) updates.feedback = String(feedback);

    const updated = await StorageService.update(id, updates);
    if (!updated) {
      res.status(404).json({ error: "Complaint not found." });
      return;
    }

    res.json({ complaint: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to save rating." });
  }
}

export async function deleteComplaint(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = getParamId(req);
    const deleted = await StorageService.delete(id);
    if (!deleted) {
      res.status(404).json({ error: "Complaint not found." });
      return;
    }
    res.json({ message: "Complaint deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete complaint." });
  }
}
