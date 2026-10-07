import { cookies } from "next/headers";
import { z } from "zod";

// Demo values belong to this browser, never to a shared server process. They
// contain no credentials and are never used to authorize database operations.
export async function readDemoState<T>(name: string, schema: z.ZodType<T>, fallback: T): Promise<T> {
  const value = (await cookies()).get(`campuspulse-${name}`)?.value;
  if (!value || value.length > 3800) return fallback;
  try {
    const parsed = schema.safeParse(JSON.parse(Buffer.from(value, "base64url").toString("utf8")));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

export async function writeDemoState(name: string, value: unknown) {
  const encoded = Buffer.from(JSON.stringify(value)).toString("base64url");
  if (encoded.length > 3800) throw new Error("Demo snapshot exceeds cookie capacity");
  (await cookies()).set(`campuspulse-${name}`, encoded, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}
