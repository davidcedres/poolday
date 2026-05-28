import { useEffect } from "react";
import type { Idea, Heat } from "../data/ideas";
import "./IssuePanel.css";

const STATUS_LABEL: Record<Heat, string> = {
  shipped: "Shipped",
  "in-progress": "Blocked",
  validated: "In Progress",
  raw: "Backlog",
  parked: "Parked",
};

const PANEL_W = 288;
const PANEL_H = 120; // minimum height, grows with content

interface Props {
  idea: Idea;
  x: number;
  y: number;
  onClose: () => void;
}

export default function IssuePanel({ idea, x, y, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const left = Math.min(x + 16, window.innerWidth - PANEL_W - 16);
  const top = Math.min(Math.max(y - 24, 16), window.innerHeight - PANEL_H - 16);

  const jiraUrl = idea.key
    ? `https://rev-savvy.atlassian.net/browse/${idea.key}`
    : null;

  return (
    <div
      className={`issue-panel issue-panel--${idea.heat}`}
      style={{ left, top }}
      onClick={e => e.stopPropagation()}
      onWheel={e => e.stopPropagation()}
    >
      <div className="issue-panel__header">
        <span className="issue-panel__key">{idea.key ?? "—"}</span>
        <button className="issue-panel__close" onClick={onClose} aria-label="Close">×</button>
      </div>

      <p className="issue-panel__title">{idea.title}</p>

      {idea.description && (
        <p className="issue-panel__description">{idea.description}</p>
      )}

      <div className="issue-panel__chips">
        <span className={`issue-panel__chip issue-panel__chip--status issue-panel__chip--${idea.heat}`}>
          {STATUS_LABEL[idea.heat]}
        </span>
        {idea.issueType && (
          <span className="issue-panel__chip">{idea.issueType}</span>
        )}
      </div>

      {jiraUrl && (
        <a
          className="issue-panel__cta"
          href={jiraUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Jira →
        </a>
      )}
    </div>
  );
}
