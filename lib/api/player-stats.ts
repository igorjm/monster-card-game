import { adminClient } from "@/lib/supabase/admin";
import { ROLES } from "@/lib/game/roles";
import type { GameResult, PlayerInfo } from "@/lib/game/types";

/**
 * Persist +1 win for every player whose FINAL role team matches the winners.
 * Zumbi never scores (they must have become another role to win).
 */
export async function awardMatchWins(
  players: PlayerInfo[],
  result: GameResult,
): Promise<void> {
  const winners = players.filter((p) => {
    const final = result.finalRoles[p.id];
    if (!final || final === "zumbi") return false;
    return ROLES[final].team === result.winners;
  });
  if (winners.length === 0) return;

  await Promise.all(
    winners.map(async (p) => {
      try {
        const { data } = await adminClient()
          .from("player_stats")
          .select("wins")
          .eq("token", p.token)
          .maybeSingle();
        const wins = (data?.wins ?? 0) + 1;
        const { error } = await adminClient().from("player_stats").upsert(
          {
            token: p.token,
            nickname: p.nickname,
            wins,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "token" },
        );
        if (error) {
          console.error("player_stats upsert failed", error.message);
        }
      } catch (e) {
        console.error("player_stats award failed", e);
      }
    }),
  );
}

/** Map player token → career wins (missing rows count as 0). */
export async function winsByToken(
  tokens: string[],
): Promise<Record<string, number>> {
  if (tokens.length === 0) return {};
  try {
    const { data, error } = await adminClient()
      .from("player_stats")
      .select("token, wins")
      .in("token", tokens);
    if (error || !data) return {};
    const out: Record<string, number> = {};
    for (const row of data) {
      out[row.token as string] = Number(row.wins) || 0;
    }
    return out;
  } catch {
    return {};
  }
}

/** Wins keyed by public player id for a room seating. */
export async function winsByPlayerId(
  players: PlayerInfo[],
): Promise<Record<string, number>> {
  const byToken = await winsByToken(players.map((p) => p.token));
  const out: Record<string, number> = {};
  for (const p of players) {
    out[p.id] = byToken[p.token] ?? 0;
  }
  return out;
}
