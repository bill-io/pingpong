import { FormEvent, useState } from "react";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await authApi.login(email, password);
      login(response);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Invalid credentials");
      } else {
        setError("Invalid credentials");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-slate-700/60 bg-slate-900/80 p-8 shadow-2xl shadow-sky-500/10 backdrop-blur">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Agent access</p>
          <h1 className="text-2xl font-semibold text-white">Sign in to PingPong Hub</h1>
          <p className="text-sm text-slate-300">
            Enter your agent credentials to manage events, tables, and players.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2 text-left">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/50"
              placeholder="agent@pingpong.com"
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/50"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : (
            <p className="text-xs text-slate-400">
              Need access? Contact an administrator to receive your agent credentials.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 disabled:cursor-not-allowed disabled:bg-sky-400/60"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
