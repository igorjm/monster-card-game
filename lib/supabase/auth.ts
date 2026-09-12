import type { User } from "@supabase/supabase-js";
import { adminClient } from "./admin";
import { ApiError } from "@/lib/api/errors";

export async function authenticatedUser(req: Request): Promise<User | null> {
  const value = req.headers.get("authorization");
  if (!value?.startsWith("Bearer ")) return null;
  const token = value.slice(7);
  const { data, error } = await adminClient().auth.getUser(token);
  return error ? null : data.user;
}

export async function requireUser(req: Request): Promise<User> {
  const user = await authenticatedUser(req);
  if (!user) throw new ApiError("Entre por e-mail para continuar.", 401);
  return user;
}

export async function requireAdultHost(req: Request): Promise<User> {
  const user = await requireUser(req);
  const { data, error } = await adminClient()
    .from("host_profiles")
    .select("age_band")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || data?.age_band !== "adult") {
    throw new ApiError("Somente uma conta adulta confirmada pode criar salas.", 403);
  }
  return user;
}
