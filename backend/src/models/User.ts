import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: "student" | "admin";
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    uid: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    photoURL: { type: String, default: "" },
    role: { type: String, enum: ["student", "admin"], default: "student", index: true },
    department: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>("User", UserSchema);
