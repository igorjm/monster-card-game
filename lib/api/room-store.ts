import { adminClient, broadcastRoomUpdate } from "@/lib/supabase/admin";
import type { Room } from "@/lib/game/types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ"; // no I/L/O to avoid confusion

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export async function loadRoom(code: string): Promise<Room> {
  const { data, error } = await adminClient()
    .from("rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw new ApiError("Erro ao buscar a sala.", 500);
  if (!data) throw new ApiError("Sala não encontrada.", 404);
  return data as Room;
}

export async function insertRoom(room: Omit<Room, "id" | "version">) {
  const { data, error } = await adminClient()
    .from("rooms")
    .insert({ ...room, version: 0 })
    .select("*")
    .single();
  if (error) throw new ApiError("Erro ao criar a sala.", 500);
  return data as Room;
}

/**
 * Read-modify-write with optimistic concurrency: `mutate` receives a fresh
 * room and returns the fields to update. Retries on version conflicts.
 */
export async function updateRoom(
  code: string,
  mutate: (room: Room) => Partial<Room> | Promise<Partial<Room>>,
): Promise<Room> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const room = await loadRoom(code);
    const patch = await mutate(room);
    const { data, error } = await adminClient()
      .from("rooms")
      .update({
        ...patch,
        version: room.version + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", room.id)
      .eq("version", room.version)
      .select("*")
      .maybeSingle();
    if (error) throw new ApiError("Erro ao atualizar a sala.", 500);
    if (data) {
      const updated = data as Room;
      void broadcastRoomUpdate(updated.code, updated.version);
      return updated;
    }
    // Version conflict: another request won the race; retry.
  }
  throw new ApiError("A sala está ocupada, tente novamente.", 409);
}

export function findPlayerByToken(room: Room, token: string) {
  const player = room.players.find((p) => p.token === token);
  if (!player) throw new ApiError("Você não está nesta sala.", 403);
  return player;
}
