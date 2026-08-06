/** Normalize a typed/pasted room code to 4 A–Z letters. */
export function normalizeRoomCode(raw: string): string {
  return raw
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, "")
    .slice(0, 4);
}

export const ROOM_CODE_LENGTH = 4;
