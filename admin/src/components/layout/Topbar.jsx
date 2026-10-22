import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { LogOut, Menu as MenuIcon, Monitor, Moon, Sun, User } from "lucide-react";
import httpClient from "../../api/httpClient";
import { userLogOut } from "../../redux/slices/user.slice";
import { useTheme } from "../../utils/Theme";
import usePermission from "../../hooks/usePermission";
import NotificationCenter from "../notification/NotificationCenter";
import OraAIButton from "../keywords/OraAiButton";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import { IconButton } from "../ui/Button";
import Menu, { MenuItem, MenuLabel, MenuSeparator } from "../ui/Menu";
import Breadcrumbs from "./Breadcrumbs";
import LanguageSwitch from "./LanguageSwitch";
import { useTranslation } from "react-i18next";

const THEMES = [["light", "Light", Sun], ["dark", "Dark", Moon], ["system", "System", Monitor]];

export default function Topbar({ onOpenMenu }) {
  const { user, can } = usePermission();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { theme, resolved, setTheme } = useTheme();
  const { t } = useTranslation();

  const logout = async () => {
    const id = toast.loading("Logging out…");
    try { await httpClient.post("/log-out"); } catch { /* the session is dropped locally either way */ }
    localStorage.removeItem("accessToken"); localStorage.removeItem("refreshToken");
    dispatch(userLogOut());
    toast.success("Logged out", { id });
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 flex h-(--topbar-height) items-center gap-2 border-b border-line bg-surface/85 px-2 backdrop-blur supports-[backdrop-filter]:bg-surface/70 sm:gap-3 sm:px-5">
      <IconButton label="Open menu" className="lg:hidden" onClick={onOpenMenu}><MenuIcon className="size-5" /></IconButton>
      <div className="min-w-0 flex-1"><Breadcrumbs /></div>

      <div className="flex items-center gap-0.5 sm:gap-2">
        {can("tools.ai") && <OraAIButton />}
        <IconButton label={resolved === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setTheme(resolved === "dark" ? "light" : "dark")} className="hidden sm:inline-flex">
          {resolved === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </IconButton>
        <LanguageSwitch />
        <NotificationCenter />
        <Menu
          trigger={
            <button className="flex items-center gap-2 rounded-full p-1 pr-1 hover:bg-surface-2 focus-ring sm:pr-3" aria-label="Account menu">
              <Avatar name={user?.username} src={user?.profile} size="sm" />
              <span className="hidden max-w-28 truncate text-sm font-medium text-fg sm:block">{user?.username}</span>
            </button>
          }
          width="w-60"
        >
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-fg">{user?.username}</p>
            <p className="truncate text-xs text-fg-subtle">{user?.email}</p>
            <Badge tone="primary" size="sm" className="mt-1.5 capitalize">{user?.role}</Badge>
          </div>
          <MenuSeparator />
          <MenuItem as={Link} to="/dashboard/profile" icon={User}>{t("My profile")}</MenuItem>
          <MenuLabel>{t("Theme")}</MenuLabel>
          <div className="grid grid-cols-3 gap-1 px-2 pb-2">
            {THEMES.map(([v, label, Icon]) => (
              <button key={v} type="button" onClick={(e) => { e.stopPropagation(); setTheme(v); }} aria-pressed={theme === v}
                className={`flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] ${theme === v ? "bg-primary-soft text-primary" : "text-fg-subtle hover:bg-surface-2"}`}>
                <Icon className="size-4" />{t(label)}
              </button>
            ))}
          </div>
          <MenuSeparator />
          <MenuItem icon={LogOut} tone="danger" onClick={logout}>{t("Log out")}</MenuItem>
        </Menu>
      </div>
    </header>
  );
}
