import { useState } from "react";
import { ArrowLeft, Check, Lock, Moon, Sun, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import httpClient from "../api/httpClient";
import { useTheme } from "../utils/Theme";
import { errMsg } from "../lib/api";
import { Button, Field, IconButton, Input } from "../components/ui";

const SPRITEERA_URL = "https://spriteera.com"; // put your real site URL here
const POWERED_BY_URL = `${SPRITEERA_URL}/?utm_source=journalism_admin_panel&utm_medium=reset_password_page&utm_campaign=powered_by_spriteera`;

const RULES = [
  { id: "len", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "num", label: "One number", test: (p) => /\d/.test(p) },
];

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resolved, toggleTheme } = useTheme();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkError, setLinkError] = useState("");

  const passed = RULES.map((r) => r.test(password));
  const allValid = passed.every(Boolean);
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!allValid) return toast.error("Password does not meet all the requirements");
    if (password !== confirmPassword) return toast.error("Passwords do not match");

    setLoading(true);
    try {
      const { data } = await httpClient.put(`reset-password/${token}`, { password, confirmPassword });
      toast.success(data?.message || "Password reset successfully. Please sign in.");
      navigate("/login", { replace: true });
    } catch (error) {
      const message = errMsg(error, "Could not reset password");
      if (error?.response?.status === 400 && /invalid|expired/i.test(message)) setLinkError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-canvas p-3 sm:p-8">
      {/* soft background glows */}
      <div className="pointer-events-none absolute -right-24 -top-24 size-[30rem] rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-500/10" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-[28rem] rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" aria-hidden />

      <IconButton label="Toggle theme" onClick={toggleTheme} className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
        {resolved === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </IconButton>

      <div className="relative mt-12 w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-2xl shadow-blue-900/10 sm:mt-0 sm:p-10">
        <img className="mb-8 h-8 w-fit object-contain mx-auto" src="/logo.png" alt="The Journalism" />

        <h1 className="text-3xl font-bold tracking-tight text-fg">Set a new password</h1>
        <p className="mt-2 text-sm text-fg-subtle sm:text-base leading-tight">Choose a new password for your newsroom account.</p>

        {linkError ? (
          <div className="mt-8 space-y-5">
            <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {linkError}
            </p>
            <Button block size="lg" onClick={() => navigate("/forgot-password")}>Request a new link</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field label="New password" required>
              <Input
                icon={Lock}
                type="password"
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="[&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                required
                autoFocus
              />
            </Field>

            {password.length > 0 && (
              <ul className="-mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5" aria-live="polite">
                {RULES.map((r, i) => (
                  <li key={r.id} className={`flex items-center gap-1.5 text-xs transition-colors ${passed[i] ? "text-green-600 dark:text-green-400" : "text-fg-subtle"}`}>
                    {passed[i] ? <Check className="size-3.5 shrink-0" /> : <X className="size-3.5 shrink-0" />}
                    {r.label}
                  </li>
                ))}
              </ul>
            )}

            <Field label="Confirm password" required>
              <Input
                icon={Lock}
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                invalid={mismatch}
                className="[&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                required
              />
            </Field>
            <p className="-mt-3 min-h-4 text-xs text-red-600 dark:text-red-400" aria-live="polite">
              {mismatch ? "Passwords do not match" : ""}
            </p>

            <Button type="submit" size="lg" block loading={loading}>Reset password</Button>
          </form>
        )}

        <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          <ArrowLeft className="size-4" />
          Back to login
        </Link>
      </div>

      <a
        href={POWERED_BY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="relative mt-8 inline-flex flex-col items-center leading-tight transition-opacity hover:opacity-80"
      >
        <span className="text-xs text-fg-subtle">Powered by</span>
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-fg">Spriteera</span>
      </a>
    </div>
  );
}