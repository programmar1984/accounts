"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  "aria-label"?: string;
  suggestionsLabel?: string;
};

export function LineDescriptionAutocomplete({
  name,
  value,
  onChange,
  suggestions,
  placeholder,
  required,
  "aria-label": ariaLabel,
  suggestionsLabel = "Suggestions",
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const query = value.trim().toLowerCase();
  const filtered = suggestions.filter((s) =>
    query ? s.toLowerCase().includes(query) : true
  );

  useEffect(() => {
    setActiveIndex(-1);
  }, [value, suggestions]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function selectSuggestion(text: string) {
    onChange(text);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || filtered.length === 0) {
      if (e.key === "ArrowDown" && suggestions.length > 0) {
        setOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1 >= filtered.length ? 0 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      selectSuggestion(filtered[activeIndex]!);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showList = open && filtered.length > 0;

  return (
    <div ref={rootRef} className="line-desc-autocomplete">
      <input
        name={name}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        required={required}
        className="input"
        aria-label={ariaLabel}
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label={suggestionsLabel}
          className="line-desc-autocomplete__list"
        >
          {filtered.map((text, i) => (
            <li
              key={text}
              role="option"
              aria-selected={i === activeIndex}
              className={`line-desc-autocomplete__option${
                i === activeIndex ? " line-desc-autocomplete__option--active" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectSuggestion(text);
              }}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
