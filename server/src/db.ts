import pkg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, integer, real, serial, timestamp, primaryKey } from "drizzle-orm/pg-core";

const { Pool } = pkg;

export const usersTable = pgTable("users", {
  id:           serial("id").primaryKey(),
  email:        text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt:    timestamp("created_at").defaultNow(),
});

export const jiraCredentialsTable = pgTable("jira_credentials", {
  userId:    integer("user_id").primaryKey(),
  jiraHost:  text("jira_host").notNull(),
  jiraEmail: text("jira_email").notNull(),
  jiraToken: text("jira_token").notNull(),
});

export const issuesTable = pgTable("issues", {
  key:          text("key").notNull(),
  userId:       integer("user_id").notNull(),
  summary:      text("summary").notNull(),
  title:        text("title"),
  description:  text("description"),
  status:       text("status").notNull(),
  priority:     text("priority").notNull(),
  issueType:    text("issue_type").notNull(),
  heat:         text("heat").notNull(),
  rank:         integer("rank").notNull().default(999),
  col:          integer("col").notNull(),
  row:          integer("row").notNull(),
  wiggleOffset: real("wiggle_offset").notNull(),
}, (t) => [primaryKey({ columns: [t.key, t.userId] })]);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool);

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS jira_credentials (
      user_id    INTEGER PRIMARY KEY,
      jira_host  TEXT NOT NULL,
      jira_email TEXT NOT NULL,
      jira_token TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS issues (
      key           TEXT NOT NULL,
      user_id       INTEGER NOT NULL,
      summary       TEXT NOT NULL,
      title         TEXT,
      description   TEXT,
      status        TEXT NOT NULL,
      priority      TEXT NOT NULL,
      issue_type    TEXT NOT NULL,
      heat          TEXT NOT NULL,
      rank          INTEGER NOT NULL DEFAULT 999,
      col           INTEGER NOT NULL,
      row           INTEGER NOT NULL,
      wiggle_offset REAL NOT NULL,
      PRIMARY KEY (key, user_id)
    );
  `);
}
