"use client";

import { authAccessToken } from "@/lib/supabase/auth-client";

const TOKEN_KEY = "theme-game:token";
const NICK_KEY = "theme-game:nickname";
const LEGACY_TOKEN_KEY = "monstros:token";
const LEGACY_NICK_KEY = "monstros:nickname";

/** Stable private token identifying this device/player across rooms. */
export function getPlayerToken(): string {
  let token = localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
  }
  localStorage.setItem(TOKEN_KEY, token);
  return token;
}

export function getSavedNickname(): string {
  const nickname = localStorage.getItem(NICK_KEY) ?? localStorage.getItem(LEGACY_NICK_KEY) ?? "";
  if (nickname) localStorage.setItem(NICK_KEY, nickname);
  return nickname;
}

export function saveNickname(nickname: string) {
  localStorage.setItem(NICK_KEY, nickname);
}

export async function apiPost<T>(path: string, body: object): Promise<T> {
  const accessToken = await authAccessToken();
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erro inesperado.");
  return data as T;
}

export async function apiGet<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const accessToken = await authAccessToken();
  const headers = new Headers(init.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const res = await fetch(path, { cache: "no-store", ...init, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Erro inesperado.");
  return data as T;
}
