import { useState, useEffect, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { CalendarDays, Sparkles, Trophy, Clock, Flame, CalendarPlus, Brain, PartyPopper, Copy, Upload, Rocket, Crown } from 'lucide-react';
import logoLight from '../../assets/tempo-logo-trans.png';
import logoDark from '../../assets/tempo-logo-dark-mode.png';
import { BackgroundBeams } from '../ui/background-beams';
import { FlipWords } from '../ui/flip-words';
import { motion } from 'motion/react';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarButton,
} from '../ui/resizable-navbar';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

const SLIDES = [
  {
    icon: Clock,
    title: "Today's schedule, unified",
    description: "Tasks, meetings, and Google Calendar events merge into one chronological timeline — so you always know what's next.",
    mockup: <TodayMockup />,
  },
  {
    icon: Sparkles,
    title: 'AI Day Planner',
    description: 'Generate a tailored daily plan with Claude and import it straight into Tempo — no extra API costs on top of your subscription.',
    mockup: <AIMockup />,
  },
  {
    icon: CalendarDays,
    title: 'Every calendar, one view',
    description: 'Connect multiple Google accounts and see every meeting and event from each account, color-coded and in sync.',
    mockup: <CalendarMockup />,
  },
  {
    icon: Trophy,
    title: 'Level up your routine',
    description: 'Earn XP for completed tasks, build streaks, and unlock achievements as you stay on top of your day.',
    mockup: <AchievementsMockup />,
  },
];

const TOTAL_PANELS = SLIDES.length + 1;

const BEAM_PATH =
  'M0,40 C80,20 160,55 240,45 C340,32 380,20 440,35 C520,55 560,65 620,45 C700,18 780,8 860,28 C940,48 1000,58 1060,40 C1110,25 1160,28 1200,35';

const STEPS = [
  {
    icon: CalendarPlus,
    title: 'Connect your calendars',
    description: 'Sign in with Google and link as many calendar accounts as you need — work, personal, freelance.',
  },
  {
    icon: Brain,
    title: 'Plan your day',
    description: 'Add tasks and meetings yourself, or copy a prompt to Claude and import the AI-generated plan in one click.',
  },
  {
    icon: PartyPopper,
    title: 'Stay in tempo',
    description: 'Work through your unified timeline, earn XP for what you finish, and watch your streak grow day after day.',
  },
];

const NAV_ITEMS = [
  { name: 'Features', link: '#features' },
  { name: 'How it works', link: '#how-it-works' },
];

export default function LoginScreen({ theme, onLogin }) {
  const [error, setError] = useState('');
  const [hProgress, setHProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const horizontalRef = useRef(null);

  useEffect(() => {
    function onScroll() {
      const el = horizontalRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        if (total > 0) {
          setHProgress(Math.min(1, Math.max(0, -rect.top / total)));
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const googleLogin = useGoogleLogin({
    scope: `openid email profile ${CALENDAR_SCOPE}`,
    onSuccess: async (tokenResponse) => {
      try {
        await onLogin(tokenResponse);
      } catch {
        setError('Sign-in failed. Please try again.');
      }
    },
    onError: () => setError('Sign-in failed. Please try again.'),
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <Navbar>
        <NavBody>
          <a href="#" className="relative z-20 flex items-center px-2 py-1">
            <img src={theme === 'dark' ? logoDark : logoLight} alt="Tempo" className="h-10 w-auto" />
          </a>
          <NavItems items={NAV_ITEMS} />
          <div className="relative z-20 flex items-center gap-3">
            <NavbarButton variant="gradient" onClick={() => googleLogin()}>
              Get started
            </NavbarButton>
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <a href="#" className="relative z-20 flex items-center px-2 py-1">
              <img src={theme === 'dark' ? logoDark : logoLight} alt="Tempo" className="h-9 w-auto" />
            </a>
            <MobileNavToggle isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen((o) => !o)} />
          </MobileNavHeader>
          <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.name}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-gray-600 dark:text-gray-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <NavbarButton
              variant="gradient"
              className="w-full"
              onClick={() => {
                setIsMobileMenuOpen(false);
                googleLogin();
              }}
            >
              Get started
            </NavbarButton>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Hero */}
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900">
        <BackgroundBeams className="absolute inset-0 h-full" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 pt-16 pb-16 sm:pt-24 sm:pb-24 flex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-white drop-shadow-lg max-w-3xl leading-tight">
            Plan your time.
            <br />
            Stay in rhythm.
            <br />
            Get things <FlipWords words={['done', 'organized', 'scheduled']} className="text-blue-400 px-0" />
          </h1>
          <p className="mt-4 max-w-xl text-base sm:text-lg text-white/80 drop-shadow">
            Tasks, meetings, and Google Calendar — together in one simple, gamified daily planner with
            AI-assisted planning built right in.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => googleLogin()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Get started with Google
            </button>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              See how it works
            </a>
          </div>

          <div className="mt-14 sm:mt-20 w-full max-w-2xl aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <img
              src="/tempo-landing-background.png"
              alt="Tempo app preview"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>

      {/* Horizontal scroll feature showcase */}
      <section id="features" ref={horizontalRef} className="relative" style={{ height: `${TOTAL_PANELS * 100}vh` }}>
        <div className="sticky top-0 h-screen overflow-hidden flex items-center bg-white dark:bg-gray-950">
          {/* Tracing beam */}
          <div className="absolute top-16 sm:top-24 left-0 right-0 z-20 h-20 sm:h-28 pointer-events-none">
            <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="beam-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={BEAM_PATH}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                className="text-gray-200 dark:text-gray-800"
              />
              <motion.path
                d={BEAM_PATH}
                fill="none"
                stroke="url(#beam-gradient)"
                strokeWidth="4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                style={{ filter: 'blur(6px)' }}
                initial={false}
                animate={{ pathLength: hProgress }}
                transition={{ type: 'spring', stiffness: 100, damping: 25 }}
              />
              <motion.path
                d={BEAM_PATH}
                fill="none"
                stroke="url(#beam-gradient)"
                strokeWidth="1.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                initial={false}
                animate={{ pathLength: hProgress }}
                transition={{ type: 'spring', stiffness: 100, damping: 25 }}
              />
            </svg>
          </div>

          <div
            className="relative flex h-full"
            style={{
              width: `${TOTAL_PANELS * 100}vw`,
              transform: `translateX(-${hProgress * (TOTAL_PANELS - 1) * 100}vw)`,
            }}
          >
            <div className="w-screen h-full flex-shrink-0 flex flex-col items-center justify-center gap-6 px-6">
              <div className="max-w-2xl w-full text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                  Everything you need, in one place
                </h1>
                <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  Scroll on to see how Tempo keeps your tasks, meetings, and calendar in sync — with
                  AI-assisted planning built right in.
                </p>
              </div>
            </div>

            {SLIDES.map(({ icon: Icon, title, description, mockup }) => (
              <div key={title} className="w-screen h-full flex-shrink-0 flex items-center justify-center px-6">
                <div className="max-w-4xl w-full grid md:grid-cols-2 gap-10 items-center">
                  <div className="text-left">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-4">
                      <Icon size={24} />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                    <p className="mt-3 text-gray-500 dark:text-gray-400">{description}</p>
                  </div>
                  <div className="flex justify-center">{mockup}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-10 left-0 right-0 z-10 flex justify-center gap-2">
            {Array.from({ length: TOTAL_PANELS }).map((_, i) => {
              const segment = 1 / (TOTAL_PANELS - 1);
              const active = Math.round(hProgress / segment) === i;
              return (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    active ? 'w-8 bg-blue-600' : 'w-1.5 bg-gray-300 dark:bg-gray-700'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <div id="how-it-works" className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">How Tempo works</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">
            Three steps to a calmer, more organized day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className="relative p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="absolute top-4 right-4 text-xs font-bold text-gray-300 dark:text-gray-700">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 mb-3">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="mt-16 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ready to find your tempo?</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sign in with Google to sync your calendar and start planning your day.
          </p>
          <button
            onClick={() => googleLogin()}
            className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
            Signing in also lets Tempo import events from your Google Calendar.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <img src={theme === 'dark' ? logoDark : logoLight} alt="Tempo" className="h-9 w-auto" />

          <nav className="flex items-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
            <a href="#features" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              How it works
            </a>
            <button
              onClick={() => googleLogin()}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Sign in
            </button>
          </nav>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} Tempo. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.97h3.86c2.26-2.09 3.56-5.17 3.56-8.79z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.97c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.07C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.31c-.24-.72-.38-1.48-.38-2.31s.14-1.59.38-2.31V6.62H1.27C.46 8.24 0 10.06 0 12s.46 3.76 1.27 5.38l4-3.07z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.27 6.62l4 3.07C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

const MOCKUP_WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function TodayMockup() {
  const items = [
    { time: '9:00 AM', title: 'Morning workout', color: '#10b981' },
    { time: '10:30 AM', title: 'Team standup', color: '#2563eb' },
    { time: '1:00 PM', title: 'Design review', color: '#8b5cf6' },
  ];
  const today = 14;
  const eventDays = [3, 8, 14, 19, 23, 27];

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-4 space-y-4 text-left">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Today's Plan</h3>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-3 p-2 rounded-xl border border-gray-200 dark:border-gray-800"
              style={{ borderLeftColor: item.color, borderLeftWidth: 4 }}
            >
              <span className="text-xs text-gray-400 dark:text-gray-500 w-16 flex-shrink-0">{item.time}</span>
              <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">June 2026</p>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1">
          {MOCKUP_WEEKDAYS.map((wd, i) => (
            <div key={i}>{wd}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 30 }).map((_, i) => {
            const day = i + 1;
            const isToday = day === today;
            const hasEvent = eventDays.includes(day);
            return (
              <div
                key={i}
                className={`relative h-6 rounded-md flex items-center justify-center text-[10px] ${
                  isToday
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {day}
                {hasEvent && !isToday && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AIMockup() {
  const tasks = ['Finish RFP draft', 'Reply to client emails', 'Prep design review slides', '30 min walk'];
  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-4 space-y-3 text-left">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-100">
          <Sparkles size={16} className="text-purple-500" />
          AI Day Planner
        </h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">Plan for: Tue, Jun 16</span>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 w-fit">
        <Copy size={13} />
        Copy prompt
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-2.5 font-mono text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
        {'{ "tasks": ['}<br />
        {'  { "title": "Finish RFP draft", "time": "9:00" },'}<br />
        {'  { "title": "Reply to client emails" },'}<br />
        {'  ...'}<br />
        {']}'}
      </div>

      <div className="space-y-1.5">
        {tasks.map((t) => (
          <div key={t} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="w-4 h-4 rounded-full border-2 border-blue-500 flex-shrink-0" />
            {t}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <span className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold">Import Plan</span>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300">
          <Upload size={12} />
          Upload file
        </span>
      </div>
    </div>
  );
}

function CalendarMockup() {
  const accounts = [
    { name: 'Work', color: '#2563eb' },
    { name: 'GiftHealth', color: '#10b981' },
    { name: 'Inventive', color: '#f59e0b' },
  ];
  const today = 14;
  const events = { 3: 1, 8: 2, 14: 0, 19: 1, 23: 2, 27: 0 };
  const dayEvents = [
    { time: '9:00 AM', title: 'Client kickoff', color: '#2563eb' },
    { time: '1:30 PM', title: 'Site visit', color: '#10b981' },
  ];

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-4 space-y-3 text-left">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Schedule</h3>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-[10px] font-medium">
          <span className="px-2 py-1 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm">Day</span>
          <span className="px-2 py-1 rounded-lg text-gray-400 dark:text-gray-500">Month</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {accounts.map((a) => (
          <span
            key={a.name}
            className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: a.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            {a.name}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 mb-1">
        {MOCKUP_WEEKDAYS.map((wd, i) => (
          <div key={i}>{wd}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 30 }).map((_, i) => {
          const day = i + 1;
          const isToday = day === today;
          const accountIndex = events[day];
          return (
            <div
              key={i}
              className={`relative h-6 rounded-md flex items-center justify-center text-[10px] ${
                isToday ? 'bg-blue-600 text-white font-semibold' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {day}
              {accountIndex !== undefined && (
                <span
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    isToday ? 'bg-white' : ''
                  }`}
                  style={!isToday ? { backgroundColor: accounts[accountIndex].color } : undefined}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5 pt-1">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">June 14</p>
        {dayEvents.map((e) => (
          <div
            key={e.title}
            className="flex items-center gap-3 p-2 rounded-xl border border-gray-200 dark:border-gray-800"
            style={{ borderLeftColor: e.color, borderLeftWidth: 4 }}
          >
            <span className="text-xs text-gray-400 dark:text-gray-500 w-16 flex-shrink-0">{e.time}</span>
            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{e.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementsMockup() {
  const stats = [
    { label: 'Tasks Done', value: 128 },
    { label: 'Day Streak', value: 12 },
    { label: 'Longest Streak', value: 24 },
    { label: 'Jobs Tracked', value: 3 },
  ];
  const badges = [
    { icon: Flame, title: 'On Fire', description: '7-day streak', xp: 50, earned: true },
    { icon: Rocket, title: 'Early Bird', description: 'Complete a task before 9am', xp: 25, earned: true },
    { icon: Crown, title: 'Centurion', description: 'Complete 100 tasks', xp: 100, earned: false },
  ];

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-4 space-y-3 text-left">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Current Level</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">Level 7</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total XP</p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">2,450</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>650 / 1000 XP</span>
          <span>Level 8</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div className="h-full w-2/3 bg-gradient-to-r from-blue-400 to-blue-600" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-base font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {badges.map((b) => (
          <div
            key={b.title}
            className={`rounded-xl border p-2.5 flex items-center gap-3 ${
              b.earned ? 'border-yellow-200 dark:border-yellow-500/30' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'
            }`}
          >
            <div
              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                b.earned ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
              }`}
            >
              <b.icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-semibold ${b.earned ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>{b.title}</p>
                {b.earned && (
                  <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded-full">
                    Earned
                  </span>
                )}
              </div>
              <p className={`text-xs ${b.earned ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}>{b.description}</p>
            </div>
            <span className={`text-xs font-semibold flex-shrink-0 ${b.earned ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-600'}`}>
              +{b.xp} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
