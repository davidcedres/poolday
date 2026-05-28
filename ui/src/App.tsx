import { useState, useCallback, useEffect } from "react";
import type { Idea } from "./data/ideas";
import Canvas from "./components/Canvas";
import AddIdeaBar from "./components/AddIdeaBar";
import AuthPage from "./components/AuthPage";
import JiraSetup from "./components/JiraSetup";
import { getToken, setToken, clearToken, getJiraCredentials } from "./lib/auth";
import { loadBacklog, syncBacklog, moveIssue } from "./lib/jira";
import "./App.css";

let nextId = 1;

function findFreeSlot(occupied: Set<string>): { col: number; row: number } {
    for (let radius = 4; radius < 20; radius++) {
        const candidates: [number, number][] = [];
        for (let c = -radius; c <= radius; c++) {
            candidates.push([c, -radius], [c, radius]);
        }
        for (let r = -radius + 1; r < radius; r++) {
            candidates.push([-radius, r], [radius, r]);
        }
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

type AppState = "loading" | "unauthenticated" | "needs-jira" | "ready";
type PullState = "idle" | "loading" | "error";

export default function App() {
    const [appState, setAppState] = useState<AppState>("loading");
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [query, setQuery] = useState("");
    const [pullState, setPullState] = useState<PullState>("idle");
    const [pullError, setPullError] = useState<string | null>(null);

    useEffect(() => {
        const boot = async () => {
            if (!getToken()) { setAppState("unauthenticated"); return; }
            try {
                const creds = await getJiraCredentials();
                if (!creds.configured) { setAppState("needs-jira"); return; }
                const fetched = await loadBacklog();
                setIdeas(fetched);
                setAppState("ready");
            } catch (err: any) {
                if (err.message === "Unauthorized") { clearToken(); setAppState("unauthenticated"); }
                else setAppState("ready");
            }
        };
        boot();
    }, []);

    const handleAuth = useCallback((token: string) => {
        setToken(token);
        getJiraCredentials().then(creds => {
            if (creds.configured) {
                loadBacklog().then(setIdeas).catch(console.error);
                setAppState("ready");
            } else {
                setAppState("needs-jira");
            }
        }).catch(() => setAppState("needs-jira"));
    }, []);

    const handleJiraDone = useCallback(() => {
        loadBacklog().then(setIdeas).catch(console.error);
        setAppState("ready");
    }, []);

    const pullFromJira = useCallback(async () => {
        setPullState("loading");
        setPullError(null);
        try {
            const fetched = await syncBacklog();
            setIdeas(fetched);
            setPullState("idle");
        } catch (err) {
            setPullError(err instanceof Error ? err.message : String(err));
            setPullState("error");
        }
    }, []);

    const moveIdea = useCallback((key: string, col: number, row: number) => {
        setIdeas(prev => prev.map(i => i.key === key ? { ...i, col, row } : i));
        moveIssue(key, col, row).catch(err => console.error("Failed to save position", err));
    }, []);

    const addIdea = useCallback((title: string) => {
        setIdeas(prev => {
            const occupied = new Set(prev.map(i => `${i.col},${i.row}`));
            const { col, row } = findFreeSlot(occupied);
            return [...prev, { id: String(nextId++), title, heat: "raw", votes: 0, col, row, wiggleOffset: Math.random() }];
        });
    }, []);

    if (appState === "loading") return null;
    if (appState === "unauthenticated") return <AuthPage onAuth={handleAuth} />;
    if (appState === "needs-jira") return <JiraSetup onDone={handleJiraDone} />;

    return (
        <div className="app">
            <header className="app__header">
                <span className="app__logo">Pool Day</span>
                <span className="app__tagline">your product WHAT space</span>
                <div className="app__legend">
                    {(["in-progress", "validated", "raw"] as const).map(heat => (
                        <span key={heat} className={`app__legend-dot app__legend-dot--${heat}`}>
                            {{ "in-progress": "Blocked", validated: "In Progress", raw: "Backlog" }[heat]}
                        </span>
                    ))}
                </div>
                <button
                    className={`app__pull-btn app__pull-btn--${pullState}`}
                    onClick={pullFromJira}
                    disabled={pullState === "loading"}
                    title={pullState === "error" && pullError ? pullError : undefined}
                >
                    {pullState === "loading" ? (
                        <><span className="app__pull-spinner" /> Pulling…</>
                    ) : pullState === "error" ? "⚠ Retry pull" : "↓ Pull from Jira"}
                </button>
                <button className="app__signout-btn" onClick={() => { clearToken(); setAppState("unauthenticated"); }}>
                    Sign out
                </button>
            </header>

            <Canvas ideas={ideas} query={query} onMove={moveIdea} />
            <AddIdeaBar query={query} onQueryChange={setQuery} onAdd={addIdea} />
        </div>
    );
}
