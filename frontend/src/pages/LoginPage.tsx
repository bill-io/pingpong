import { FormEvent, useState } from "react";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

type AuthMode = "login" | "signup";

type AuthError = string | null;

export default function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<AuthError>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const isLogin = mode === "login";

  const resetFeedback = () => {
    setError(null);
  };

  const switchMode = (next: AuthMode) => {
    if (mode === next) return;
    setMode(next);
    resetFeedback();
    setSubmitting(false);
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();
    setSubmitting(true);

    try {
      const response = await authApi.login(loginEmail.trim(), loginPassword);
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

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetFeedback();

    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }

    if (signupPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    const email = signupEmail.trim();

    if (!email) {
      setError("Email is required");
      setSubmitting(false);
      return;
    }

    try {
      await authApi.signup({
        full_name: fullName.trim(),
        email,
        password: signupPassword
      });

      const response = await authApi.login(email, signupPassword);
      login(response);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Unable to create account");
      } else {
        setError("Unable to create account");
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
          <h1 className="text-2xl font-semibold text-white">
            {isLogin ? "Sign in to PingPong Hub" : "Create your PingPong Hub account"}
          </h1>
          <p className="text-sm text-slate-300">
            {isLogin
              ? "Enter your agent credentials to manage events, tables, and players."
              : "Create your agent profile to start managing your own events and player database."}
          </p>
        </div>

        {isLogin ? (
          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/50"
                placeholder="agent@pingpong.com"
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/50"
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <p className="text-sm text-rose-300">{error}</p>
            ) : (
              <p className="text-xs text-slate-400">
                Need access? Create an account to get started with your own PingPong workspace.
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
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSignup}>
            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300" htmlFor="full-name">
                Full name
              </label>
              <input
                id="full-name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/50"
                placeholder="Alex Agent"
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300" htmlFor="signup-email">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/50"
                placeholder="agent@pingpong.com"
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300" htmlFor="signup-password">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/50"
                placeholder="Create a secure password"
              />
            </div>

            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-300" htmlFor="confirm-password">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/50"
                placeholder="Repeat your password"
              />
            </div>

            {error ? (
              <p className="text-sm text-rose-300">{error}</p>
            ) : (
              <p className="text-xs text-slate-400">
                Passwords must be at least 8 characters. Use a strong phrase to keep your account safe.
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/70 disabled:cursor-not-allowed disabled:bg-sky-400/60"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          {isLogin ? (
            <span>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="font-semibold text-sky-300 transition hover:text-sky-200"
              >
                Sign up now
              </button>
            </span>
          ) : (
            <span>
              Already registered?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-semibold text-sky-300 transition hover:text-sky-200"
              >
                Back to sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
