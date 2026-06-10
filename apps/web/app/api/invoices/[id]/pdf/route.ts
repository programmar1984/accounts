import { readFile } from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";
import { db, invoices } from "@shime/db";
import { getActiveSession } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/files";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getActiveSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const inv = await db.query.invoices.findFirst({ where: eq(invoices.id, id) });
  if (!inv?.pdfStoredName) return new Response("Not found", { status: 404 });

  let data: Buffer;
  try {
    data = await readFile(path.join(UPLOAD_DIR, inv.pdfStoredName));
  } catch {
    return new Response("File missing", { status: 404 });
  }

  const encodedName = encodeURIComponent(`${inv.number}.pdf`);
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
