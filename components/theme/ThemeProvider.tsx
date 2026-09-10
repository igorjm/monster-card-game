"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  getThemePack,
  resolveThemeId,
  themeCssProperties,
  type ThemeId,
} from "@/lib/themes/registry";
import type { ThemePack } from "@/lib/themes/types";

const ThemeContext = createContext<ThemePack | null>(null);

export function ThemeProvider({
  themeId,
  children,
}: {
  themeId: string;
  children: ReactNode;
}) {
  const resolved = resolveThemeId(themeId);
  const pack = useMemo(() => getThemePack(resolved), [resolved]);
  const cssProperties = useMemo(() => themeCssProperties(pack), [pack]);

  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = root.dataset.theme;
    const previousValues = new Map<string, string>();
    root.dataset.theme = pack.id;
    for (const [name, value] of Object.entries(cssProperties)) {
      previousValues.set(name, root.style.getPropertyValue(name));
      root.style.setProperty(name, value);
    }
    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousMeta = themeMeta?.content;
    themeMeta?.setAttribute("content", pack.palette.background);
    return () => {
      if (previousTheme) root.dataset.theme = previousTheme;
      else delete root.dataset.theme;
      for (const [name, value] of previousValues) {
        if (value) root.style.setProperty(name, value);
        else root.style.removeProperty(name);
      }
      if (themeMeta && previousMeta) themeMeta.content = previousMeta;
    };
  }, [cssProperties, pack]);

  return (
    <ThemeContext.Provider value={pack}>
      <div style={cssProperties} className="flex min-h-dvh w-full flex-1 flex-col">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemePack {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}

export function themeIdForView(value: unknown): ThemeId {
  return resolveThemeId(value);
}
