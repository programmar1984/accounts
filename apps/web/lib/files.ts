import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export async function saveUpload(file: File): Promise<{
  storedName: string;
  originalName: string;
  mimeType: string;
  size: number;
}> {
  const ext = path.extname(file.name).slice(0, 10);
  const storedName = `${crypto.randomUUID()}${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, storedName), buffer);
  return {
    storedName,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

export async function deleteUpload(storedName: string): Promise<void> {
  try {
    await unlink(path.join(UPLOAD_DIR, storedName));
  } catch {
    // file already gone — nothing to do
  }
}
