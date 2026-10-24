import { NextResponse } from "next/server";
import { addSubscriber, emailEnv, verifyConfirmation } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const env = emailEnv();
  const go = (status: string) => NextResponse.redirect(new URL(`/subscribed?status=${status}`, env.site));

  const url = new URL(req.url);
  const email = (url.searchParams.get("e") ?? "").trim().toLowerCase();
  const expires = Number(url.searchParams.get("x"));
  const token = url.searchParams.get("t") ?? "";
  if (!email || !token || !env.key || !env.secret) return go("invalid");

  try {
    if (!(await verifyConfirmation(email, expires, token, env.secret))) return go("invalid");
    return go((await addSubscriber(email, env)) ? "ok" : "error");
  } catch (err) {
    console.error("Confirm error", err);
    return go("error");
  }
}
