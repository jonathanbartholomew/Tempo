import { useGoogleLogin } from '@react-oauth/google';
import { Sun, Moon, LogOut, Plus, X, Eye, AlertTriangle } from 'lucide-react';
import JobsTab from '../jobs/JobsTab';
import MeetingsTab from '../meetings/MeetingsTab';
import { CALENDAR_ACCOUNT_COLORS } from '../../utils/helpers';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

export default function SettingsTab({
  theme,
  onToggleTheme,
  user,
  onLogout,
  calendarAccounts,
  onAddCalendarAccount,
  onRemoveCalendarAccount,
  accountColors,
  hiddenEventTitles,
  onUnhideEvent,
  primaryExpiresAt,
  onReconnectPrimary,
  googleEventErrors,
  jobs,
  tasks,
  connectedAccounts,
  onAddJob,
  onRemoveJob,
  meetings,
  onAddMeeting,
  onDeleteMeeting,
}) {
  const connectCalendar = useGoogleLogin({
    scope: `openid email profile ${CALENDAR_SCOPE}`,
    prompt: 'select_account',
    onSuccess: (tokenResponse) => onAddCalendarAccount(tokenResponse),
  });

  const reconnectPrimary = useGoogleLogin({
    scope: `openid email profile ${CALENDAR_SCOPE}`,
    prompt: 'consent',
    onSuccess: (tokenResponse) => onReconnectPrimary(tokenResponse),
  });

  function statusFor(email, expiresAt) {
    if (expiresAt && expiresAt <= Date.now()) return 'expired';
    const err = (googleEventErrors || []).find((e) => e.email === email);
    if (err) return err.reason === 'expired' ? 'expired' : 'error';
    return 'ok';
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      {/* Account */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Account</h2>
        {user && (
          <div className="flex items-center gap-3">
            <img src={user.picture} alt={user.name} referrerPolicy="no-referrer" className="w-12 h-12 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-red-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Appearance</h2>
        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          Switch to {theme === 'dark' ? 'light' : 'dark'} mode
        </button>
      </div>

      {/* Connected Calendars */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1">Connected Calendars</h2>
        {user && (() => {
          const status = statusFor(user.email, primaryExpiresAt);
          return (
            <div className="flex items-center gap-2 py-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accountColors[user.email] || CALENDAR_ACCOUNT_COLORS[0] }} />
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{user.email}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">Primary</span>
              {status !== 'ok' ? (
                <button
                  onClick={() => reconnectPrimary()}
                  className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                  title={status === 'expired' ? 'Your Google session expired — reconnect to sync this calendar' : 'Could not load this calendar — reconnect to retry'}
                >
                  <AlertTriangle size={14} />
                  Reconnect
                </button>
              ) : (
                <span className="text-xs text-green-600 dark:text-green-400">Connected</span>
              )}
            </div>
          );
        })()}
        {calendarAccounts.map((acc) => {
          const status = statusFor(acc.email, acc.expiresAt);
          return (
            <div key={acc.email} className="flex items-center gap-2 py-1">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accountColors[acc.email] || CALENDAR_ACCOUNT_COLORS[0] }} />
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{acc.email}</span>
              {status !== 'ok' ? (
                <button
                  onClick={() => connectCalendar()}
                  className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                  title={status === 'expired' ? 'This account\'s session expired — reconnect to sync this calendar' : 'Could not load this calendar — reconnect to retry'}
                >
                  <AlertTriangle size={14} />
                  Reconnect
                </button>
              ) : (
                <span className="text-xs text-green-600 dark:text-green-400">Connected</span>
              )}
              <button
                onClick={() => onRemoveCalendarAccount(acc.email)}
                className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors"
                aria-label={`Remove ${acc.email}`}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
        <button
          onClick={() => connectCalendar()}
          className="flex items-center gap-1.5 mt-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          <Plus size={14} />
          Connect another calendar
        </button>
      </div>

      {/* Hidden Events */}
      {hiddenEventTitles && hiddenEventTitles.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1">Hidden Events</h2>
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

      {/* Jobs */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <JobsTab jobs={jobs} tasks={tasks} connectedAccounts={connectedAccounts} onAddJob={onAddJob} onRemoveJob={onRemoveJob} />
      </div>

      {/* Meetings */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <MeetingsTab meetings={meetings} jobs={jobs} onAddMeeting={onAddMeeting} onDeleteMeeting={onDeleteMeeting} />
      </div>
    </div>
  );
}
