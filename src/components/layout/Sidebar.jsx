import { useState } from "react";
import { motion } from "motion/react";
import Avatar from "../ui/Avatar";
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
  ShieldCheck,
  Target,
  ChevronsLeft,
  ChevronsRight,
  MessageSquare,
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

const NAV_SECTIONS = [
  {
    label: "Planning",
    items: [
      { id: "today",        label: "Today",        icon: Sun },
      { id: "tasks",        label: "Tasks",        icon: ListTodo },
      { id: "calendar",     label: "Calendar",     icon: CalendarDays },
    ],
  },
  {
    label: "Insights",
    items: [
      { id: "time",         label: "Time",         icon: Clock },
      { id: "progress",     label: "Progress",     icon: TrendingUp },
      { id: "achievements", label: "Achievements", icon: Trophy },
      { id: "goals",        label: "Goals",        icon: Target },
    ],
  },
  {
    label: "Integrations",
    items: [
      { id: "jira",   label: "Jira",   iconComponent: JiraIcon },
      { id: "linear", label: "Linear", iconComponent: LinearIcon },
      { id: "asana",  label: "Asana",  iconComponent: AsanaIcon },
    ],
  },
];

const PLAN_BADGE = {
  trial:        { label: 'TRIAL', className: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' },
  personal_pro: { label: 'PRO',   className: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400' },
  team:         { label: 'TEAM',  className: 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400' },
  enterprise:   { label: 'ENT',   className: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400' },
};

export default function Sidebar({
  activeTab,
  setActiveTab,
  streak,
  theme,
  user,
  onLogout,
  org,
  plan = 'free',
  collapsed,
  onToggleCollapse,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function selectTab(id) {
    setActiveTab(id);
    setMobileOpen(false);
  }

  function renderNavItem(item, forceExpanded = false) {
    const Icon = item.icon;
    const IconComponent = item.iconComponent;
    const active = activeTab === item.id;
    const isCollapsed = collapsed && !forceExpanded;

    return (
      <motion.button
        key={item.id}
        onClick={() => selectTab(item.id)}
        whileTap={{ scale: 0.93 }}
        title={isCollapsed ? item.label : undefined}
        className={`w-full flex items-center rounded-xl text-sm font-medium transition-colors ${
          isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
        } ${
          active
            ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]"
            : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
        }`}
      >
        {IconComponent ? <IconComponent size={18} /> : <Icon size={18} />}
        {!isCollapsed && item.label}
      </motion.button>
    );
  }

  // Desktop nav — adapts to collapsed state
  const desktopNav = (
    <nav className="flex-1 overflow-y-auto space-y-4 px-2">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          {!collapsed && (
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
              {section.label}
            </p>
          )}
          <div className="space-y-0.5">
            {section.items.map((item) => renderNavItem(item))}
          </div>
        </div>
      ))}

      <div>
        {!collapsed && (
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
            Workspace
          </p>
        )}
        <div className="space-y-0.5">
          {org && renderNavItem({ id: 'community', label: 'Community', icon: MessageSquare })}
          {org?.is_admin && renderNavItem({ id: 'admin', label: 'Admin', icon: ShieldCheck })}
          {renderNavItem({ id: 'settings', label: 'Settings', icon: Settings })}
        </div>
      </div>
    </nav>
  );

  // Mobile nav always expanded
  const mobileNav = (
    <nav className="flex-1 px-3 overflow-y-auto space-y-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => renderNavItem(item, true))}
          </div>
        </div>
      ))}
      <div>
        <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
          Workspace
        </p>
        <div className="space-y-0.5">
          {org && renderNavItem({ id: 'community', label: 'Community', icon: MessageSquare }, true)}
          {org?.is_admin && renderNavItem({ id: 'admin', label: 'Admin', icon: ShieldCheck }, true)}
          {renderNavItem({ id: 'settings', label: 'Settings', icon: Settings }, true)}
        </div>
      </div>
    </nav>
  );

  const logoutButton = (collapsed) => (
    <div className="px-2 pt-1">
      <motion.button
        onClick={onLogout}
        whileTap={{ scale: 0.93 }}
        title={collapsed ? 'Sign out' : undefined}
        className={`w-full flex items-center rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 transition-colors ${
          collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
        }`}
      >
        <LogOut size={18} />
        {!collapsed && 'Sign out'}
      </motion.button>
    </div>
  );

  const userFooter = (isCollapsed) => {
    const badge = PLAN_BADGE[plan] ?? PLAN_BADGE.trial;
    return user && (
      <div className={`py-3 border-t border-gray-100 dark:border-gray-800 flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'}`}>
        <div className="relative flex-shrink-0">
          <Avatar name={user.name} picture={user.picture} className="w-9 h-9 text-sm" />
          {isCollapsed && (
            <span className={`absolute -bottom-1 -right-1 text-[9px] font-bold px-1 rounded leading-tight ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-tight flex-shrink-0 ${badge.className}`}>
                {badge.label}
              </span>
            </div>
            {streak > 0 && (
              <p className="flex items-center gap-1 text-xs font-semibold text-orange-500">
                <Flame size={12} className="fill-orange-500" />
                {streak} day streak
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between h-20 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <img src={theme === "dark" ? logoDark : logoLight} alt="Tempo" className="h-16 w-auto" />
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
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 max-w-[80%] bg-white dark:bg-gray-900 h-full flex flex-col py-4 shadow-xl">
            <div className="px-4 pb-4">
              <img src={theme === "dark" ? logoDark : logoLight} alt="Tempo" className="h-16 w-auto" />
            </div>
            {mobileNav}
            {logoutButton(false)}
            {userFooter(false)}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-30 transition-all duration-200 overflow-hidden ${
          collapsed ? 'md:w-14' : 'md:w-60'
        }`}
      >
        {/* Header: logo + collapse toggle */}
        <div className={`flex items-center border-b border-gray-100 dark:border-gray-800 ${collapsed ? 'justify-center py-4 px-2' : 'justify-between px-4 py-5'}`}>
          {!collapsed && (
            <img src={theme === "dark" ? logoDark : logoLight} alt="Tempo" className="h-12 w-auto" />
          )}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {desktopNav}
        </div>
        {logoutButton(collapsed)}
        {userFooter(collapsed)}
      </aside>
    </>
  );
}
