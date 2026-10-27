import { useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { useTags } from "@/hooks/use-queries";
import { parseTagNames, suggestTags, tagTokenAt } from "@/lib/expenses/tag-utils";
import { cn } from "@/lib/utils";

interface TagInputProps {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Comma-separated tag field that autocompletes the tag under the caret from the user's tags. */
export function TagInput({
  id,
  name = "tags",
  value,
  onChange,
  placeholder,
}: TagInputProps) {
  const { t } = useTranslation("common");
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: allTags = [] } = useTags();
  const [caret, setCaret] = useState(value.length);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const { token, suggestions } = useMemo(() => {
    const token = tagTokenAt(value, caret);
    const taken = new Set(parseTagNames(value.slice(0, token.start) + value.slice(token.end)));
    return { token, suggestions: suggestTags(allTags, token.query, taken) };
  }, [allTags, value, caret]);

  const showList = open && suggestions.length > 0;
  const activeTag = suggestions[active];

  function syncCaret(e: React.SyntheticEvent<HTMLInputElement>) {
    setCaret(e.currentTarget.selectionStart ?? e.currentTarget.value.length);
  }

  function accept(tag: string) {
    const before = value.slice(0, token.start);
    const after = value.slice(token.end);
    const head = `${before}${before ? " " : ""}${tag}`;
    // Completing the last tag starts the next one; a tag mid-list keeps the rest as-is.
    const next = after ? head + after : `${head}, `;
    const nextCaret = after ? head.length : next.length;
    onChange(next);
    setCaret(nextCaret);
    setOpen(false);
    setActive(-1);
    requestAnimationFrame(() => inputRef.current?.setSelectionRange(nextCaret, nextCaret));
  }

  // Enter/Tab only complete a highlighted suggestion, so a new tag is never replaced unasked.
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList) {
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => (i + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => (i <= 0 ? suggestions.length : i) - 1);
        break;
      case "Enter":
      case "Tab":
        if (activeTag) {
          e.preventDefault();
          accept(activeTag);
        }
        break;
      case "Escape":
        // Keep TerminalModal's document-level Escape from closing the dialog too.
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        break;
    }
  }

  return (
    <div>
      <label htmlFor={id} className="mb-2 block font-mono text-xs text-muted">
        {t("labelTags")}
      </label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          name={name}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            syncCaret(e);
            setOpen(true);
            setActive(-1);
          }}
          onSelect={syncCaret}
          onKeyDown={handleKeyDown}
          onBlur={() => setOpen(false)}
          placeholder={placeholder ?? t("tagsPlaceholder")}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={activeTag ? `${listId}-${active}` : undefined}
          required
        />
        {showList && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-10 mt-1 w-full border border-border bg-surface font-mono text-sm"
          >
            {suggestions.map((tag, i) => (
              <li
                key={tag}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // Keep focus in the input so blur doesn't close the list before the click lands.
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => accept(tag)}
                className={cn(
                  "cursor-pointer px-3 py-1.5",
                  i === active ? "bg-surface-elevated text-accent" : "text-muted",
                )}
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-1 font-mono text-xs text-muted">
        {t("tagsHint")}
      </p>
    </div>
  );
}

export function TagList({ tags }: { tags: string[] }) {
  const { t } = useTranslation("common");

  if (tags.length === 0) {
    return <span className="font-mono text-xs text-muted">{t("untagged")}</span>;
  }

  return (
    <span className="font-mono text-xs text-muted">
      {tags.join(", ")}
    </span>
  );
}
