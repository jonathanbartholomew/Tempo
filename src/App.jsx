import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Sidebar from './components/layout/Sidebar';
import Toast from './components/layout/Toast';
import LoginScreen from './components/auth/LoginScreen';
import SignInScreen from './components/auth/SignInScreen';
import SignUpScreen from './components/auth/SignUpScreen';
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
import AdminTab from './components/org/AdminTab';
import GoalsTab from './components/goals/GoalsTab';
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
import InviteAcceptScreen from './components/org/InviteAcceptScreen';
import UpgradeModal from './components/billing/UpgradeModal';
import { useOrg } from './hooks/useOrg';
import { useAssignedTasks } from './hooks/useAssignedTasks';
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
  const [showSignUp, setShowSignUp] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const { auth, login, loginWithEmail, registerWithEmail, logout: authLogout, isCalendarConnected, plan, trialDaysLeft, isTrialExpired, isOnTrial, subscribe, refreshPlan } = useAuth();

  // Detect invite token in URL or sessionStorage (persists through login flow)
  const [inviteToken, setInviteToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('invite');
    if (urlToken) {
      sessionStorage.setItem('pendingInvite', urlToken);
      window.history.replaceState({}, '', window.location.pathname);
      return urlToken;
    }
    return sessionStorage.getItem('pendingInvite') || null;
  });

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
    if (showSignUp) {
      return (
        <SignUpScreen
          onGoogleLogin={login}
          onRegister={registerWithEmail}
          onBack={() => setShowSignUp(false)}
          onSignIn={() => { setShowSignUp(false); setShowSignIn(true); }}
        />
      );
    }
    if (showSignIn) {
      return (
        <SignInScreen
          onGoogleLogin={login}
          onEmailLogin={loginWithEmail}
          onBack={() => setShowSignIn(false)}
          onSignUp={() => { setShowSignIn(false); setShowSignUp(true); }}
        />
      );
    }
    return <LoginScreen theme={theme} onGetStarted={() => setShowSignIn(true)} />;
  }

  if (inviteToken) {
    return (
      <InviteAcceptScreen
        token={inviteToken}
        auth={auth}
        onAccepted={() => {
          setInviteToken(null);
          sessionStorage.removeItem('pendingInvite');
        }}
        onDecline={() => {
          setInviteToken(null);
          sessionStorage.removeItem('pendingInvite');
        }}
      />
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
          plan={plan}
          trialDaysLeft={trialDaysLeft}
          isTrialExpired={isTrialExpired}
          isOnTrial={isOnTrial}
          subscribe={subscribe}
          refreshPlan={refreshPlan}
        />
      </DataProvider>
    </ThemeProvider>
  );
}

function AppContent({ theme, toggleTheme, auth, login, logout, isCalendarConnected, plan, trialDaysLeft, isTrialExpired, isOnTrial, subscribe, refreshPlan }) {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('jira') ? 'jira' : 'today';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [faviconDot, setFaviconDot] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Sync plan/trial from server on mount for email-auth users
  // (Google OAuth users don't have a server-side JWT we can use here)
  useEffect(() => {
    if (auth?.provider === 'email' && !auth?.user?.trial_ends_at) {
      refreshPlan();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap favicon — red dot overlay while timer is active
  useEffect(() => {
    const link = document.querySelector("link[rel~='icon']") || (() => {
      const el = document.createElement('link');
      el.rel = 'icon';
      document.head.appendChild(el);
      return el;
    })();

    if (!faviconDot) {
      link.type = 'image/png';
      link.href = '/tempo-logo.png';
      return;
    }

    // Draw logo + red dot onto a canvas and use as data URL
    const img = new Image();
    img.src = '/tempo-logo.png';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 64, 64);
      // Red recording dot — top-right corner
      ctx.beginPath();
      ctx.arc(54, 10, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(54, 10, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#fca5a5';
      ctx.fill();
      link.type = 'image/png';
      link.href = canvas.toDataURL('image/png');
    };
  }, [faviconDot]);
  const jira = useJira(auth);
  const timeTracking = useTimeTracking(auth);
  const org = useOrg(auth);
  const { assignedTasks, toggleAssignedTaskDone } = useAssignedTasks(auth);
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
  const [gcalAttended, setGcalAttended] = useServerStorage(STORAGE_KEYS.gcalAttended, {});
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
  const celebratedStreaksRef = useRef(new Set());
  const orgSyncTimerRef = useRef(null);

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

  // Merge personal + assigned tasks — assigned tasks appear in all views automatically
  const allTasks = useMemo(() => [...tasks, ...assignedTasks], [tasks, assignedTasks]);

  // Unified toggle — routes to the right handler based on task origin
  function handleToggleTask(id) {
    if (assignedTasks.find((t) => t.id === id)) {
      const task = assignedTasks.find((t) => t.id === id);
      const becomingDone = !task.done;
      toggleAssignedTaskDone(id);
      if (becomingDone) {
        const xp = getPriority(task.priority).xp;
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
            history: { ...history, [today]: { completed: todayEntry.completed + 1, xp: todayEntry.xp + xp } },
          };
        });
        pushToast(`+${xp} XP — Task complete!`);
      }
      return;
    }
    toggleTask(id);
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

  function updateJob(id, changes) {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...changes } : j)));
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

  const MEETING_XP = 15;

  function toggleMeeting(id) {
    const meeting = meetings.find((m) => m.id === id);
    if (!meeting) return;

    if (meeting.attended) {
      setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, attended: false, attendedAt: null } : m)));
      setStats((prev) => {
        const today = getTodayString();
        const history = prev.history || {};
        const todayEntry = history[today] || { completed: 0, xp: 0 };
        return {
          ...prev,
          totalXp: Math.max(0, prev.totalXp - MEETING_XP),
          history: {
            ...history,
            [today]: {
              ...todayEntry,
              xp: Math.max(0, todayEntry.xp - MEETING_XP),
            },
          },
        };
      });
      return;
    }

    const now = new Date();
    setMeetings((prev) => prev.map((m) => (m.id === id ? { ...m, attended: true, attendedAt: now.toISOString() } : m)));
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
        totalXp: prev.totalXp + MEETING_XP,
        streak,
        lastActiveDate,
        longestStreak,
        history: {
          ...history,
          [today]: {
            ...todayEntry,
            xp: todayEntry.xp + MEETING_XP,
          },
        },
      };
    });
    pushToast(`+${MEETING_XP} XP — Meeting attended!`);
  }

  function toggleGoogleEvent(id) {
    const isAttended = gcalAttended[id]?.attended;
    if (isAttended) {
      setGcalAttended((prev) => ({ ...prev, [id]: { attended: false, attendedAt: null } }));
      setStats((prev) => {
        const today = getTodayString();
        const history = prev.history || {};
        const todayEntry = history[today] || { completed: 0, xp: 0 };
        return {
          ...prev,
          totalXp: Math.max(0, prev.totalXp - MEETING_XP),
          history: { ...history, [today]: { ...todayEntry, xp: Math.max(0, todayEntry.xp - MEETING_XP) } },
        };
      });
      return;
    }
    const now = new Date();
    setGcalAttended((prev) => ({ ...prev, [id]: { attended: true, attendedAt: now.toISOString() } }));
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
        totalXp: prev.totalXp + MEETING_XP,
        streak,
        lastActiveDate,
        longestStreak,
        history: { ...history, [today]: { ...todayEntry, xp: todayEntry.xp + MEETING_XP } },
      };
    });
    pushToast(`+${MEETING_XP} XP — Meeting attended!`);
  }

  // --- Achievements ---
  useEffect(() => {
    const context = { stats, jobs, tasks, meetings, gcalAttended };
    const newly = getNewlyUnlocked(earned, context);
    if (newly.length === 0) return;

    const bonusXp = newly.reduce((sum, a) => sum + a.xp, 0);
    setEarned((prev) => [...prev, ...newly.map((a) => a.id)]);
    setStats((prev) => ({ ...prev, totalXp: prev.totalXp + bonusXp }));
    newly.forEach((a) => pushToast(`Achievement unlocked: ${a.title} (+${a.xp} XP)`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, jobs, tasks, meetings, earned]);

  // --- Corporate achievement sync (debounced 8 s so rapid stat changes merge into one request) ---
  useEffect(() => {
    if (!org.org?.id || dataLoading) return;
    clearTimeout(orgSyncTimerRef.current);
    orgSyncTimerRef.current = setTimeout(() => {
      const level = getLevelInfo(stats.totalXp).level;
      const focusMinutes = Object.values(stats.history || {}).reduce((s, d) => s + (d.focusMinutes || 0), 0);
      org.syncOrgAchievements(org.org.id, {
        level,
        tasksCompleted: stats.tasksCompleted,
        totalXp: stats.totalXp,
        streak: stats.streak,
        focusMinutes,
      }).then(({ unlocked }) => {
        if (!unlocked.length) return;
        const bonusXp = unlocked.reduce((s, a) => s + a.xp_reward, 0);
        if (bonusXp > 0) setStats((prev) => ({ ...prev, totalXp: prev.totalXp + bonusXp }));
        unlocked.forEach((a) => {
          pushToast(`Company achievement unlocked: ${a.name} (+${a.xp_reward} XP)`);
          org.createCelebration(org.org.id, {
            event_type: 'achievement_unlocked',
            title: `Achievement unlocked: ${a.name}`,
            description: a.description || '',
            icon: a.icon || '🏆',
          }).catch(() => {});
        });
      }).catch(() => {});

      // Sync team goal contributions
      org.getMyTeamsGoals(org.org.id).then((goals) => {
        goals.forEach((goal) => {
          org.contributeToGoal(org.org.id, goal.id, { focusMinutes, totalXp: stats.totalXp })
            .then(({ completed }) => {
              if (completed && !goal.completed_at) {
                pushToast(`🏁 Team goal completed: ${goal.name}!`);
              }
            }).catch(() => {});
        });
      }).catch(() => {});
    }, 8000);
    return () => clearTimeout(orgSyncTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.tasksCompleted, stats.totalXp, stats.streak, org.org?.id, dataLoading]);

  // --- Level up ---
  useEffect(() => {
    if (dataLoading) return;
    const level = getLevelInfo(stats.totalXp).level;
    if (prevLevelRef.current === null) {
      prevLevelRef.current = level;
      return;
    }
    if (level > prevLevelRef.current) {
      pushToast(`Level up! You are now Level ${level}`);
      prevLevelRef.current = level;
    }
  }, [stats.totalXp, dataLoading]);

  // --- Streak milestones → celebration feed ---
  useEffect(() => {
    if (!org.org?.id || dataLoading) return;
    const MILESTONES = [7, 14, 30, 60, 100];
    const hit = MILESTONES.find((m) => stats.streak === m && !celebratedStreaksRef.current.has(m));
    if (!hit) return;
    celebratedStreaksRef.current.add(hit);
    org.createCelebration(org.org.id, {
      event_type: 'streak_milestone',
      title: `${hit}-day streak!`,
      description: `Kept the momentum going for ${hit} days straight.`,
      icon: '🔥',
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.streak, org.org?.id, dataLoading]);

  const profileHasSelections = ((profile.usageType?.length ?? 0) + (profile.role?.length ?? 0) + (profile.specialty?.length ?? 0) + (profile.goals?.length ?? 0)) > 0;

  // Tab title + favicon pulse while timer is running
  useEffect(() => {
    const { active, running, elapsed, startedAt } = timeTracking.timer;
    if (!active) {
      document.title = 'Tempo — AI-Powered Daily Planner';
      setFaviconDot(false);
      return;
    }

    function fmt(ms) {
      const totalSec = Math.floor(ms / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    setFaviconDot(true);

    if (!running) {
      document.title = `⏸ ${fmt(elapsed)} — Tempo`;
      return;
    }

    const interval = setInterval(() => {
      const ms = elapsed + (Date.now() - startedAt);
      document.title = `⏱ ${fmt(ms)} — Tempo`;
    }, 1000);

    return () => clearInterval(interval);
  }, [timeTracking.timer.active, timeTracking.timer.running, timeTracking.timer.elapsed, timeTracking.timer.startedAt]);

  if (!profile.onboardingComplete || !profileHasSelections) {
    return <OnboardingFlow onComplete={(data) => setProfile(data)} />;
  }

  return (
    <div className={`min-h-screen transition-all duration-200 ${sidebarCollapsed ? 'md:pl-14' : 'md:pl-60'} ${timeTracking.timer.active && activeTab !== 'time' ? 'pb-14' : ''}`}>
      <div className="fixed inset-0 -z-10 overflow-hidden bg-gray-50 dark:bg-gray-950">
        <div className="absolute inset-0" style={{ backgroundImage: `url(${heroBgImg})`, backgroundSize: 'cover', backgroundPosition: 'center 20%', opacity: 0.1 }} />
      </div>

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streak={stats.streak}
        theme={theme}
        user={auth.user}
        onLogout={logout}
        org={org.org}
        plan={plan}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((s) => !s)}
      />
      <Toast toasts={toasts} />

      {/* Trial banner */}
      {isOnTrial && (
        <div className={`flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium ${trialDaysLeft <= 3 ? 'bg-red-500 text-white' : trialDaysLeft <= 7 ? 'bg-amber-400 text-amber-950' : 'bg-blue-600 text-white'}`}>
          <span>
            {trialDaysLeft === 0
              ? 'Your free trial expires today.'
              : `${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left in your free trial.`}
          </span>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex-shrink-0 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 font-semibold transition-colors"
          >
            Upgrade now
          </button>
        </div>
      )}

      {/* Trial expired gate */}
      {isTrialExpired && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/90 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto">
              <span className="text-2xl">⏰</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Your trial has ended</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose a plan to keep access to all your tasks, goals, and data.
            </p>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
            >
              Choose a plan
            </button>
          </div>
        </div>
      )}

      {/* Upgrade modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <UpgradeModal
            onClose={() => setShowUpgradeModal(false)}
            onSubscribe={subscribe}
            userEmail={auth.user?.email}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >

      {activeTab === 'today' && (
        <TodayTab
          tasks={allTasks}
          jobs={jobs}
          meetings={meetings}
          googleEvents={visibleGoogleEvents}
          stats={stats}
          user={auth.user}
          onAddTask={addTask}
          onAddMeeting={addMeeting}
          onAiPlanImported={addAiPlanImport}
          onToggleTask={handleToggleTask}
          onToggleMeeting={toggleMeeting}
          gcalAttended={gcalAttended}
          onToggleGoogleEvent={toggleGoogleEvent}
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
          tasks={allTasks}
          jobs={jobs}
          meetings={meetings}
          googleEvents={visibleGoogleEvents}
          onAddTask={addTask}
          onAddMeeting={addAiPlanImport}
          onAiPlanImported={addAiPlanImport}
          onToggleTask={handleToggleTask}
          onToggleMeeting={toggleMeeting}
          gcalAttended={gcalAttended}
          onToggleGoogleEvent={toggleGoogleEvent}
          onDeleteTask={deleteTask}
          onEditTask={editTask}
          timeFormat={timeFormat}
          timeTracking={timeTracking}
          org={org.org}
          orgActions={org}
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
          onToggleMeeting={toggleMeeting}
          onHideEvent={hideCalendarEvent}
          onGoToSettings={() => setActiveTab('settings')}
          timeFormat={timeFormat}
        />
      )}

      {activeTab === 'progress' && (
        <ProgressTab stats={stats} />
      )}

      {activeTab === 'achievements' && (
        <AchievementsTab stats={stats} jobs={jobs} meetings={meetings} gcalAttended={gcalAttended} earned={earned} org={org.org} orgActions={org} />
      )}

      {activeTab === 'goals' && (
        <GoalsTab org={org.org} orgActions={org} />
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
        <TimeTab timeTracking={timeTracking} tasks={allTasks} meetings={meetings} googleEvents={visibleGoogleEvents} stats={stats} jobs={jobs} onLogFocus={logFocusSession} timeFormat={timeFormat} />
      )}

      {activeTab === 'admin' && (
        <AdminTab auth={auth} org={org.org} orgActions={org} />
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
          onUpdateJob={updateJob}
          meetings={meetings}
          onAddMeeting={addMeeting}
          onDeleteMeeting={deleteMeeting}
          onToggleMeeting={toggleMeeting}
          timezone={timezone}
          onSetTimezone={setTimezone}
          timeFormat={timeFormat}
          onSetTimeFormat={setTimeFormat}
          profile={profile}
          onUpdateProfile={setProfile}
          jira={jira}
          auth={auth}
          plan={plan}
          org={org.org}
          orgActions={org}
          onNavigate={setActiveTab}
          onUpgrade={() => setShowUpgradeModal(true)}
        />
      )}

        </motion.div>
      </AnimatePresence>

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
