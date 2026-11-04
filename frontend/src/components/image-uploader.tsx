"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Trash2, UploadCloud } from "lucide-react";

type ImageUploaderProps = {
  maxImages?: number;
  maxSizeBytes?: number;
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  label?: string;
  hint?: string;
};

export function ImageUploader({
  maxImages = 3,
  maxSizeBytes = 8 * 1024 * 1024, // 8MB
  onFilesSelected,
  selectedFiles,
  onRemoveFile,
  label = "Attach photos (optional)",
  hint = "PNG, JPG, or WEBP up to 8MB each (max 3)",
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError("");
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Check count limit
    if (selectedFiles.length + files.length > maxImages) {
      setError(`You can only attach up to ${maxImages} images in total.`);
      return;
    }

    // Check types and sizes
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" is not an image file.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        setError(`"${file.name}" exceeds the 8MB size limit.`);
        return;
      }
    }

    onFilesSelected(files);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="campus-image-uploader flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Camera size={14} className="text-emerald-600" />
          {label}
        </label>
        <span className="text-[10px] text-slate-400">
          {selectedFiles.length} / {maxImages} added
        </span>
      </div>

      {selectedFiles.length < maxImages && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-lg p-3 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center gap-1">
            <UploadCloud size={20} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Click or drag photos to upload
            </span>
            <span className="text-[10px] text-slate-400">{hint}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="text-[11px] text-red-600 bg-red-50 p-1.5 rounded border border-red-200">
          {error}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {selectedFiles.map((file, idx) => {
            const previewUrl = URL.createObjectURL(file);
            return (
              <div
                key={`${file.name}-${idx}`}
                className="relative group w-20 h-20 rounded-md overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="w-full h-full object-cover"
                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                />
                <button
                  type="button"
                  onClick={() => onRemoveFile(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-90 hover:opacity-100 hover:scale-110 transition shadow"
                  title="Remove photo"
                  aria-label="Remove photo"
                >
                  <Trash2 size={12} />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5 text-[9px] text-white truncate">
                  {(file.size / 1024).toFixed(0)} KB
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
