"use client";

import { ChevronDown } from "lucide-react";
import {
  forwardRef,
  useId,
  useMemo,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";
import {
  filterSearchableComboboxOptions,
  findExactSearchableComboboxOption,
  findMatchingSearchableComboboxAlias,
  type SearchableComboboxOption,
} from "./searchable-combobox-ranking";

export type { SearchableComboboxOption } from "./searchable-combobox-ranking";

type SearchableComboboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> & {
  options: readonly SearchableComboboxOption[];
  defaultOptions?: readonly SearchableComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: SearchableComboboxOption) => void;
};

export const SearchableCombobox = forwardRef<
  HTMLInputElement,
  SearchableComboboxProps
>(function SearchableCombobox(
  { options, defaultOptions, value, onChange, onSelect, onBlur, onFocus, ...inputProps },
  ref,
) {
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const filteredOptions = useMemo(
    () => filterSearchableComboboxOptions(
      value.trim() ? options : defaultOptions ?? options,
      value,
    ),
    [defaultOptions, options, value],
  );

  function selectOption(option: SearchableComboboxOption) {
    onChange(option.value);
    onSelect?.(option);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
    setIsOpen(true);
    setActiveIndex(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        current < filteredOptions.length - 1 ? current + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        current > 0 ? current - 1 : filteredOptions.length - 1,
      );
      return;
    }

    if (event.key === "Enter" && isOpen && activeIndex >= 0) {
      const option = filteredOptions[activeIndex];
      if (option) {
        event.preventDefault();
        selectOption(option);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  const showListbox = isOpen;

  return (
    <div className="searchable-combobox">
      <input
        {...inputProps}
        ref={ref}
        value={value}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={showListbox}
        aria-activedescendant={
          filteredOptions.length > 0 && activeIndex >= 0
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        onBlur={(event) => {
          const exactOption = findExactSearchableComboboxOption(options, value);
          if (exactOption) {
            onChange(exactOption.value);
            onSelect?.(exactOption);
          }
          setIsOpen(false);
          setActiveIndex(-1);
          onBlur?.(event);
        }}
        onChange={handleChange}
        onFocus={(event) => {
          setIsOpen(true);
          onFocus?.(event);
        }}
        onKeyDown={handleKeyDown}
      />
      <ChevronDown
        className="searchable-combobox-icon"
        aria-hidden="true"
        size={15}
        strokeWidth={1.8}
      />
      {showListbox ? (
        <ul id={listboxId} className="searchable-combobox-list" role="listbox">
          {filteredOptions.map((option, index) => {
            const matchingAlias = findMatchingSearchableComboboxAlias(option, value);
            const isActive = index === activeIndex;
            const isSelected = option.value.localeCompare(value.trim(), "id-ID", {
              sensitivity: "accent",
            }) === 0;
            return (
            <li
              id={`${listboxId}-option-${index}`}
              aria-selected={isSelected}
              className={[isActive ? "active" : "", isSelected ? "selected" : ""]
                .filter(Boolean)
                .join(" ") || undefined}
              key={option.id}
              role="option"
              tabIndex={-1}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  selectOption(option);
                }
              }}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectOption(option)}
            >
              <strong>{option.value}</strong>
              {matchingAlias ? (
                <small>{matchingAlias} → {option.value}</small>
              ) : option.meta ? (
                <small>{option.meta}</small>
              ) : null}
            </li>
            );
          })}
          {filteredOptions.length === 0 && value.trim() ? (
            <li className="searchable-combobox-empty" role="presentation">
              Tetap gunakan “{value.trim()}”
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
});
