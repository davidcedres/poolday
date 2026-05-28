export type Heat = "shipped" | "in-progress" | "validated" | "raw" | "parked";

export interface Idea {
  id: string;
  title: string;
  heat: Heat;
  votes: number;
  col: number;
  row: number;
  wiggleOffset: number;
  key?: string;
  issueType?: string;
  description?: string;
  rank?: number;
}

// RS backlog — Blocked → in-progress, Backlog+Medium → raw, Backlog+Low → parked
const ideas: Idea[] = [
  // ── Blocked (inner cluster) ─────────────────────────────────────
  { id: "RS-3666", key: "RS-3666", title: "Add 'updated by' info and release notes to Refresh UI.",       heat: "in-progress", issueType: "Sub-task", votes: 0, col:  0, row:  0, wiggleOffset: 0.00 },
  { id: "RS-1952", key: "RS-1952", title: "Harmonize Last Modified By/On columns across all repos.",       heat: "in-progress", issueType: "Task",     votes: 0, col:  1, row:  0, wiggleOffset: 0.15 },
  { id: "RS-1529", key: "RS-1529", title: "Bulk text quality check from Requirements listing screen.",     heat: "in-progress", issueType: "Task",     votes: 0, col: -1, row:  0, wiggleOffset: 0.30 },
  { id: "RS-1348", key: "RS-1348", title: "Frontend changes to support RunID.",                            heat: "in-progress", issueType: "Task",     votes: 0, col:  0, row: -1, wiggleOffset: 0.45 },
  { id: "RS-1151", key: "RS-1151", title: "Build Reset Password UI.",                                      heat: "in-progress", issueType: "Sub-task", votes: 0, col:  1, row: -1, wiggleOffset: 0.60 },
  { id: "RS-1247", key: "RS-1247", title: "Widen Name column in repository list screens.",                 heat: "in-progress", issueType: "Task",     votes: 0, col: -1, row: -1, wiggleOffset: 0.75 },
  // ── Backlog Medium (outer rings) ────────────────────────────────
  { id: "RS-3430", key: "RS-3430", title: "Revise Requirements filter to support SOX compliance.",         heat: "raw",         issueType: "Task",     votes: 0, col:  0, row:  1, wiggleOffset: 0.10 },
  { id: "RS-3928", key: "RS-3928", title: "Prevent generic headers like Column1 in CSV templates.",        heat: "raw",         issueType: "Bug",      votes: 0, col:  1, row:  1, wiggleOffset: 0.25 },
  { id: "RS-3165", key: "RS-3165", title: "Logo and ARC name are missing from the UI.",                   heat: "raw",         issueType: "Bug",      votes: 0, col: -1, row:  1, wiggleOffset: 0.40 },
  { id: "RS-3181", key: "RS-3181", title: "Show email address on the Users listing screen.",               heat: "raw",         issueType: "Task",     votes: 0, col:  2, row:  0, wiggleOffset: 0.55 },
  { id: "RS-190",  key: "RS-190",  title: "Date filters should support picking a specific date or range.", heat: "raw",         issueType: "Story",    votes: 0, col: -2, row:  0, wiggleOffset: 0.70 },
  { id: "RS-3041", key: "RS-3041", title: "Spike: explore how to visualize traceability.",                 heat: "raw",         issueType: "Spike",    votes: 0, col:  2, row:  1, wiggleOffset: 0.05 },
  { id: "RS-1419", key: "RS-1419", title: "Build Blocks → Scripts traceability report UI.",               heat: "raw",         issueType: "Task",     votes: 0, col: -2, row:  1, wiggleOffset: 0.20 },
  { id: "RS-2270", key: "RS-2270", title: "Enforce required field behavior in Blocks, Scripts, Suites.",   heat: "raw",         issueType: "Task",     votes: 0, col:  0, row:  2, wiggleOffset: 0.35 },
  { id: "RS-2889", key: "RS-2889", title: "Allow adding comments to requirements from the UI.",            heat: "raw",         issueType: "Sub-task", votes: 0, col:  1, row:  2, wiggleOffset: 0.50 },
  { id: "RS-1556", key: "RS-1556", title: "Upload defects via CSV or Excel file.",                         heat: "raw",         issueType: "Task",     votes: 0, col: -1, row:  2, wiggleOffset: 0.65 },
  { id: "RS-1245", key: "RS-1245", title: "UI to link blocks and requirements together.",                  heat: "raw",         issueType: "Sub-task", votes: 0, col:  2, row: -1, wiggleOffset: 0.80 },
  { id: "RS-1544", key: "RS-1544", title: "Design the Requirements ↔ Blocks linking UI.",                 heat: "raw",         issueType: "Task",     votes: 0, col: -2, row: -1, wiggleOffset: 0.12 },
  { id: "RS-1389", key: "RS-1389", title: "Add document file picker to Blocks custom commands.",           heat: "raw",         issueType: "Task",     votes: 0, col:  0, row: -2, wiggleOffset: 0.27 },
  { id: "RS-1159", key: "RS-1159", title: "Define and align save behaviors across the UI.",                heat: "raw",         issueType: "Task",     votes: 0, col:  1, row: -2, wiggleOffset: 0.42 },
  { id: "RS-514",  key: "RS-514",  title: "Deactivating an org silently blocks form submission.",          heat: "raw",         issueType: "Bug",      votes: 0, col: -1, row: -2, wiggleOffset: 0.57 },
  // ── Backlog Low (parked) ─────────────────────────────────────────
  { id: "RS-1138", key: "RS-1138", title: "Show required field error messages consistently across ARC.",   heat: "parked",      issueType: "Task",     votes: 0, col:  2, row:  2, wiggleOffset: 0.85 },
];

export default ideas;
