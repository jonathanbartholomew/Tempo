import { useState } from "react";
import {
  Sun,
  ListTodo,
  CalendarDays,
  TrendingUp,
  Trophy,
  Settings,
  Flame,
  Menu,
  X,
  LogOut,
  Clock,
} from "lucide-react";
import logoLight from "../../assets/tempo-logo-trans-right.png";
import logoDark from "../../assets/tempo-logo-dark-mode-right.png";
import linearLogo from "../../assets/linear-just-logo.webp";

function JiraIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.485V1.005A1.001 1.001 0 0 0 23.013 0z" />
    </svg>
  );
}

function LinearIcon({ size = 18 }) {
  return (
    <img
      src={linearLogo}
      alt="Linear"
      width={size}
      height={size}
      style={{ filter: 'brightness(0) invert(1)', objectFit: 'contain' }}
    />
  );
}

function AsanaIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="6" r="3.5"/>
      <circle cx="6.5" cy="16" r="3.5"/>
      <circle cx="17.5" cy="16" r="3.5"/>
    </svg>
  );
}

const NAV_ITEMS = [
  { id: "today", label: "Today", icon: Sun },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "time", label: "Time", icon: Clock },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "achievements", label: "Achievements", icon: Trophy },
];

const CONNECTED_APPS_ITEMS = [
  { id: "jira", label: "Jira", iconComponent: JiraIcon },
  { id: "linear", label: "Linear", iconComponent: LinearIcon },
  { id: "asana", label: "Asana", iconComponent: AsanaIcon },
];

const BOTTOM_ITEMS = [
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  streak,
  theme,
  user,
  onLogout,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function selectTab(id) {
    setActiveTab(id);
    setMobileOpen(false);
  }

  function renderNavItem(item) {
    const Icon = item.icon;
    const IconComponent = item.iconComponent;
    const active = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => selectTab(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          active
            ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]"
            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
        }`}
      >
        {IconComponent ? <IconComponent size={18} /> : <Icon size={18} />}
        {item.label}
      </button>
    );
  }

  const navList = (
    <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map(renderNavItem)}

      <div className="pt-3 pb-1">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
          Connected Apps
        </p>
      </div>
      {CONNECTED_APPS_ITEMS.map(renderNavItem)}

      <div className="pt-2">
        {BOTTOM_ITEMS.map(renderNavItem)}
      </div>
    </nav>
  );

  const logoutButton = (
    <div className="px-3 pt-1">
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 transition-colors"
      >
        <LogOut size={18} />
        Sign out
      </button>
    </div>
  );

  const userFooter = user && (
    <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
      <img
        src={user.picture}
        alt={user.name}
        referrerPolicy="no-referrer"
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {user.name}
        </p>
        {streak > 0 && (
          <p className="flex items-center gap-1 text-xs font-semibold text-orange-500">
            <Flame size={12} className="fill-orange-500" />
            {streak} day streak
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between h-20 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <img
          src={theme === "dark" ? logoDark : logoLight}
          alt="Tempo"
          className="h-16 w-auto"
        />
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80%] bg-white dark:bg-gray-900 h-full flex flex-col py-4 shadow-xl">
            <div className="px-4 pb-4">
              <img
                src={theme === "dark" ? logoDark : logoLight}
                alt="Tempo"
                className="h-16 w-auto"
              />
            </div>
            {navList}
            {logoutButton}
            {userFooter}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30">
        <div className="px-4 py-6">
          <img
            src={theme === "dark" ? logoDark : logoLight}
            alt="Tempo"
            className="h-16 w-auto"
          />
        </div>
        {navList}
        {logoutButton}
        {userFooter}
      </aside>
    </>
  );
}
