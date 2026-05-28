import { useState } from "react";
import { login, signup } from "../lib/auth";
import "./AuthPage.css";

interface Props {
  onAuth: (token: string) => void;
}

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
  );
}
