"use client";

import { listSelectableThemePacks } from "@/lib/themes/registry";

export function ThemePicker({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (themeId: string) => void;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="font-title mb-3 text-xs text-parchment">TEMA DA PARTIDA</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {listSelectableThemePacks().map((pack) => {
          const selected = pack.id === value;
          return (
            <button
              key={pack.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(pack.id)}
              className={`rounded-md border-2 p-3 text-left transition-transform active:scale-95 ${
                selected
                  ? "border-ember bg-night-card ring-2 ring-ember/30"
                  : "border-night-card bg-grave/70"
              }`}
            >
              <span className="font-title block text-[0.58rem] text-parchment">{pack.shortName}</span>
              <span className="mt-1 block text-sm text-parchment-dim">
                {pack.status === "preview" ? "PRÉVIA · arte temporária" : "COMPLETO"}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-sm text-parchment-dim">O tema fica bloqueado quando a noite começa.</p>
    </fieldset>
  );
}
