import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ToggleEvent } from "react";
import type { FieldChoice } from "../types";

function Caret({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 8 8"
      width="8"
      height="8"
      className={className}
    >
      <path
        d="M1.5 3 4 5.5 6.5 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Check({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      width="10"
      height="10"
      className={className}
    >
      <path
        d="M2.5 6.5 5 9l4.5-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface StatePillProps {
  state: string;
  stateChoices: FieldChoice[];
  onChange: (value: string) => void;
}

function StatePill({ state, stateChoices, onChange }: StatePillProps) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef(new Map<string, HTMLButtonElement>());
  const [open, setOpen] = useState(false);

  const key = state.toLowerCase();
  const label =
    stateChoices.find((choice) => choice.value === state)?.display_name ??
    state;

  function positionMenu() {
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!menu || !trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = menu.offsetWidth;
    const overflowsRight = rect.left + menuWidth > window.innerWidth;

    menu.style.top = `${rect.bottom + 4}px`;
    if (overflowsRight) {
      menu.style.left = `${rect.right - menuWidth}px`;
      menu.style.setProperty("--menu-origin", "top right");
    } else {
      menu.style.left = `${rect.left}px`;
      menu.style.setProperty("--menu-origin", "top left");
    }
  }

  function handleToggle(e: ToggleEvent<HTMLDivElement>) {
    const isOpen = e.newState === "open";
    setOpen(isOpen);

    if (isOpen) {
      positionMenu();
      const current = optionRefs.current.get(state);
      // Popover is already visible at this point; focus needs a tick to land.
      requestAnimationFrame(() => current?.focus());
    }
  }

  function selectChoice(value: string) {
    onChange(value);
    menuRef.current?.hidePopover();
  }

  function handleOptionKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = stateChoices.length;
    let nextIndex: number | null = null;

    if (e.key === "ArrowDown") nextIndex = (index + 1) % count;
    else if (e.key === "ArrowUp") nextIndex = (index - 1 + count) % count;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = count - 1;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectChoice(stateChoices[index].value);
      return;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      optionRefs.current.get(stateChoices[nextIndex].value)?.focus();
    }
  }

  return (
    <span className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={menuId}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="state-pill-trigger inline-flex items-center gap-1 rounded-full pl-2.5 pr-1.5 py-0.5
                   text-[0.7rem] font-semibold uppercase tracking-wide cursor-pointer
                   transition-[background-color,color,transform] duration-200 ease-out
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
                   focus-visible:ring-offset-paper active:scale-[0.97]"
        style={{
          color: `var(--color-${key})`,
          backgroundColor: `var(--color-${key}-bg)`,
        }}
      >
        {label}
        <Caret
          className={`opacity-40 transition-transform duration-200 ease-out ${
            open ? "-rotate-180 opacity-100" : ""
          }`}
        />
      </button>

      <div
        id={menuId}
        ref={menuRef}
        popover="auto"
        role="listbox"
        aria-label="Application state"
        onToggle={handleToggle}
        className="state-menu"
      >
        {stateChoices.map((choice, index) => {
          const optionKey = choice.value.toLowerCase();
          const selected = choice.value === state;

          return (
            <button
              key={choice.value}
              ref={(el) => {
                if (el) optionRefs.current.set(choice.value, el);
                else optionRefs.current.delete(choice.value);
              }}
              type="button"
              role="option"
              aria-selected={selected}
              tabIndex={-1}
              onClick={() => selectChoice(choice.value)}
              onKeyDown={(e) => handleOptionKeyDown(e, index)}
              className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm
                         font-body cursor-pointer focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: `var(--color-${optionKey})` }}
              />
              <span className="flex-1 text-ink">{choice.display_name}</span>
              {selected && <Check className="text-ink-soft" />}
            </button>
          );
        })}
      </div>
    </span>
  );
}

export default StatePill;
