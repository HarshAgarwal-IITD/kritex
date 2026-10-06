import { useMutation } from "@tanstack/react-query";
import { api, ApiError, toApiError } from "@/lib/api/client";
import type { UploadContentType, UploadPurpose } from "./types";

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES: UploadContentType[] = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const ACCEPT_BY_PURPOSE: Record<UploadPurpose, string> = {
  PRODUCT_IMAGE: IMAGE_TYPES.join(","),
  CATEGORY_IMAGE: IMAGE_TYPES.join(","),
  SPEC_SHEET: [...IMAGE_TYPES, "application/pdf"].join(","),
};

function allowedType(purpose: UploadPurpose, type: string): type is UploadContentType {
  return ACCEPT_BY_PURPOSE[purpose].split(",").includes(type);
}

/**
 * Two-step upload: ask the API for a presigned URL (`POST /admin/uploads`), then PUT the bytes to it.
 * Resolves to the public URL to store on the product/category.
 */
export async function uploadFile(file: File, purpose: UploadPurpose): Promise<string> {
  if (!allowedType(purpose, file.type)) {
    throw new ApiError("UNSUPPORTED_TYPE", `${file.name}: unsupported file type ${file.type || "(unknown)"}`, 0);
  }
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError("FILE_TOO_LARGE", `${file.name}: files must be under 20 MB`, 0);
  }
  const { data, error, response } = await api.POST("/api/v1/admin/uploads", {
    body: { purpose, filename: file.name, contentType: file.type, size: file.size },
  });
  if (error || !data) throw toApiError(error, response);

  let put: Response;
  try {
    put = await fetch(data.uploadUrl, { method: data.method, headers: data.headers, body: file });
  } catch (cause) {
    throw new ApiError("UPLOAD_FAILED", `${file.name}: upload failed`, 0, cause);
  }
  if (!put.ok) throw new ApiError("UPLOAD_FAILED", `${file.name}: upload failed (${put.status})`, put.status);
  return data.publicUrl;
}

export function useUpload(purpose: UploadPurpose) {
  return useMutation<string, ApiError, File>({ mutationFn: (file) => uploadFile(file, purpose) });
}
