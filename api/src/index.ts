import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { Version3Client } from "jira.js";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Context, Next } from "hono";
import { rateLimiter } from "hono-rate-limiter";
import { db, initDb, usersTable, jiraCredentialsTable, issuesTable } from "./db.js";

const { GROQ_API_KEY, JWT_SECRET, CORS_ORIGIN, PORT } = process.env;

for (const [key, val] of Object.entries({ JWT_SECRET, CORS_ORIGIN, PORT })) {
  if (!val) { console.error(`${key} must be set in .env`); process.exit(1); }
}

// ── Rate limiting ──────────────────────────────────────────────────

// Auth: 20 attempts per 15 min per IP
const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  keyGenerator: c => c.req.header("x-forwarded-for")?.split(",")[0].trim() ?? "unknown",
});

// Sync: 10 per hour per user — Groq cost protection
const syncLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  keyGenerator: c => c.req.header("authorization") ?? "anon",
});

// ── Helpers ────────────────────────────────────────────────────────

function statusToHeat(status: string): string {
  if (status === "Blocked") return "in-progress";
  if (status === "In Progress") return "validated";
  return "raw";
}

function adfToText(node: any): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  if (node.type === "mention") return node.attrs?.text ?? "";
  const children = (node.content ?? []).map(adfToText).join("");
  const isBlock = ["paragraph", "heading", "listItem", "blockquote", "codeBlock"].includes(node.type);
  return isBlock ? children + "\n" : children;
}

async function condenseTitleWithGroq(summary: string, description: string | null): Promise<string> {
  if (!GROQ_API_KEY) return summary;
  try {
    const context = description?.trim()
      ? `Title: ${summary}\nDescription: ${description.slice(0, 500)}`
      : summary;
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "Distill this Jira issue to a 5-7 word label. Skip filler words. No quotes. No period. Output only the label, nothing else." },
          { role: "user", content: context },
        ],
        max_tokens: 30,
        temperature: 0.2,
      }),
    });
    const data = await res.json() as any;
    const raw = data.choices?.[0]?.message?.content?.trim() ?? summary;
    return raw.replace(/^["'""'']+|["'""'']+$/g, "").trim();
  } catch {
    return summary;
  }
}

function findSlot(occupied: Set<string>, startRadius: number): { col: number; row: number } {
  for (let radius = startRadius; radius < 20; radius++) {
    const candidates: [number, number][] = [];
    for (let c = -radius; c <= radius; c++) candidates.push([c, -radius], [c, radius]);
    for (let r = -radius + 1; r < radius; r++) candidates.push([-radius, r], [radius, r]);
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    for (const [col, row] of candidates) {
      if (!occupied.has(`${col},${row}`)) return { col, row };
    }
  }
  return { col: 0, row: 20 };
}

// ── Auth middleware ────────────────────────────────────────────────

type Variables = { userId: number };
const app = new Hono<{ Variables: Variables }>();

app.use("*", logger());
app.use("*", cors({ origin: CORS_ORIGIN! }));

const requireAuth = async (c: Context<{ Variables: Variables }>, next: Next) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) return c.json({ error: "Unauthorized" }, 401);
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET!) as { userId: number };
    c.set("userId", payload.userId);
    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
};

// ── Auth routes ────────────────────────────────────────────────────

app.post("/api/auth/signup", authLimiter, async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  if (!email || !password || password.length < 6)
    return c.json({ error: "Email and password (min 6 chars) required" }, 400);

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length) return c.json({ error: "Email already registered" }, 409);

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ email, passwordHash }).returning({ id: usersTable.id });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET!, { expiresIn: "30d" });
  return c.json({ token });
});

app.post("/api/auth/login", authLimiter, async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return c.json({ error: "Invalid email or password" }, 401);

  const token = jwt.sign({ userId: user.id }, JWT_SECRET!, { expiresIn: "30d" });
  return c.json({ token });
});

// ── Jira credentials ───────────────────────────────────────────────

app.get("/api/jira/credentials", requireAuth, async (c) => {
  const userId = c.get("userId");
  const [creds] = await db.select().from(jiraCredentialsTable).where(eq(jiraCredentialsTable.userId, userId));
  return c.json({ configured: !!creds, host: creds?.jiraHost, email: creds?.jiraEmail });
});

app.post("/api/jira/credentials", requireAuth, async (c) => {
  const userId = c.get("userId");
  const { host, email, token } = await c.req.json<{ host: string; email: string; token: string }>();
  await db.insert(jiraCredentialsTable)
    .values({ userId, jiraHost: host, jiraEmail: email, jiraToken: token })
    .onConflictDoUpdate({ target: jiraCredentialsTable.userId, set: { jiraHost: host, jiraEmail: email, jiraToken: token } });
  return c.json({ ok: true });
});

// ── Issue routes ───────────────────────────────────────────────────

app.patch("/api/backlog/:key/position", requireAuth, async (c) => {
  const userId = c.get("userId");
  const key = c.req.param("key");
  const { col, row } = await c.req.json<{ col: number; row: number }>();
  await db.update(issuesTable).set({ col, row })
    .where(and(eq(issuesTable.key, key), eq(issuesTable.userId, userId)));
  return c.json({ ok: true });
});

app.get("/api/backlog", requireAuth, async (c) => {
  const userId = c.get("userId");
  const issues = await db.select().from(issuesTable).where(eq(issuesTable.userId, userId));
  return c.json({ issues });
});

app.post("/api/backlog/sync", requireAuth, syncLimiter, async (c) => {
  const userId = c.get("userId");
  const [creds] = await db.select().from(jiraCredentialsTable).where(eq(jiraCredentialsTable.userId, userId));
  if (!creds) return c.json({ error: "Jira credentials not configured" }, 400);

  const jira = new Version3Client({
    host: creds.jiraHost,
    authentication: { basic: { email: creds.jiraEmail, apiToken: creds.jiraToken } },
  });

  const result = await jira.issueSearch.searchForIssuesUsingJqlEnhancedSearchPost({
    jql: `project = RS AND status NOT IN ("Code Complete", "Done", "Ready For QA", "Won't Do") AND assignee = currentUser() ORDER BY rank ASC`,
    fields: ["summary", "status", "priority", "issuetype", "description"],
    maxResults: 200,
  });

  const jiraIssues = result.issues ?? [];
  console.log(`← ${jiraIssues.length} issues from Jira`);

  const existing = await db.select().from(issuesTable).where(eq(issuesTable.userId, userId));
  const existingMap = new Map(existing.map(i => [i.key, i]));
  const occupied = new Set(existing.map(i => `${i.col},${i.row}`));
  const jiraKeys = new Set(jiraIssues.map(i => i.key!));

  for (const row of existing) {
    if (!jiraKeys.has(row.key)) {
      await db.delete(issuesTable).where(and(eq(issuesTable.key, row.key), eq(issuesTable.userId, userId)));
      occupied.delete(`${row.col},${row.row}`);
    }
  }

  for (const [rankIndex, issue] of jiraIssues.entries()) {
    const key = issue.key!;
    const fields = issue.fields as Record<string, any>;
    const summary     = fields.summary as string;
    const status      = fields.status?.name as string;
    const priority    = fields.priority?.name as string;
    const issueType   = fields.issuetype?.name as string;
    const heat        = statusToHeat(status);
    const description = fields.description ? adfToText(fields.description).trim() || null : null;

    if (existingMap.has(key)) {
      const existing = existingMap.get(key)!;
      const needsTitle = existing.title == null || existing.description == null;
      const title = needsTitle ? await condenseTitleWithGroq(summary, description) : existing.title;
      await db.update(issuesTable)
        .set({ summary, title, description, status, priority, issueType, heat, rank: rankIndex })
        .where(and(eq(issuesTable.key, key), eq(issuesTable.userId, userId)));
    } else {
      const title = await condenseTitleWithGroq(summary, description);
      const { col, row } = findSlot(occupied, heat === "in-progress" ? 0 : 2);
      occupied.add(`${col},${row}`);
      await db.insert(issuesTable)
        .values({ key, userId, summary, title, description, status, priority, issueType, heat, rank: rankIndex, col, row, wiggleOffset: Math.random() });
    }
  }

  const updated = await db.select().from(issuesTable).where(eq(issuesTable.userId, userId));
  console.log(`→ ${updated.length} issues in DB`);
  return c.json({ issues: updated });
});

// ── Boot ───────────────────────────────────────────────────────────

await initDb();

const port = parseInt(PORT!);
const server = serve({ fetch: app.fetch, port }, () =>
  console.log(`funpool server → http://localhost:${port}`)
);

process.on("SIGINT", () => server.close());
process.on("SIGTERM", () => server.close());
