import { useState } from "react";
import { ArrowLeft, Mail, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import httpClient from "../api/httpClient";
import { useTheme } from "../utils/Theme";
import { errMsg } from "../lib/api";
import { Button, Field, IconButton, Input } from "../components/ui";

const SPRITEERA_URL = "https://spriteera.com"; // put your real site URL here
const POWERED_BY_URL = `${SPRITEERA_URL}/?utm_source=journalism_admin_panel&utm_medium=forgot_password_page&utm_campaign=powered_by_spriteera`;

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { resolved, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await httpClient.post("forgot-password", { email: email.trim() });
      toast.success(data?.message || "If this email is registered, a reset link has been sent.");
      setEmail("");
    } catch (error) {
      toast.error(errMsg(error, "Could not send reset email"));
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
        <img className="mb-8 h-10 w-fit object-contain" src="/logo.png" alt="The Journalism" />

        <h1 className="text-3xl font-bold tracking-tight text-fg">Forgot password?</h1>
        <p className="mt-2 text-sm text-fg-subtle sm:text-base">Enter your email and we'll help you get back in.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field label="Email" required>
            <Input
              icon={Mail}
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
            />
          </Field>

          <Button type="submit" size="lg" block loading={loading}>Submit</Button>
        </form>

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