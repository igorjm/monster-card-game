import type { Room } from "@/lib/game/types";
import { adminClient } from "@/lib/supabase/admin";

export async function awardHostProgress(room: Room) {
  if (!room.host_user_id || !room.game?.result) return;
  const matchKey = room.game.nightStartedAt;
  const { data: event, error } = await adminClient()
    .from("host_progress_events")
    .upsert(
      { user_id: room.host_user_id, room_id: room.id, match_key: matchKey, xp: 100 },
      { onConflict: "room_id,match_key", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();
  if (error || !event) return;

  const { data: profile } = await adminClient()
    .from("host_profiles")
    .select("xp,matches_hosted,achievements")
    .eq("user_id", room.host_user_id)
    .single();
  if (!profile) return;
  const matches = Number(profile.matches_hosted) + 1;
  const achievements = new Set<string>((profile.achievements as string[]) ?? []);
  if (matches >= 1) achievements.add("primeira-mesa");
  if (matches >= 10) achievements.add("anfitriao-da-vila");
  if (matches >= 50) achievements.add("mestre-das-rematches");
  await adminClient().from("host_profiles").update({
    xp: Number(profile.xp) + 100,
    matches_hosted: matches,
    achievements: [...achievements],
    title: matches >= 50 ? "Mestre da Mesa" : matches >= 10 ? "Anfitrião da Vila" : "Primeira Mesa",
    updated_at: new Date().toISOString(),
  }).eq("user_id", room.host_user_id);
}
