import type { Application, FieldChoice } from "../types";

interface StatusTilesProps {
  applications: Application[];
  stateChoices: FieldChoice[];
  activeState: string | null;
  onSelect: (state: string | null) => void;
}

function StatusTiles({
  applications,
  stateChoices,
  activeState,
  onSelect,
}: StatusTilesProps) {
  return (
    <div className="grid gap-3 py-4 grid-cols-[repeat(auto-fit,minmax(11rem,1fr))]">
      {stateChoices.map((choice) => {
        const count = applications.filter(
          (a) => a.state === choice.value,
        ).length;
        const isActive = activeState === choice.value;
        const color = `var(--color-${choice.value.toLowerCase()})`;

        return (
          <button
            key={choice.value}
            onClick={() => onSelect(isActive ? null : choice.value)}
            className="flex flex-col gap-1 rounded-lg border p-3 text-left cursor-pointer status-tile"
            style={{
              borderColor: isActive ? color : "var(--color-line-soft)",
              opacity: activeState && !isActive ? 0.4 : 1,
            }}
          >
            <span className="font-outlier text-2xl" style={{ color }}>
              {String(count).padStart(2, "0")}
            </span>
            <span className="text-xs uppercase tracking-wide text-ink-soft">
              {choice.display_name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default StatusTiles;
