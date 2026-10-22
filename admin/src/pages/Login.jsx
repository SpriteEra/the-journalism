import { useEffect, useState } from "react";
import { Eye, EyeOff, Lock, LogIn, Mail, Moon, PenTool, Sun } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { getUser, getUserFail, getUserSuccess } from "../redux/slices/user.slice";
import httpClient from "../api/httpClient";
import { useTheme } from "../utils/Theme";
import { errMsg } from "../lib/api";
import { Button, Field, IconButton, Input } from "../components/ui";

const BRAND = "The Journalism";
const SPRITEERA_URL = "https://spriteera.com"; // put your real site URL here
const POWERED_BY_URL = `${SPRITEERA_URL}/?utm_source=journalism_admin_panel&utm_medium=login_page&utm_campaign=powered_by_spriteera`;
const REMEMBER_KEY = "login:remembered-email";

/** Pen-nib mark + serif wordmark. */
function Brand({ className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid size-10 place-items-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
        <PenTool className="size-5" />
      </span>
      <span className="font-serif text-2xl font-bold tracking-tight text-fg">{BRAND}</span>
    </div>
  );
}

function PoweredBy({ className = "" }) {
  return (
    <a
      href={POWERED_BY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex flex-col w-fit leading-tight transition-opacity hover:opacity-80 ${className}`}
    >
      <span className="text-xs text-fg-subtle">Powered by</span>
      <span className="text-sm font-semibold uppercase tracking-[0.3em] text-fg">Spriteera</span>
    </a>
  );
}

/** Faint tilted newspaper drawn with SVG – decoration only. */
function NewspaperArt() {
  return (
    <svg viewBox="0 0 420 340" className="pointer-events-none absolute -bottom-10 right-0 w-[78%] max-w-[460px] opacity-30 dark:opacity-30" aria-hidden>
      <g transform="rotate(-14 210 190)">
        <rect x="70" y="60" width="270" height="230" rx="10" fill="#ffffff" stroke="#c9d6ea" strokeWidth="1.5" />
        <rect x="60" y="72" width="270" height="230" rx="10" fill="#f4f8fe" stroke="#d3deef" strokeWidth="1.5" />
        <text x="90" y="118" fontFamily="Georgia, serif" fontSize="30" fontWeight="700" fill="#b7c6de" letterSpacing="3">NEWS</text>
        <line x1="90" y1="132" x2="310" y2="132" stroke="#c9d6ea" strokeWidth="2" />
        {[150, 164, 178, 192, 206].map((y) => <line key={y} x1="90" y1={y} x2="190" y2={y} stroke="#d3deef" strokeWidth="5" strokeLinecap="round" />)}
        <rect x="204" y="146" width="106" height="72" rx="6" fill="#dbe6f6" />
        <path d="M204 218 L236 188 L258 206 L282 176 L310 210 L310 218 Z" fill="#c4d4ec" />
        {[236, 250, 264, 278].map((y) => <line key={y} x1="90" y1={y} x2="310" y2={y} stroke="#d3deef" strokeWidth="5" strokeLinecap="round" />)}
      </g>
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem(REMEMBER_KEY) || ""; } catch { return ""; }
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(() => {
    try { return Boolean(localStorage.getItem(REMEMBER_KEY)); } catch { return false; }
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { search } = useLocation();
  const redirect = new URLSearchParams(search).get("redirect");
  const { user } = useSelector((s) => s.user);
  const { resolved, toggleTheme } = useTheme();

  useEffect(() => { if (user) navigate(redirect && redirect !== "/login" ? redirect : "/dashboard", { replace: true }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    dispatch(getUser());
    try {
      const { data } = await httpClient.post("sign-in", { email, password });
      dispatch(getUserSuccess(data));
      // older backends do not send permissions with the login response – /me always does
      if (!data?.user?.permissions) {
        try { const me = await httpClient.get("/me"); dispatch(getUserSuccess({ user: me.data.user })); } catch { /* keep the login payload */ }
      }
      try { remember ? localStorage.setItem(REMEMBER_KEY, email) : localStorage.removeItem(REMEMBER_KEY); } catch { /* storage unavailable */ }
      toast.success("Welcome back!");
      navigate(redirect && redirect !== "/login" ? redirect : "/dashboard");
    } catch (error) {
      dispatch(getUserFail());
      toast.error(errMsg(error, "Could not sign in"));
    } finally { setLoading(false); }
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-canvas p-4 sm:p-8">
      {/* soft background glows */}
      <div className="pointer-events-none absolute -right-24 -top-24 size-[30rem] rounded-full bg-blue-200/50 blur-3xl dark:bg-blue-500/10" aria-hidden />
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-[28rem] rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-500/10" aria-hidden />

      <IconButton label="Toggle theme" onClick={toggleTheme} className="absolute right-2 md:right-4 top-2 md:top-4 z-10">
        {resolved === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </IconButton>

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-xl md:rounded-3xl border border-line bg-surface shadow-2xl shadow-blue-900/10 lg:min-h-[640px] lg:grid-cols-2">
        {/* left: brand */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-50 via-white to-sky-50 p-12 lg:flex dark:from-blue-950/40 dark:via-surface dark:to-surface">
          <div className="absolute left-1/3 top-10 size-72 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" aria-hidden />
          <div className="relative">
            <img className="h-10 w-fit object-contain " src="/logo.png" />
            <h2 className="mt-10 text-2xl md:text-3xl lg:text-[55px] font-bold leading-[1.02] tracking-tight text-fg">
              Newsroom
              <span className="block text-blue-600 dark:text-blue-400">made simple.</span>
            </h2>
            <p className="mt-4 max-w-xs text-lg text-fg-muted">
              Write, review and publish stories with complete control.
            </p>
          </div>
          <NewspaperArt />
          <PoweredBy className="relative" />
        </aside>

        {/* right: form */}
        <main className="flex flex-col justify-center p-6 sm:p-12 lg:p-16">
          <Brand className="mb-6 sm:mb-10 lg:hidden" />
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-fg">Welcome back</h1>
          <p className="text-sm md:text-base sm:mt-2 text-fg-subtle">Sign in to your newsroom account</p>

          <form onSubmit={submit} className="mt-5 md:mt-9 space-y-5">
            <Field label="Email or username" required>
              <Input icon={Mail} autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required autoFocus />
            </Field>

            <Input
              icon={Lock}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
              required
            />
            {/* <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-fg-subtle transition-colors hover:bg-surface-2 hover:text-fg"
            >
              {showPassword ?
                <EyeOff className="size-5" strokeWidth={1.75} /> : <Eye className="size-5" strokeWidth={1.75} />}
            </button> */}

            <div className="flex items-center justify-end gap-3">

              <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">Forgot password?</Link>
            </div>

            <Button type="submit" size="lg" block loading={loading} leftIcon={LogIn}>Sign in</Button>
          </form>

          {/* mobile: the brand panel is hidden */}
          <PoweredBy className="mt-10 lg:hidden" />
        </main>
      </div>
    </div>
  );
} 