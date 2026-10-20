import { supabaseConfig } from "@/lib/env";

/**
 * Browser only: PUT to a signed Storage upload URL, reporting the bytes sent (fetch cannot
 * report upload progress). The body is the one supabase-js sends to a signed upload URL.
 */
export function uploadToSignedUrl(url: string, file: File, onProgress?: (sent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("x-upsert", "false");
    if (supabaseConfig) request.setRequestHeader("apikey", supabaseConfig.anonKey);
    request.upload.onprogress = (event) => onProgress?.(event.loaded);
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`upload failed (${request.status})`));
    request.onerror = () => reject(new Error("upload failed (network)"));
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    request.send(body);
  });
}

/** Width and height of an image file, or nothing for other files. */
export async function imageSize(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith("image/")) return {};
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return {};
  }
}
