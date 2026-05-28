import { useRef } from "react";
import "./AddIdeaBar.css";

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  onAdd: (title: string) => void;
}

export default function AddIdeaBar({ query, onQueryChange, onAdd }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    onQueryChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="add-bar">
      <div className="add-bar__inner">
        <svg className="add-bar__icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 10L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          className="add-bar__input"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onQueryChange("");
          }}
          placeholder="Search issues…"
          autoFocus
        />
        {query.trim() && (
          <button className="add-bar__btn" onClick={submit}>
            Drop idea
          </button>
        )}
      </div>
    </div>
  );
}
