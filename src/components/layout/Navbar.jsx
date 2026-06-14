import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Sun, Moon, CalendarDays, Briefcase, Users, Trophy, Flame, LogOut, Plus, X, Eye } from 'lucide-react';
import { CALENDAR_ACCOUNT_COLORS } from '../../utils/helpers';
import logoLight from '../../assets/tempo-logo-trans.png';
import logoDark from '../../assets/tempo-logo-dark-mode.png';

const TABS = [
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'meetings', label: 'Meetings', icon: Users },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
];

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

export default function Navbar({ activeTab, setActiveTab, streak, theme, onToggleTheme, user, onLogout, calendarAccounts, onAddCalendarAccount, onRemoveCalendarAccount, accountColors, hiddenEventTitles, onUnhideEvent }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const connectCalendar = useGoogleLogin({
    scope: `openid email profile ${CALENDAR_SCOPE}`,
    prompt: 'select_account',
    onSuccess: (tokenResponse) => onAddCalendarAccount(tokenResponse),
  });

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-20">
        <div className="flex items-center gap-2">
          <img src={theme === 'dark' ? logoDark : logoLight} alt="Tempo" className="h-16 w-auto" />
          {streak > 0 && (
            <span className="flex items-center gap-1 text-sm font-semibold text-orange-500 bg-orange-50 dark:bg-orange-500/10 px-2 py-1 rounded-full">
              <Flame size={16} className="fill-orange-500" />
              {streak}d
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
          <button
            onClick={onToggleTheme}
            className="flex items-center justify-center p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center justify-center rounded-full overflow-hidden w-8 h-8 border border-gray-200 dark:border-gray-700 hover:ring-2 hover:ring-blue-500 transition-shadow"
                aria-label="Account menu"
              >
                <img src={user.picture} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg z-50 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                    </div>

                    <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Connected Calendars</p>
                      <div className="flex items-center gap-2 py-1">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accountColors[user.email] || CALENDAR_ACCOUNT_COLORS[0] }} />
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{user.email}</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">Primary</span>
                      </div>
                      {calendarAccounts.map((acc) => (
                        <div key={acc.email} className="flex items-center gap-2 py-1">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accountColors[acc.email] || CALENDAR_ACCOUNT_COLORS[0] }} />
                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{acc.email}</span>
                          <button
                            onClick={() => onRemoveCalendarAccount(acc.email)}
                            className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
                            aria-label={`Remove ${acc.email}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => connectCalendar()}
                        className="flex items-center gap-1.5 mt-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <Plus size={14} />
                        Connect another calendar
                      </button>
                    </div>

                    {hiddenEventTitles && hiddenEventTitles.length > 0 && (
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Hidden Events</p>
                        {hiddenEventTitles.map((title) => (
                          <div key={title} className="flex items-center gap-2 py-1">
                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{title}</span>
                            <button
                              onClick={() => onUnhideEvent(title)}
                              className="text-gray-300 dark:text-gray-600 hover:text-blue-500 transition-colors"
                              aria-label={`Unhide ${title}`}
                              title="Show this event again"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
