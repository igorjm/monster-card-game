import type { ReactNode } from "react";

/**
 * Shared responsive shell: phone-first column that breathes on tablet/desktop.
 * Uses min-height (not a nested overflow trap) so iOS standalone PWAs can
 * scroll long lobbies with the document scroller.
 */
export function AppShell({
  children,
  className = "",
  wide = false,
  /** Skip top safe-area padding when a shared header (e.g. voice) sits above. */
  flushTop = false,
}: {
  children: ReactNode;
  className?: string;
  /** Slightly wider on large screens (lobby / results with more content). */
  wide?: boolean;
  flushTop?: boolean;
}) {
  const width = wide
    ? "max-w-md md:max-w-lg lg:max-w-xl"
    : "max-w-md md:max-w-lg";
  const topPad = flushTop
    ? "pt-3"
    : "pt-[max(1.25rem,env(safe-area-inset-top))]";

  return (
    <div
      className={`flex w-full flex-1 flex-col ${flushTop ? "min-h-0" : "min-h-dvh"}`}
    >
      <main
        className={`mx-auto flex w-full min-w-0 flex-1 flex-col ${width} ${topPad} pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] ${className}`}
      >
        {children}
      </main>
    </div>
  );
}
