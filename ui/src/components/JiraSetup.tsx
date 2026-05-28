import { useState } from "react";
import { saveJiraCredentials } from "../lib/auth";
import "./JiraSetup.css";

interface Props {
  onDone: () => void;
}

export default function JiraSetup({ onDone }: Props) {
  const [host, setHost] = useState("https://");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await saveJiraCredentials(host.trim(), email.trim(), token.trim());
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="jira-setup">
      <div className="jira-setup__card">
        <h2 className="jira-setup__title">Connect your Jira</h2>
        <p className="jira-setup__sub">Your credentials are stored securely and only used to sync your backlog.</p>

        <form className="jira-setup__form" onSubmit={submit}>
          <label className="jira-setup__label">
            Jira host
            <input
              className="jira-setup__input"
              type="url"
              placeholder="https://your-company.atlassian.net"
              value={host}
              onChange={e => setHost(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="jira-setup__label">
            Jira email
            <input
              className="jira-setup__input"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="jira-setup__label">
            API token
            <input
              className="jira-setup__input"
              type="password"
              placeholder="ATATT3x…"
              value={token}
              onChange={e => setToken(e.target.value)}
              required
            />
            <a
              className="jira-setup__hint"
              href="https://id.atlassian.com/manage-profile/security/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get an API token →
            </a>
          </label>

          {error && <p className="jira-setup__error">{error}</p>}

          <button className="jira-setup__btn" type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save and continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
