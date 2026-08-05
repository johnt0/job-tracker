import { useState } from "react";
import type { SubmitEvent } from "react";
import { apiFetch } from "./api";

interface LoginProps {
  onLogin: (username: string) => void;
}

function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/auth/login/", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        onLogin(data.username);
        return;
      }
      if (res.status === 429) {
        setError("Too many attempts. Try again in a minute.");
        return;
      }

      await res.json();
      setError("Invalid username or password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-paper border border-rule shadow-modal rounded-xl p-7">
        <h1 className="font-display font-semibold text-2xl">Job Tracker</h1>
        <p className="mt-1.5 text-ink-soft">Sign in to continue</p>
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm text-ink-soft mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting}
              required
              className="w-full rounded-lg border border-rule-strong px-3 py-2 font-body outline-none"
            />
          </div>
          <div className="mb-2">
            <label htmlFor="password" className="block text-sm text-ink-soft">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
              required
              className="w-full rounded-lg border border-rule-strong px-3 py-2 font-body outline-none"
            />
          </div>
          <div className="min-h-5 mb-2">
            {error && (
              <p className="text-sm" style={{ color: "var(--color-rejected)" }}>
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary press w-full mt-2"
          >
            {submitting ? "Signing in..." : "Log in"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default Login;
