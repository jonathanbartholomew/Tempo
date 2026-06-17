import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Sidebar from './components/layout/Sidebar';
import Toast from './components/layout/Toast';
import LoginScreen from './components/auth/LoginScreen';
import SignInScreen from './components/auth/SignInScreen';
import TodayTab from './components/today/TodayTab';
import TasksTab from './components/tasks/TasksTab';
import ScheduleTab from './components/schedule/ScheduleTab';
import ProgressTab from './components/progress/ProgressTab';
import AchievementsTab from './components/achievements/AchievementsTab';
import SettingsTab from './components/settings/SettingsTab';
import JiraTab from './components/jira/JiraTab';
import TimeTab from './components/time/TimeTab';
import GlobalTimerBar from './components/layout/GlobalTimerBar';
import UnderConstruction from './components/layout/UnderConstruction';
import heroBgImg from './assets/hero-background.jpg';
import { useAchievements } from './hooks/useAchievements';
import { useNotifications } from './hooks/useNotifications';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useCalendarAccounts } from './hooks/useCalendarAccounts';
import { useGoogleCalendar } from './hooks/useGoogleCalendar';
import { useJira } from './hooks/useJira';
import { useTimeTracking } from './hooks/useTimeTracking';
import { DataProvider, useServerStorage, useDataLoading } from './context/DataContext';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import {
  STORAGE_KEYS,
  CALENDAR_ACCOUNT_COLORS,
  DEFAULT_STATS,
  DEFAULT_PROFILE,
  DEFAULT_TIMEZONE,
  DEFAULT_TIME_FORMAT,
  generateId,
  getTodayString,
  toDateKey,
  getPriority,
  getLevelInfo,
} from './utils/helpers';

export default function App() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const { auth, login, logout: authLogout, isCalendarConnected } = useAuth();

  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: theme,
      primary: { main: '#3b82f6' },
      background: {
        default: theme === 'dark' ? '#030712' : '#f9fafb',
        paper: theme === 'dark' ? '#111827' : '#ffffff',
      },
    },
    typography: { fontFamily: 'inherit' },
    components: {
      MuiChartsAxis: {
        styleOverrides: {
          tick: { stroke: theme === 'dark' ? '#4b5563' : '#d1d5db' },
          line: { stroke: theme === 'dark' ? '#374151' : '#e5e7eb' },
        },
      },
    },
  }), [theme]);

  function logout() {
    authLogout();
    setShowSignIn(false);
  }

  if (!auth || auth.expiresAt <= Date.now()) {
    return showSignIn ? (
      <SignInScreen onLogin={login} onBack={() => setShowSignIn(false)} />
    ) : (
      <LoginScreen theme={theme} onGetStarted={() => setShowSignIn(true)} />
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <DataProvider auth={auth}>
        <AppContent
          theme={theme}
          toggleTheme={toggleTheme}
          auth={auth}
          login={login}
          logout={logout}
          isCalendarConnected={isCalendarConnected}
        />
      </DataProvider>
    </ThemeProvider>
  );
}

function AppContent({ theme, toggleTheme, auth, login, logout, isCalendarConnected }) {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('jira') ? 'jira' : 'today';
  });
  const jira = useJira(auth);
  const timeTracking = useTimeTracking(auth);
  const [jobs, setJobs] = useServerStorage(STORAGE_KEYS.jobs, []);
  const [tasks, setTasks] = useServerStorage(STORAGE_KEYS.tasks, []);
  const [meetings, setMeetings] = useServerStorage(STORAGE_KEYS.meetings, []);
  const [stats, setStats] = useServerStorage(STORAGE_KEYS.stats, DEFAULT_STATS);
  const [earned, setEarned] = useServerStorage(STORAGE_KEYS.earned, []);
  const [timezone, setTimezone] = useServerStorage(STORAGE_KEYS.timezone, DEFAULT_TIMEZONE);
  const [timeFormat, setTimeFormat] = useServerStorage(STORAGE_KEYS.timeFormat, DEFAULT_TIME_FORMAT);
  const [profile, setProfile] = useServerStorage(STORAGE_KEYS.profile, DEFAULT_PROFILE);
  const [toasts, setToasts] = useState([]);
  const { accounts: calendarAccounts, addAccount: addCalendarAccount, removeAccount: removeCalendarAccount } = useCalendarAccounts();

  const connectedAccounts = useMemo(() => {
    const list = [];
    if (isCalendarConnected) {
      list.push({ email: auth.user.email, name: auth.user.name, accessToken: auth.accessToken, expiresAt: auth.expiresAt });
    }
    for (const acc of calendarAccounts) {
      list.push({ email: acc.email, name: acc.name, accessToken: acc.accessToken, expiresAt: acc.expiresAt });
    }
    return list;
  }, [auth, isCalendarConnected, calendarAccounts]);

  const accountColors = useMemo(() => {
    const map = {};
    let paletteIndex = 0;
    for (const acc of connectedAccounts) {
      const linkedJob = jobs.find((j) => j.googleAccountEmail === acc.email);
      map[acc.email] = linkedJob ? linkedJob.color : CALENDAR_ACCOUNT_COLORS[paletteIndex++ % CALENDAR_ACCOUNT_COLORS.length];
    }
    return map;
  }, [connectedAccounts, jobs]);

  const calendarSources = useMemo(
    () => connectedAccounts.map((acc) => ({
      id: acc.email,
      accessToken: acc.accessToken,
      expiresAt: acc.expiresAt,
      label: acc.name,
      email: acc.email,
      color: accountColors[acc.email],
    })),
    [connectedAccounts, accountColors]
  );

  const { events: googleEvents, sourceErrors: googleEventErrors } = useGoogleCalendar(calendarSources, timezone);

  const [hiddenEventTitles, setHiddenEventTitles] = useServerStorage(STORAGE_KEYS.hiddenEvents, []);
  const visibleGoogleEvents = useMemo(
    () => googleEvents.filter((e) => !hiddenEventTitles.includes(e.title)),
    [googleEvents, hiddenEventTitles]
  );

  function hideCalendarEvent(title) {
    setHiddenEventTitles((prev) => (prev.includes(title) ? prev : [...prev, title]));
  }

  function unhideCalendarEvent(title) {
    setHiddenEventTitles((prev) => prev.filter((t) => t !== title));
  }

  const dataLoading = useDataLoading();
  const { getNewlyUnlocked } = useAchievements();
  const prevLevelRef = useRef(null);

  useNotifications(meetings);

  function pushToast(message) {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }

  // Detect Jira OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jiraParam = params.get('jira');
    if (jiraParam === 'connected') {
      jira.handleConnectedCallback();
      pushToast('Jira connected successfully!');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (jiraParam === 'error') {
      pushToast('Jira connection failed. Please try again.');
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Tasks ---
  function addTask({ title, jobId, priority, date, time, description }) {
    const taskDate = date || getTodayString();
    const tags = /rfp/i.test(title) ? ['rfp'] : [];
    setTasks((prev) => [
      ...prev,
      {
        id: generateId(),
        title,
        jobId: jobId || null,
        date: taskDate,
        time: time || null,
        priority,
        done: false,
        doneAt: null,
        reminder: false,
        reminderTime: null,
        tags,
        description: description || null,
      },
    ]);
    if (taskDate > getTodayString()) {
      setStats((prev) => ({ ...prev, futureTasksAdded: prev.futureTasksAdded + 1 }));
    }
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function editTask(id, updates) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }

  function reorderTasks(orderedIds) {
    setTasks((prev) => {
      const orderMap = new Map(orderedIds.map((id, index) => [id, index]));
      return prev.map((t) => (orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id) } : t));
    });
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    if (task.done) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: false, doneAt: null } : t)));
      setStats((prev) => {
        const today = getTodayString();
        const history = prev.history || {};
        const todayEntry = history[today] || { completed: 0, xp: 0 };
        return {
          ...prev,
          tasksCompleted: Math.max(0, prev.tasksCompleted - 1),
          totalXp: Math.max(0, prev.totalXp - (task.xpAwarded || 0)),
          history: {
            ...history,
            [today]: {
              completed: Math.max(0, todayEntry.completed - 1),
              xp: Math.max(0, todayEntry.xp - (task.xpAwarded || 0)),
            },
          },
        };
      });
      return;
    }

    const now = new Date();
    const xp = getPriority(task.priority).xp;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: true, doneAt: now.toISOString(), xpAwarded: xp } : t)));

    setStats((prev) => {
      const today = getTodayString();
      let { streak, lastActiveDate, longestStreak } = prev;
      if (lastActiveDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        streak = lastActiveDate === toDateKey(yesterday) ? streak + 1 : 1;
        lastActiveDate = today;
        longestStreak = Math.max(longestStreak, streak);
      }
      const history = prev.history || {};
      const todayEntry = history[today] || { completed: 0, xp: 0 };
      return {
        ...prev,
        totalXp: prev.totalXp + xp,
        tasksCompleted: prev.tasksCompleted + 1,
        streak,
        lastActiveDate,
        longestStreak,
        earlyBirdEarned: prev.earlyBirdEarned || now.getHours() < 9,
        nightOwlEarned: prev.nightOwlEarned || now.getHours() >= 21,
        rfpCompleted: prev.rfpCompleted || task.tags.includes('rfp'),
        history: {
          ...history,
          [today]: {
            completed: todayEntry.completed + 1,
            xp: todayEntry.xp + xp,
          },
        },
      };
    });

    pushToast(`+${xp} XP — Task complete!`);
  }

  // --- Jobs ---
  function addJob({ name, type, color, googleAccountEmail }) {
    setJobs((prev) => [...prev, { id: generateId(), name, type, color, googleAccountEmail: googleAccountEmail || null, createdAt: getTodayString() }]);
  }

  function removeJob(id) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setTasks((prev) => prev.map((t) => (t.jobId === id ? { ...t, jobId: null } : t)));
    setMeetings((prev) => prev.map((m) => (m.jobId === id ? { ...m, jobId: null } : m)));
  }

  // --- Focus ---
  function logFocusSession(minutes, jobId) {
    setStats((prev) => {
      const today = getTodayString();
      const history = prev.history || {};
      const todayEntry = history[today] || { completed: 0, xp: 0, focusMinutes: 0, focusByJob: {} };
      const focusByJob = todayEntry.focusByJob || {};
      return {
        ...prev,
        focusSessions: (prev.focusSessions || 0) + 1,
        history: {
          ...history,
          [today]: {
            ...todayEntry,
            focusMinutes: (todayEntry.focusMinutes || 0) + minutes,
            focusByJob: jobId
              ? { ...focusByJob, [jobId]: (focusByJob[jobId] || 0) + minutes }
              : focusByJob,
          },
        },
      };
    });
  }

  function addAiPlanImport() {
    setStats((prev) => ({ ...prev, aiPlanImports: (prev.aiPlanImports || 0) + 1 }));
  }

  // --- Meetings ---
  function addMeeting(data) {
    setMeetings((prev) => [...prev, { id: generateId(), ...data }]);
  }

  function deleteMeeting(id) {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }

  // --- Achievements ---
  useEffect(() => {
    const context = { stats, jobs, tasks, meetings };
    const newly = getNewlyUnlocked(earned, context);
    if (newly.length === 0) return;

    const bonusXp = newly.reduce((sum, a) => sum + a.xp, 0);
    setEarned((prev) => [...prev, ...newly.map((a) => a.id)]);
    setStats((prev) => ({ ...prev, totalXp: prev.totalXp + bonusXp }));
    newly.forEach((a) => pushToast(`Achievement unlocked: ${a.title} (+${a.xp} XP)`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, jobs, tasks, meetings, earned]);

  // --- Level up ---
  useEffect(() => {
    if (dataLoading) return;
    const level = getLevelInfo(stats.totalXp).level;
    if (prevLevelRef.current === null) {
      prevLevelRef.current = level; // establish baseline after real data loads
      return;
    }
    if (level > prevLevelRef.current) {
      pushToast(`Level up! You are now Level ${level}`);
      prevLevelRef.current = level;
    }
  }, [stats.totalXp, dataLoading]);

  const profileHasSelections = (profile.usageType?.length + profile.role?.length + profile.specialty?.length + profile.goals?.length) > 0;
  if (!profile.onboardingComplete || !profileHasSelections) {
    return <OnboardingFlow onComplete={(data) => setProfile(data)} />;
  }

  return (
    <div className={`min-h-screen transition-colors md:pl-60 ${timeTracking.timer.active && activeTab !== 'time' ? 'pb-14' : ''}`}>
      <div className="fixed inset-0 -z-10 overflow-hidden bg-gray-50 dark:bg-gray-950">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${heroBgImg})`, backgroundSize: 'cover', backgroundPosition: 'center 20%', opacity: 0.1 }} />
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} streak={stats.streak} theme={theme} user={auth.user} onLogout={logout} />
      <Toast toasts={toasts} />

      {activeTab === 'today' && (
        <TodayTab
          tasks={tasks}
          jobs={jobs}
          meetings={meetings}
          googleEvents={visibleGoogleEvents}
          stats={stats}
          user={auth.user}
          onAddTask={addTask}
          onAddMeeting={addMeeting}
          onAiPlanImported={addAiPlanImport}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onEditTask={editTask}
          onReorderTasks={reorderTasks}
          onGoToMeetings={() => setActiveTab('calendar')}
          onHideEvent={hideCalendarEvent}
          timeFormat={timeFormat}
          jira={jira}
          onGoToJira={() => setActiveTab('jira')}
          timeTracking={timeTracking}
        />
      )}

      {activeTab === 'tasks' && (
        <TasksTab
          tasks={tasks}
          jobs={jobs}
          meetings={meetings}
          googleEvents={visibleGoogleEvents}
          onAddTask={addTask}
          onAddMeeting={addMeeting}
          onAiPlanImported={addAiPlanImport}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onEditTask={editTask}
          timeFormat={timeFormat}
          timeTracking={timeTracking}
        />
      )}

      {activeTab === 'calendar' && (
        <ScheduleTab
          tasks={tasks}
          jobs={jobs}
          meetings={meetings}
          googleEvents={visibleGoogleEvents}
          googleEventErrors={googleEventErrors}
          onAddTask={addTask}
          onAddMeeting={addMeeting}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onDeleteMeeting={deleteMeeting}
          onHideEvent={hideCalendarEvent}
          onGoToSettings={() => setActiveTab('settings')}
          timeFormat={timeFormat}
        />
      )}

      {activeTab === 'progress' && (
        <ProgressTab stats={stats} />
      )}

      {activeTab === 'achievements' && (
        <AchievementsTab stats={stats} jobs={jobs} meetings={meetings} earned={earned} />
      )}

      {activeTab === 'jira' && (
        <JiraTab
          jira={jira}
          onStartTimer={(args) => {
            timeTracking.startTimerSafe(args);
            setActiveTab('time');
          }}
        />
      )}

      {activeTab === 'linear' && <UnderConstruction name="Linear" />}
      {activeTab === 'asana' && <UnderConstruction name="Asana" />}

      {activeTab === 'time' && (
        <TimeTab timeTracking={timeTracking} tasks={tasks} stats={stats} jobs={jobs} onLogFocus={logFocusSession} timeFormat={timeFormat} />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          theme={theme}
          onToggleTheme={toggleTheme}
          user={auth.user}
          onLogout={logout}
          calendarAccounts={calendarAccounts}
          onAddCalendarAccount={addCalendarAccount}
          onRemoveCalendarAccount={removeCalendarAccount}
          accountColors={accountColors}
          hiddenEventTitles={hiddenEventTitles}
          onUnhideEvent={unhideCalendarEvent}
          primaryExpiresAt={auth.expiresAt}
          onReconnectPrimary={login}
          googleEventErrors={googleEventErrors}
          jobs={jobs}
          tasks={tasks}
          connectedAccounts={connectedAccounts}
          onAddJob={addJob}
          onRemoveJob={removeJob}
          meetings={meetings}
          onAddMeeting={addMeeting}
          onDeleteMeeting={deleteMeeting}
          timezone={timezone}
          onSetTimezone={setTimezone}
          timeFormat={timeFormat}
          onSetTimeFormat={setTimeFormat}
          profile={profile}
          onUpdateProfile={setProfile}
          jira={jira}
        />
      )}

      {activeTab !== 'time' && (
        <GlobalTimerBar
          timer={timeTracking.timer}
          jobs={jobs}
          onPause={timeTracking.pauseTimer}
          onResume={timeTracking.resumeTimer}
          onStop={timeTracking.stopAndSave}
          onDiscard={timeTracking.discardTimer}
          onGoToTime={() => setActiveTab('time')}
        />
      )}
    </div>
  );
}
