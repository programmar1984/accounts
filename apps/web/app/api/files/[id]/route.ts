import { readFile } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { attachments, db } from "@shime/db";
import { getActiveSession } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/files";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getActiveSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, id),
  });
  if (!attachment) {
    return new Response("Not found", { status: 404 });
  }

  let data: Buffer;
  try {
    data = await readFile(path.join(UPLOAD_DIR, attachment.storedName));
  } catch {
    return new Response("File missing", { status: 404 });
  }

  const url = new URL(request.url);
  const download = url.searchParams.get("download") === "1";
  const encodedName = encodeURIComponent(attachment.originalName);

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Content-Length": String(attachment.size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
