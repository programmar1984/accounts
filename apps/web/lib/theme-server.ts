import { cookies } from "next/headers";
import { THEME_COOKIE, resolveTheme } from "./theme";

export async function getTheme() {
  const jar = await cookies();
  return resolveTheme(jar.get(THEME_COOKIE)?.value);
}
