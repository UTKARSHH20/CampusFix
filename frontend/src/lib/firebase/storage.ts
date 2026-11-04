import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseClient } from "./client";

/**
 * Uploads a complaint photo to Firebase Storage.
 * Path: complaint-images/{userId}/{complaintId}/{filename}
 */
export async function uploadComplaintImage(
  userId: string,
  complaintId: string,
  file: File
): Promise<string> {
  const { storage } = getFirebaseClient();
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const storageRef = ref(storage, `complaint-images/${userId}/${complaintId}/${safeName}`);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
  });
  return await getDownloadURL(snapshot.ref);
}

/**
 * Uploads an admin resolution proof photo to Firebase Storage.
 * Path: resolution-images/{complaintId}/{filename}
 */
export async function uploadResolutionImage(
  complaintId: string,
  file: File
): Promise<string> {
  const { storage } = getFirebaseClient();
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const storageRef = ref(storage, `resolution-images/${complaintId}/${safeName}`);
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || "image/jpeg",
  });
  return await getDownloadURL(snapshot.ref);
}

/**
 * Helper to convert a local file to a Data URL (for demo preview or offline fallback).
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
