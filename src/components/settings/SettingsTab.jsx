import { useGoogleLogin } from '@react-oauth/google';
import { Sun, Moon, LogOut, Plus, X, Eye, AlertTriangle, CheckCircle2, Link2 } from 'lucide-react';
import Avatar from '../ui/Avatar';
import JobsTab from '../jobs/JobsTab';
import MeetingsTab from '../meetings/MeetingsTab';
import OrgPanel from '../org/OrgPanel';
import { CALENDAR_ACCOUNT_COLORS, TIMEZONES, TIME_FORMATS } from '../../utils/helpers';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

const PROFILE_STEPS = [
  {
    key: 'usageType',
    label: 'Using Tempo for',
    options: ['Personal Productivity', 'Freelance & Client Work', 'Small Business', 'Team / Organization', 'Student'],
  },
  {
    key: 'role',
    label: 'Your role',
    options: ['Freelancer / Contractor', 'Employee', 'Business Owner', 'Manager / Team Lead', 'Individual Contributor', 'Student', 'Executive / Director'],
  },
  {
    key: 'specialty',
    label: 'What you do',
    options: ['Software Development', 'Web Development', 'Project Management', 'Design / UX', 'Product Management', 'Marketing', 'Sales', 'Data / Analytics', 'DevOps / Infrastructure', 'Content Creation', 'Finance / Accounting', 'Consulting'],
  },
  {
    key: 'goals',
    label: 'Goals',
    options: ['Stay on top of my schedule', 'Manage multiple jobs or clients', 'Build consistent daily habits', 'Track focus & deep work time', 'Reduce overwhelm', 'Hit my daily goals', 'Collaborate with a team'],
  },
];

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
  onUpdateJob,
  meetings,
  onAddMeeting,
  onDeleteMeeting,
  onToggleMeeting,
  timezone,
  onSetTimezone,
  timeFormat,
  onSetTimeFormat,
  profile,
  onUpdateProfile,
  jira,
  auth,
  org,
  orgActions,
  onNavigate,
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
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      {/* Account */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Account</h2>
        {user && (
          <div className="flex items-center gap-3">
            <Avatar name={user.name} picture={user.picture} className="w-12 h-12 text-lg" />
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

      {/* Timezone */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Timezone</h2>
        <div className="space-y-1">
          <label htmlFor="timezone-select" className="text-sm text-gray-600 dark:text-gray-400">
            Calendar event times are shown in this timezone
          </label>
          <select
            id="timezone-select"
            value={timezone}
            onChange={(e) => onSetTimezone(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor="time-format-select" className="text-sm text-gray-600 dark:text-gray-400">
            Time format
          </label>
          <select
            id="time-format-select"
            value={timeFormat}
            onChange={(e) => onSetTimeFormat(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TIME_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
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
        <JobsTab jobs={jobs} tasks={tasks} connectedAccounts={connectedAccounts} onAddJob={onAddJob} onRemoveJob={onRemoveJob} onUpdateJob={onUpdateJob} label={org ? 'Project' : 'Job'} />
      </div>

      {/* Organization */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        {org?.role === 'org_admin' ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{org.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Manage members, teams, and invites from the Admin panel.</p>
            </div>
            <button
              onClick={() => onNavigate?.('admin')}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
            >
              Go to Admin
            </button>
          </div>
        ) : (
          <OrgPanel auth={auth} org={org} orgActions={orgActions} />
        )}
      </div>

      {/* Meetings */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <MeetingsTab meetings={meetings} jobs={jobs} onAddMeeting={onAddMeeting} onDeleteMeeting={onDeleteMeeting} onToggleMeeting={onToggleMeeting} timeFormat={timeFormat} />
      </div>

      {/* Connected Apps */}
      {jira && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Connected Apps</h2>

          {/* Jira */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.004-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.485V1.005A1.001 1.001 0 0 0 23.013 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Jira</p>
                {jira.status.connected ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <CheckCircle2 size={11} className="text-green-500" />
                    {jira.status.siteName}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Not connected</p>
                )}
              </div>
            </div>
            {jira.status.connected ? (
              <button
                onClick={jira.disconnect}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={jira.connect}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                <Link2 size={12} /> Connect
              </button>
            )}
          </div>

          {/* Linear — coming soon */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 opacity-50">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-purple-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 14L10 22L22 10L14 2L2 14ZM4.5 14L14 4.5L19.5 10L10 19.5L4.5 14Z"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Linear</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Coming soon</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-medium">Soon</span>
          </div>

          {/* Asana — coming soon */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 opacity-50">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-pink-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="6" r="3.5"/>
                <circle cx="6.5" cy="16" r="3.5"/>
                <circle cx="17.5" cy="16" r="3.5"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Asana</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Coming soon</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-medium">Soon</span>
          </div>
        </div>
      )}

      {/* Profile */}
      {profile && onUpdateProfile && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Your Profile</h2>
          {PROFILE_STEPS.map(({ key, label, options }) => (
            <div key={key}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{label}</p>
              <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                  const isSelected = (profile[key] || []).includes(option);
                  return (
                    <button
                      key={option}
                      onClick={() => {
                        const list = profile[key] || [];
                        onUpdateProfile({
                          ...profile,
                          [key]: isSelected ? list.filter((o) => o !== option) : [...list, option],
                        });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
