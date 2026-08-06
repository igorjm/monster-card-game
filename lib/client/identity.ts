"use client";

const TOKEN_KEY = "monstros:token";
const NICK_KEY = "monstros:nickname";

/** Stable private token identifying this device/player across rooms. */
export function getPlayerToken(): string {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export function getSavedNickname(): string {
  return localStorage.getItem(NICK_KEY) ?? "";
}

export function saveNickname(nickname: string) {
  localStorage.setItem(NICK_KEY, nickname);
}

export async function apiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erro inesperado.");
  return data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erro inesperado.");
  return data as T;
}
