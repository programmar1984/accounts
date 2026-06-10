import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { createId } from "@shime/shared";
import { db, users } from "../src";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@shime.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin1234";
  const name = process.env.SEED_ADMIN_NAME ?? "Administrator";

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  const admin =
    existing ??
    (
      await db
        .insert(users)
        .values({ id: createId(), email, name, passwordHash, role: "ADMIN" })
        .returning()
    )[0];

  console.log(`Seeded admin user: ${admin.email} (id: ${admin.id})`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`Default password: ${password} — change it in production.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
