import type { Heat, Idea } from "../data/ideas";
import { authHeaders, clearToken } from "./auth";

const BASE = import.meta.env.VITE_API_URL;

interface DbIssue {
  key: string;
  summary: string;
  title: string | null;
  description: string | null;
  status: string;
  priority: string;
  issueType: string;
  heat: string;
  rank: number;
  col: number;
  row: number;
  wiggleOffset: number;
}

function toIdea(i: DbIssue): Idea {
  return {
    id: i.key,
    key: i.key,
    title: i.title ?? i.summary,
    description: i.description ?? undefined,
    heat: i.heat as Heat,
    issueType: i.issueType,
    rank: i.rank,
    votes: 0,
    col: i.col,
    row: i.row,
    wiggleOffset: i.wiggleOffset,
  };
}

async function fetchIssues(url: string, init?: RequestInit): Promise<Idea[]> {
  const res = await fetch(url, { ...init, headers: { ...authHeaders(), ...(init?.headers as object) } });
  if (res.status === 401) { clearToken(); throw new Error("Unauthorized"); }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Server returned ${res.status}${text ? `: ${text.slice(0, 120)}` : ""}`);
  }
  const data: { issues: DbIssue[] } = await res.json();
  return data.issues.map(toIdea);
}

export const loadBacklog = () =>
  fetchIssues(`${BASE}/api/backlog`);

export const syncBacklog = () =>
  fetchIssues(`${BASE}/api/backlog/sync`, { method: "POST" });

export async function moveIssue(key: string, col: number, row: number): Promise<void> {
  const res = await fetch(`${BASE}/api/backlog/${key}/position`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ col, row }),
  });
  if (!res.ok) throw new Error(`Move failed: ${res.status}`);
}
