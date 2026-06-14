import { useState, useEffect, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { CalendarDays, Sparkles, Trophy, Clock, Flame, CalendarPlus, Brain, PartyPopper } from 'lucide-react';
import logoLight from '../../assets/tempo-logo-trans.png';
import logoDark from '../../assets/tempo-logo-dark-mode.png';

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

export default function LoginScreen({ theme, onLogin }) {
  const [error, setError] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [heroOffset, setHeroOffset] = useState(0);
  const [hProgress, setHProgress] = useState(0);
  const horizontalRef = useRef(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 50);
      setHeroOffset(window.scrollY);

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
      <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-20">
          {scrolled ? (
            <img src={theme === 'dark' ? logoDark : logoLight} alt="Tempo" className="h-16 w-auto" />
          ) : (
            <span />
          )}
          <button
            onClick={() => googleLogin()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative w-full max-w-[1920px] mx-auto aspect-video overflow-hidden">
        <img
          src="/tempo-landing-background.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: `scale(1.1) translateY(${heroOffset * 0.15}px)` }}
        />
      </div>

      {/* Intro */}
      <div className="max-w-5xl mx-auto px-4 pt-16 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
          Your day, perfectly in tempo
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-sm sm:text-base text-gray-500 dark:text-gray-400">
          Tempo brings your tasks, meetings, and Google Calendar together into one simple, gamified
          daily planner — with AI-assisted planning built right in. Scroll on to see how it works.
        </p>
      </div>

      {/* Horizontal scroll feature showcase */}
      <section ref={horizontalRef} className="relative" style={{ height: `${SLIDES.length * 100}vh` }}>
        <div className="sticky top-0 h-screen overflow-hidden flex items-center">
          <div
            className="flex h-full"
            style={{
              width: `${SLIDES.length * 100}vw`,
              transform: `translateX(-${hProgress * (SLIDES.length - 1) * 100}vw)`,
            }}
          >
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

          <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2">
            {SLIDES.map((_, i) => {
              const segment = 1 / (SLIDES.length - 1);
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
      <div className="max-w-5xl mx-auto px-4 py-16">
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

function TodayMockup() {
  const items = [
    { time: '9:00 AM', title: 'Morning workout', color: '#10b981' },
    { time: '10:30 AM', title: 'Team standup', color: '#2563eb' },
    { time: '1:00 PM', title: 'Design review', color: '#8b5cf6' },
    { time: '4:00 PM', title: 'Inventive sync', color: '#f59e0b' },
  ];
  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-4 space-y-2">
      {items.map((item) => (
        <div key={item.title} className="flex items-center gap-3 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
          <span className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
          <div className="flex-1 text-left">
            <p className="text-xs text-gray-400 dark:text-gray-500">{item.time}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AIMockup() {
  const tasks = ['Finish RFP draft', 'Reply to client emails', 'Prep design review slides', '30 min walk'];
  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-4 space-y-3 text-left">
      <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
        <Sparkles size={16} />
        AI Day Plan — Tuesday
      </div>
      {tasks.map((t) => (
        <div key={t} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span className="w-4 h-4 rounded-full border-2 border-blue-500 flex-shrink-0" />
          {t}
        </div>
      ))}
    </div>
  );
}

function CalendarMockup() {
  const accounts = [
    { name: 'Work', color: '#2563eb' },
    { name: 'GiftHealth', color: '#10b981' },
    { name: 'Inventive', color: '#f59e0b' },
  ];
  const dots = [3, 8, 14, 19, 23];
  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-4 space-y-3 text-left">
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
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 28 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            {dots.includes(i) && (
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accounts[i % accounts.length].color }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementsMockup() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl p-4 space-y-3 text-left">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-900 dark:text-gray-100">Level 7</span>
        <span className="text-gray-400 dark:text-gray-500">2,450 XP</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-blue-600" />
      </div>
      <div className="flex items-center gap-2 text-sm text-orange-500 font-semibold">
        <Flame size={16} className="fill-orange-500" />
        12-day streak
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Trophy size={18} />
          </div>
        ))}
      </div>
    </div>
  );
}
