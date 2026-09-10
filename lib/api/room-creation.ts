import { ApiError } from "./errors";
import {
  getDefaultThemeId,
  isThemeSelectable,
  type ThemeId,
} from "../themes/registry";

export function resolveRoomCreationTheme(requestedThemeId: unknown): ThemeId {
  const candidate =
    requestedThemeId === undefined ? getDefaultThemeId() : requestedThemeId;

  if (!isThemeSelectable(candidate)) {
    throw new ApiError("Tema inválido ou indisponível.");
  }

  return candidate;
}
