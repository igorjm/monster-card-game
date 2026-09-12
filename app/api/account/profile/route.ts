import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/respond";
import { ApiError } from "@/lib/api/errors";
import { adminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/auth";
import { hostAccessSummary } from "@/lib/commercial/entitlements";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await requireUser(req);
    return NextResponse.json({
      email: user.email,
      ...(await hostAccessSummary(user.id)),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const body = (await req.json()) as { ageBand?: string; confirmsAdult?: boolean };
    if (body.ageBand !== "adult" || body.confirmsAdult !== true) {
      throw new ApiError("A criação de salas é reservada a adultos confirmados.");
    }
    const now = new Date().toISOString();
    const { error } = await adminClient().from("host_profiles").upsert(
      {
        user_id: user.id,
        age_band: "adult",
        adult_confirmed_at: now,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new ApiError("Não foi possível salvar a confirmação.", 500);
    return NextResponse.json({ email: user.email, ...(await hostAccessSummary(user.id)) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser(req);
    const { data: rooms } = await adminClient().from("rooms").select("code").eq("host_user_id", user.id);
    const roomCodes = (rooms ?? []).map((room) => room.code as string);
    if (roomCodes.length) await adminClient().from("safety_reports").delete().in("room_code", roomCodes);
    await adminClient().rpc("redact_account_payment_events", { p_user_id: user.id });
    await adminClient().from("rooms").delete().eq("host_user_id", user.id);
    const { error } = await adminClient().auth.admin.deleteUser(user.id);
    if (error) throw new ApiError("Não foi possível excluir a conta.", 500);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
