import { useState } from "react";
import { login, signup } from "../lib/auth";
import "./AuthPage.css";

interface Props {
  onAuth: (token: string) => void;
}

const DEMO_CARDS = [
  { key: "RS-42",  title: "Dark mode toggle",       heat: "in-progress", top: "5%",  left: "22%", delay: "0s",     duration: "3.8s" },
  { key: "RS-17",  title: "Fix login redirect bug",  heat: "in-progress", top: "38%", left: "48%", delay: "-1.2s",  duration: "4.2s" },
  { key: "RS-88",  title: "CSV export feature",      heat: "raw",         top: "55%", left: "6%",  delay: "-0.6s",  duration: "3.5s" },
  { key: "RS-55",  title: "API rate limiting",       heat: "validated",   top: "18%", left: "68%", delay: "-2.1s",  duration: "4.6s" },
  { key: "RS-103", title: "Mobile nav redesign",     heat: "raw",         top: "62%", left: "60%", delay: "-1.8s",  duration: "3.9s" },
  { key: "RS-29",  title: "Bulk actions on cards",   heat: "raw",         top: "78%", left: "28%", delay: "-0.3s",  duration: "4.1s" },
  { key: "RS-71",  title: "Onboarding flow v2",      heat: "raw",         top: "26%", left: "2%",  delay: "-2.5s",  duration: "3.6s" },
];

const HEAT_LABEL: Record<string, string> = {
  "in-progress": "Blocked",
  validated: "In Progress",
  raw: "Backlog",
};

export default function AuthPage({ onAuth }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = mode === "login"
        ? await login(email, password)
        : await signup(email, password);
      onAuth(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ── Left: landing ── */}
      <div className="auth-landing">
        <div className="auth-landing__top">
          <span className="auth-landing__logo">Pool Day</span>
          <p className="auth-landing__tagline">
            Your Jira backlog,<br />but make it fun.
          </p>
          <p className="auth-landing__sub">
            Pull your issues into a living canvas. See what's blocked,
            what's next, drag things around — it's your backlog,
            finally feeling like yours.
          </p>
          <div className="auth-landing__pills">
            <span className="auth-landing__pill">Magnetic drag & drop</span>
            <span className="auth-landing__pill">AI-condensed titles</span>
            <span className="auth-landing__pill auth-landing__pill--next">↑ Next indicator</span>
          </div>
        </div>

        <div className="auth-landing__canvas">
          {DEMO_CARDS.map(card => (
            <div
              key={card.key}
              className={`auth-demo-card auth-demo-card--${card.heat}`}
              style={{ top: card.top, left: card.left, animationDuration: card.duration, animationDelay: card.delay }}
            >
              <div className="auth-demo-card__top">
                <span className="auth-demo-card__dot" />
                <span className="auth-demo-card__key">{card.key}</span>
              </div>
              <p className="auth-demo-card__title">{card.title}</p>
              <span className="auth-demo-card__badge">{HEAT_LABEL[card.heat]}</span>
            </div>
          ))}
          <div className="auth-landing__canvas-fade" />
        </div>
      </div>

      {/* ── Right: auth form ── */}
      <div className="auth-form-side">
        <div className="auth-card">
          <h1 className="auth-card__logo">Pool Day</h1>
          <p className="auth-card__sub">{mode === "login" ? "Welcome back" : "Create your account"}</p>

          <form className="auth-card__form" onSubmit={submit}>
            <input
              className="auth-card__input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            <input
              className="auth-card__input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {error && <p className="auth-card__error">{error}</p>}
            <button className="auth-card__btn" type="submit" disabled={loading}>
              {loading ? "…" : mode === "login" ? "Sign in" : "Sign up"}
            </button>
          </form>

          <button
            className="auth-card__toggle"
            onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(null); }}
          >
            {mode === "login" ? "No account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
