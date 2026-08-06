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
}: {
  children: ReactNode;
  className?: string;
  /** Slightly wider on large screens (lobby / results with more content). */
  wide?: boolean;
}) {
  const width = wide
    ? "max-w-md md:max-w-lg lg:max-w-xl"
    : "max-w-md md:max-w-lg";

  return (
    <div className="flex min-h-dvh w-full flex-1 flex-col">
      <main
        className={`mx-auto flex w-full min-w-0 flex-1 flex-col ${width} pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] ${className}`}
      >
        {children}
      </main>
    </div>
  );
}
