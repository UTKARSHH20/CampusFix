import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { Complaint, IComplaint } from "../models/Complaint.js";

const dataDir = path.resolve(process.cwd(), "data");
const storageFilePath = path.join(dataDir, "complaints.json");

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial seed if file doesn't exist
if (!fs.existsSync(storageFilePath)) {
  const initialData = [
    {
      _id: "CAMPUS-1042",
      studentId: "student-1",
      studentName: "Aarav Sharma",
      studentEmail: "aarav@campusfix.local",
      title: "Hostel Wi-Fi has been down for two days",
      description: "The access point on the second floor corridor keeps resetting and won't assign IP addresses.",
      category: "Network / Wi-Fi",
      location: "Hostel Block B",
      locationDetails: "2nd Floor Corridor, Wing B",
      urgency: "High",
      status: "In Progress",
      department: "IT Department",
      priority: "High",
      assignedStaff: "Sanjay (Network Admin)",
      imageUrls: [
        "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=60"
      ],
      resolutionProofUrls: [],
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    },
    {
      _id: "CAMPUS-1017",
      studentId: "student-2",
      studentName: "Priya Patel",
      studentEmail: "priya@campusfix.local",
      title: "Water cooler near the library is leaking",
      description: "Water is pooling on the floor beside the east reading room entrance, creating a slipping hazard.",
      category: "Plumbing / Water",
      location: "Central Library",
      locationDetails: "Ground floor, East Wing",
      urgency: "Urgent",
      status: "Resolved",
      department: "Facilities",
      priority: "Urgent",
      assignedStaff: "Ramesh (Plumbing Team)",
      resolution: "Replaced faulty intake valve and dried floor. New rubber seals installed.",
      rating: 5,
      feedback: "Fixed within 2 hours, excellent job!",
      imageUrls: [
        "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=60"
      ],
      resolutionProofUrls: [],
      createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    }
  ];
  fs.writeFileSync(storageFilePath, JSON.stringify(initialData, null, 2), "utf-8");
}

function readStoredComplaints(): Record<string, unknown>[] {
  try {
    const raw = fs.readFileSync(storageFilePath, "utf-8");
    return JSON.parse(raw) as Record<string, unknown>[];
  } catch (err) {
    console.error("[Storage] Failed to read storage file:", err);
    return [];
  }
}

function writeStoredComplaints(complaints: Record<string, unknown>[]): void {
  try {
    fs.writeFileSync(storageFilePath, JSON.stringify(complaints, null, 2), "utf-8");
  } catch (err) {
    console.error("[Storage] Failed to write storage file:", err);
  }
}

export const StorageService = {
  async create(data: Record<string, unknown>): Promise<Record<string, unknown>> {
    // If MongoDB is connected, save to MongoDB
    if (mongoose.connection.readyState === 1) {
      try {
        const item = new Complaint(data);
        const saved = await item.save();
        const obj = saved.toObject();
        // Also persist to file mirror
        const all = readStoredComplaints();
        all.unshift(obj as unknown as Record<string, unknown>);
        writeStoredComplaints(all);
        return obj as unknown as Record<string, unknown>;
      } catch (err) {
        console.warn("[Storage] MongoDB save failed, falling back to persistent file store:", err);
      }
    }

    // File storage fallback
    const all = readStoredComplaints();
    const newId = `CAMPUS-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const newDoc = {
      _id: newId,
      id: newId,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    all.unshift(newDoc);
    writeStoredComplaints(all);
    console.log(`[Storage] Stored new complaint: ${newId} (Total: ${all.length})`);
    return newDoc;
  },

  async getAll(filterParams?: {
    category?: string;
    location?: string;
    status?: string;
    priority?: string;
    department?: string;
    search?: string;
    studentId?: string;
  }): Promise<Record<string, unknown>[]> {
    if (mongoose.connection.readyState === 1) {
      try {
        const query: Record<string, unknown> = {};
        if (filterParams?.category) query.category = filterParams.category;
        if (filterParams?.location) query.location = filterParams.location;
        if (filterParams?.status) query.status = filterParams.status;
        if (filterParams?.priority) query.priority = filterParams.priority;
        if (filterParams?.department) query.department = filterParams.department;
        if (filterParams?.studentId) query.studentId = filterParams.studentId;
        if (filterParams?.search) {
          query.$text = { $search: filterParams.search };
        }
        const docs = await Complaint.find(query).sort({ createdAt: -1 });
        if (docs.length > 0) return docs.map((d) => d.toObject() as unknown as Record<string, unknown>);
      } catch {
        // fallback to file
      }
    }

    // Query from persistent JSON file
    let list = readStoredComplaints();

    if (filterParams?.category) {
      list = list.filter((c) => c.category === filterParams.category);
    }
    if (filterParams?.location) {
      list = list.filter((c) => c.location === filterParams.location);
    }
    if (filterParams?.status) {
      list = list.filter((c) => c.status === filterParams.status);
    }
    if (filterParams?.priority) {
      list = list.filter((c) => c.priority === filterParams.priority);
    }
    if (filterParams?.department) {
      list = list.filter((c) => c.department === filterParams.department);
    }
    if (filterParams?.studentId) {
      list = list.filter((c) => c.studentId === filterParams.studentId);
    }
    if (filterParams?.search) {
      const q = filterParams.search.toLowerCase();
      list = list.filter(
        (c) =>
          String(c.title || "").toLowerCase().includes(q) ||
          String(c.description || "").toLowerCase().includes(q) ||
          String(c.location || "").toLowerCase().includes(q) ||
          String(c.locationDetails || "").toLowerCase().includes(q) ||
          String(c._id || "").toLowerCase().includes(q)
      );
    }

    return list;
  },

  async getById(id: string): Promise<Record<string, unknown> | null> {
    if (mongoose.connection.readyState === 1) {
      try {
        const doc = await Complaint.findById(id);
        if (doc) return doc.toObject() as unknown as Record<string, unknown>;
      } catch {
        // fallback to file
      }
    }
    const all = readStoredComplaints();
    return all.find((c) => c._id === id || c.id === id) || null;
  },

  async update(id: string, updates: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    let updatedObj: Record<string, unknown> | null = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const updated = await Complaint.findByIdAndUpdate(
          id,
          { ...updates, updatedAt: new Date() },
          { new: true }
        );
        if (updated) updatedObj = updated.toObject() as unknown as Record<string, unknown>;
      } catch {
        // fallback
      }
    }

    const all = readStoredComplaints();
    const idx = all.findIndex((c) => c._id === id || c.id === id);
    if (idx >= 0) {
      all[idx] = {
        ...all[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      writeStoredComplaints(all);
      console.log(`[Storage] Updated complaint: ${id}`);
      return all[idx];
    }

    return updatedObj;
  },

  async delete(id: string): Promise<boolean> {
    let mongoDeleted = false;
    if (mongoose.connection.readyState === 1) {
      try {
        const res = await Complaint.findByIdAndDelete(id);
        if (res) mongoDeleted = true;
      } catch {
        // fallback
      }
    }
    const all = readStoredComplaints();
    const filtered = all.filter((c) => c._id !== id && c.id !== id);
    if (filtered.length !== all.length) {
      writeStoredComplaints(filtered);
      return true;
    }
    return mongoDeleted;
  },

  async getAnalytics(): Promise<Record<string, unknown>> {
    const list = await this.getAll();
    const totalReports = list.length;
    const openReports = list.filter((c) => ["Submitted", "Under Review", "In Progress"].includes(String(c.status))).length;
    const resolvedReports = list.filter((c) => ["Resolved", "Closed"].includes(String(c.status))).length;
    const urgentReports = list.filter((c) => ["High", "Urgent"].includes(String(c.priority))).length;

    // Department breakdown
    const deptMap: Record<string, number> = {};
    for (const c of list) {
      const d = String(c.department || "Unassigned");
      deptMap[d] = (deptMap[d] || 0) + 1;
    }

    // Category breakdown
    const catMap: Record<string, number> = {};
    for (const c of list) {
      const cat = String(c.category || "Other");
      catMap[cat] = (catMap[cat] || 0) + 1;
    }

    // Location hotspots
    const locMap: Record<string, number> = {};
    for (const c of list) {
      const loc = String(c.location || "Other");
      locMap[loc] = (locMap[loc] || 0) + 1;
    }

    return {
      summary: {
        totalReports,
        openReports,
        resolvedReports,
        urgentReports,
      },
      departmentBreakdown: Object.entries(deptMap).map(([department, count]) => ({ department, count })),
      categoryBreakdown: Object.entries(catMap).map(([category, count]) => ({ category, count })),
      locationHotspots: Object.entries(locMap).map(([location, count]) => ({ location, count })),
    };
  },
};
