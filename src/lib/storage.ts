import { supabase } from "@/integrations/supabase/client";

const BUCKET = "pharmacy";

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Uploads a captured photo and returns a long-lived signed URL. */
export async function uploadImage(dataUrl: string, folder: string): Promise<string | null> {
  try {
    const blob = dataUrlToBlob(dataUrl);
    const path = `${folder}/${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
      contentType: blob.type,
      upsert: false,
    });
    if (error) return null;
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

/** Shrinks a photo so AI calls and uploads stay fast. */
export function compressImage(dataUrl: string, maxSize = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
