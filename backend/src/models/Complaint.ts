import mongoose, { Document, Schema } from "mongoose";

export interface IComplaint extends Document {
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  title: string;
  description: string;
  category: string;
  location: string;
  locationDetails?: string;
  urgency: "Low" | "Medium" | "High" | "Urgent";
  status: "Submitted" | "Under Review" | "In Progress" | "Resolved" | "Closed";
  department?: string;
  priority?: "Low" | "Medium" | "High" | "Urgent";
  assignedStaff?: string;
  imageUrls: string[];
  resolution?: string;
  resolutionProofUrls: string[];
  resolvedAt?: Date;
  rating?: number;
  feedback?: string;
  aiTriage?: {
    category?: string;
    department?: string;
    priority?: string;
    safetyFlag?: boolean;
    visualAssessment?: string;
    estimatedEffort?: string;
    reason?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, default: "" },
    studentEmail: { type: String, default: "" },
    title: { type: String, required: true, maxlength: 160, trim: true },
    description: { type: String, required: true, maxlength: 10000, trim: true },
    category: {
      type: String,
      required: true,
      default: "Other",
      index: true,
    },
    location: {
      type: String,
      required: true,
      default: "Other Campus Area",
      index: true,
    },
    locationDetails: { type: String, default: "", maxlength: 160 },
    urgency: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["Submitted", "Under Review", "In Progress", "Resolved", "Closed"],
      default: "Submitted",
      index: true,
    },
    department: { type: String, default: "Unassigned", index: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
      index: true,
    },
    assignedStaff: { type: String, default: "" },
    imageUrls: { type: [String], default: [] },
    resolution: { type: String, default: "" },
    resolutionProofUrls: { type: [String], default: [] },
    resolvedAt: { type: Date },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, default: "" },
    aiTriage: {
      category: String,
      department: String,
      priority: String,
      safetyFlag: Boolean,
      visualAssessment: String,
      estimatedEffort: String,
      reason: String,
    },
  },
  {
    timestamps: true,
  }
);

// Full-text search index on title, description, and locationDetails
ComplaintSchema.index({
  title: "text",
  description: "text",
  locationDetails: "text",
});

export const Complaint = mongoose.model<IComplaint>("Complaint", ComplaintSchema);
