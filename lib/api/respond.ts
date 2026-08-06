import { NextResponse } from "next/server";
import { ApiError } from "./room-store";

export function errorResponse(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  console.error(e);
  return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
}
