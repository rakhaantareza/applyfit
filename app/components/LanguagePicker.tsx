"use client";

import { ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
} from "react";
import { useI18n, type Language } from "./LanguageProvider";

const languages = [
  { value: "id", label: "IDN" },
  { value: "en", label: "ENG" },
] as const;

export function LanguagePicker() {
  const { language, setLanguage } = useI18n();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    root.current
      ?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
      ?.focus();
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  function choose(value: Language) {
    setLanguage(value);
    setOpen(false);
    trigger.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && open) {
      event.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const options = [
        ...(root.current?.querySelectorAll<HTMLButtonElement>(
          '[role="menuitemradio"]',
        ) ?? []),
      ];
      const index = options.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? options.length - 1
            : (index + (event.key === "ArrowUp" ? -1 : 1) + options.length) %
              options.length;
      options[next]?.focus();
    }
  }

  return (
    <div
      className="language-picker"
      ref={root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        onKeyDown={handleKeyDown}
        ref={trigger}
        className="language-trigger"
        type="button"
        aria-label="Bahasa / Language"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={!hydrated}
        onClick={() => setOpen(!open)}
      >
        <span
          className={`language-flag language-flag-${language}`}
          aria-hidden="true"
        />
        <span>{language === "id" ? "IDN" : "ENG"}</span>
        <ChevronDown size={14} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {open ? (
        <div
          id={menuId}
          className="language-menu"
          role="menu"
          aria-label="Bahasa / Language"
        >
          {languages.map((item) => (
            <button
              onKeyDown={handleKeyDown}
              key={item.value}
              type="button"
              role="menuitemradio"
              aria-checked={language === item.value}
              onClick={() => choose(item.value)}
            >
              <span
                className={`language-flag language-flag-${item.value}`}
                aria-hidden="true"
              />
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function subscribe() {
  return () => {};
}
