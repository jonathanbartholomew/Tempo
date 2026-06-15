import { useState, useEffect, useRef } from 'react';
import { CalendarDays, Sparkles, Trophy, Clock, CalendarPlus, Brain, PartyPopper, Check } from 'lucide-react';
import logoLight from '../../assets/tempo-logo-trans.png';
import logoDark from '../../assets/tempo-logo-dark-mode.png';
import scheduleUnifiedImg from '../../assets/schedule-unified.png';
import aiPlannerImg from '../../assets/ai-planner.png';
import calendarsImg from '../../assets/calendars.png';
import levelUpImg from '../../assets/level-up.png';
import { BackgroundBeams } from '../ui/background-beams';
import { GlowingEffect } from '../ui/glowing-effect';
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
} from '../ui/resizable-navbar';

const SLIDES = [
  {
    icon: Clock,
    title: "Today's schedule, unified",
    description: "Tasks, meetings, and Google Calendar events merge into one chronological timeline — so you always know what's next.",
    bgImage: scheduleUnifiedImg,
  },
  {
    icon: Sparkles,
    title: 'AI Day Planner',
    description: 'Generate a tailored daily plan with Claude and import it straight into Tempo — no extra API costs on top of your subscription.',
    bgImage: aiPlannerImg,
  },
  {
    icon: CalendarDays,
    title: 'Every calendar, one view',
    description: 'Connect multiple Google accounts and see every meeting and event from each account, color-coded and in sync.',
    bgImage: calendarsImg,
  },
  {
    icon: Trophy,
    title: 'Level up your routine',
    description: "Other planners just hand you a list. Tempo turns finishing it into XP, streaks, and achievements — the motivation most planners leave out.",
    bgImage: levelUpImg,
  },
];

const TOTAL_PANELS = SLIDES.length + 1;

const STRING_POSITIONS = [4, 16, 28, 40, 50, 60, 72, 84];

const STEPS = [
  {
    icon: CalendarPlus,
    title: 'Connect your calendars',
    description: 'Sign in with Google and link as many calendar accounts as you need — work, personal, freelance.',
  },
  {
    icon: Brain,
    title: 'Plan your day',
    description: 'Add tasks and meetings yourself, or copy a prompt to Claude and import the AI-generated plan in one click.',
  },
  {
    icon: PartyPopper,
    title: 'Stay in tempo',
    description: 'Work through your unified timeline, earn XP for what you finish, build streaks, and stay focused with the built-in timer — momentum that compounds day after day.',
  },
];

const NAV_ITEMS = [
  { name: 'Features', link: '#features' },
  { name: 'How it works', link: '#how-it-works' },
  { name: 'Pricing', link: '#pricing' },
];

const PRICING_TIERS = [
  {
    name: 'Free',
    price: '$0',
    suffix: '/ forever',
    description: 'Everything you need to get organized and build momentum.',
    cta: 'Get started',
    features: [
      'Unlimited tasks & meetings',
      '1 connected Google Calendar',
      'AI day-plan import',
      'XP, streaks & achievements',
    ],
  },
  {
    name: 'Personal',
    price: '$10',
    suffix: '/ month',
    description: 'For people juggling multiple calendars and jobs.',
    cta: 'Get started',
    highlighted: true,
    features: [
      'Everything in Free',
      'Unlimited connected calendars',
      'Multiple jobs & color-coded accounts',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Contact us',
    suffix: '',
    description: 'For teams that want Tempo across the organization.',
    cta: 'Contact sales',
    features: [
      'Everything in Personal',
      'Team workspaces',
      'SSO & admin controls',
      'Dedicated support',
    ],
  },
];

export default function LoginScreen({ theme, onGetStarted }) {
  const [hProgress, setHProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const horizontalRef = useRef(null);
  const suppressSnapRef = useRef(false);

  function scrollToHash(e) {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    const id = href && href.length > 1 ? href.slice(1) : null;
    const targetEl = id ? document.getElementById(id) : null;
    const top = targetEl ? targetEl.getBoundingClientRect().top + window.scrollY : 0;

    suppressSnapRef.current = true;
    window.scrollTo({ top, behavior: 'smooth' });

    const clear = () => {
      suppressSnapRef.current = false;
      window.removeEventListener('scrollend', clear);
    };
    window.addEventListener('scrollend', clear);
    setTimeout(clear, 1500);
  }

  useEffect(() => {
    const prevU = { current: 0 };
    const snapping = { current: false };
    let snapEndTimeout;
    let initialized = false;

    function snapTo(target) {
      snapping.current = true;
      window.scrollTo({ top: target, behavior: 'smooth' });
      clearTimeout(snapEndTimeout);
      snapEndTimeout = setTimeout(() => {
        snapping.current = false;
      }, 600);
    }

    function onScroll() {
      const el = horizontalRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;

      const rawProgress = -rect.top / total;
      setHProgress(Math.min(1, Math.max(0, rawProgress)));

      if (suppressSnapRef.current) {
        initialized = false;
        return;
      }

      const rawU = rawProgress * (TOTAL_PANELS - 1);
      const sectionTop = window.scrollY + rect.top;

      if (!initialized) {
        prevU.current = rawU;
        initialized = true;
        return;
      }

      const delta = rawU - prevU.current;

      if (!snapping.current && delta !== 0) {
        const lastEdge = TOTAL_PANELS - 1;
        if (delta < 0 && prevU.current > -0.3 && rawU <= -0.3) {
          // exiting before the first panel - continue scrolling up into the previous section
          snapTo(sectionTop - window.innerHeight);
        } else if (delta > 0 && prevU.current < lastEdge + 0.3 && rawU >= lastEdge + 0.3) {
          // exiting after the last panel - continue scrolling down into the next section
          snapTo(sectionTop + rect.height);
        } else {
          for (let i = 0; i < TOTAL_PANELS - 1; i++) {
            const forwardThreshold = i + 0.3;
            const backwardThreshold = i + 0.7;
            let target = null;
            if (delta > 0 && prevU.current < forwardThreshold && rawU >= forwardThreshold) {
              target = (i + 1) / (TOTAL_PANELS - 1);
            } else if (delta < 0 && prevU.current > backwardThreshold && rawU <= backwardThreshold) {
              target = i / (TOTAL_PANELS - 1);
            }
            if (target !== null) {
              snapTo(sectionTop + target * total);
              break;
            }
          }
        }
      }

      prevU.current = rawU;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(snapEndTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen transition-colors">
      <Navbar>
        <NavBody>
          <a href="#" onClick={scrollToHash} className="relative z-20 flex items-center px-2 py-1">
            <img src={theme === 'dark' ? logoDark : logoLight} alt="Tempo" className="h-10 w-auto" />
          </a>
          <NavItems items={NAV_ITEMS} onItemClick={scrollToHash} />
          <div className="relative z-20 flex items-center gap-3">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Get started
            </button>
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <a href="#" onClick={scrollToHash} className="relative z-20 flex items-center px-2 py-1">
              <img src={theme === 'dark' ? logoDark : logoLight} alt="Tempo" className="h-9 w-auto" />
            </a>
            <MobileNavToggle isOpen={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen((o) => !o)} />
          </MobileNavHeader>
          <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.name}
                href={item.link}
                onClick={(e) => {
                  scrollToHash(e);
                  setIsMobileMenuOpen(false);
                }}
                className="relative text-gray-600 dark:text-gray-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onGetStarted();
              }}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Get started
            </button>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Hero - fixed in place; the content below slides up over it for a parallax effect */}
      <div className="fixed inset-0 overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900">
        <BackgroundBeams className="absolute inset-0 h-full" />
        <div className="relative z-10 h-full max-w-5xl mx-auto px-4 flex flex-col items-center justify-center text-center">
          <img src={logoDark} alt="Tempo" className="h-32 sm:h-44 w-auto mb-6 drop-shadow-lg" />
          <h1 className="text-4xl sm:text-6xl font-bold text-white drop-shadow-lg max-w-3xl leading-tight">
            Plan your time.
            <br />
            Stay in rhythm.
            <br />
            Get things <FlipWords words={['done', 'organized', 'scheduled']} className="text-blue-400 px-0" />
          </h1>
          <p className="mt-4 max-w-xl text-base sm:text-lg text-white/80 drop-shadow">
            Tasks, meetings, and Google Calendar — together in one simple, gamified daily planner with
            AI-assisted planning built right in.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg cursor-pointer"
            >
              Get started
            </button>
            <a
              href="#features"
              onClick={scrollToHash}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>
      </div>

      {/* Spacer so the fixed hero is visible before the next section slides over it */}
      <div className="h-[120vh] pointer-events-none" aria-hidden="true" />

      <div className="relative bg-gradient-to-b from-white via-blue-50 to-blue-100 dark:from-blue-950 dark:via-[#111a37] dark:to-gray-950">

      {/* Horizontal scroll feature showcase */}
      <section id="features" ref={horizontalRef} className="relative" style={{ height: `${TOTAL_PANELS * 100}vh` }}>
        <div className="sticky top-0 h-screen overflow-hidden flex items-center">
          {/* Background guitar-string lines + scroll-tracing laser */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {STRING_POSITIONS.map((y) => {
                const d = `M0,${y} L1200,${y}`;
                const isMiddle = y === 40 || y === 50 || y === 60;
                return (
                  <g key={y}>
                    <path
                      d={d}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeOpacity={isMiddle ? 0.1 : 0.25}
                      vectorEffect="non-scaling-stroke"
                      className="text-gray-100 dark:text-gray-900"
                    />
                    <motion.path
                      d={d}
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="2"
                      strokeOpacity={isMiddle ? 0.07 : 0.18}
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      initial={false}
                      animate={{ pathLength: hProgress }}
                      transition={{ type: 'tween', duration: 0 }}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div
            className="relative z-10 flex h-full"
            style={{
              width: `${TOTAL_PANELS * 100}vw`,
              transform: `translateX(-${hProgress * (TOTAL_PANELS - 1) * 100}vw)`,
            }}
          >
            <div className="w-screen h-full flex-shrink-0 flex flex-col items-center justify-center gap-6 px-6 py-10">
              <div className="max-w-2xl w-full text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                  Everything you need, <span className="text-blue-400">IN ONE PLACE</span>
                </h1>
                <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400">
                  Scroll on to see how Tempo keeps your tasks, meetings, and calendar in sync — with
                  AI-assisted planning built right in.
                </p>
              </div>
              <div className="relative w-full max-w-2xl">
                <GlowingEffect active={Math.round(hProgress * (TOTAL_PANELS - 1)) === 0} />
                <div className="relative aspect-[3/2] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xl">
                  <img
                    src="/tempo-landing-background.png"
                    alt="Tempo app preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {SLIDES.map(({ icon: Icon, title, description, mockup, bgImage }, i) => (
              <div key={title} className="w-screen h-full flex-shrink-0 flex items-center justify-center px-6">
                {bgImage ? (
                  <div className="relative max-w-4xl w-full">
                    <GlowingEffect active={Math.round(hProgress * (TOTAL_PANELS - 1)) === i + 1} />
                    <div
                      className="relative aspect-[16/9] rounded-2xl overflow-hidden shadow-xl bg-cover bg-center flex items-start"
                      style={{ backgroundImage: `url(${bgImage})` }}
                    >
                      <div className="max-w-md pt-10 sm:pt-14 pl-8 sm:pl-12 pr-6 text-left">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 mb-4">
                          <Icon size={24} />
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-bold text-white">
                          {title === "Today's schedule, unified" ? (
                            <>
                              Today&apos;s schedule, <span className="text-blue-400">UNIFIED</span>
                            </>
                          ) : title === 'Every calendar, one view' ? (
                            <>
                              Every calendar, <span className="text-blue-400">ONE VIEW</span>
                            </>
                          ) : title === 'Level up your routine' ? (
                            <>
                              Level up your <span className="text-blue-400">ROUTINE</span>
                            </>
                          ) : (
                            title
                          )}
                        </h3>
                        <p className="mt-3 text-gray-300">{description}</p>
                      </div>
                    </div>
                  </div>
                ) : (
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
                )}
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
      <div id="how-it-works" className="relative overflow-hidden">
       <SectionGlow />
       <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            How Tempo <span className="text-blue-400">WORKS</span>
          </h2>
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
       </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="relative overflow-hidden">
        <SectionGlow />
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Simple pricing, <span className="text-blue-400">NO SURPRISES</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Start for free. Upgrade when you need more.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  tier.highlighted
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 shadow-lg sm:scale-105'
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm'
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{tier.name}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tier.description}</p>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{tier.price}</span>
                  {tier.suffix && <span className="text-sm text-gray-500 dark:text-gray-400">{tier.suffix}</span>}
                </div>
                <button
                  onClick={onGetStarted}
                  className={`mt-5 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                    tier.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {tier.cta}
                </button>
                <ul className="mt-6 space-y-2.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Check size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative overflow-hidden">
        <SectionGlow />
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Ready to find your tempo?</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sign in to sync your calendar and start planning your day.
            </p>
            <button
              onClick={onGetStarted}
              className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Sign in / Sign up
            </button>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              Signing in also lets Tempo import events from your Google Calendar.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-gray-200 dark:border-gray-800 overflow-hidden">
        <SectionGlow />
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <img src={theme === 'dark' ? logoDark : logoLight} alt="Tempo" className="h-9 w-auto" />

          <nav className="flex items-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
            <a href="#features" onClick={scrollToHash} className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Features
            </a>
            <a href="#how-it-works" onClick={scrollToHash} className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              How it works
            </a>
            <a href="#pricing" onClick={scrollToHash} className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
              Pricing
            </a>
            <button
              onClick={onGetStarted}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer"
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
    </div>
  );
}

function SectionGlow() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-3xl animate-drift" />
      <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-purple-400/15 dark:bg-purple-500/10 blur-3xl animate-drift-reverse" />
    </div>
  );
}

