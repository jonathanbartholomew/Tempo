import { useState, useEffect, useRef, useCallback } from "react";
import {
  CalendarDays,
  Sparkles,
  Trophy,
  Clock,
  CalendarPlus,
  Brain,
  PartyPopper,
  Check,
  Quote,
  Heart,
} from "lucide-react";
import logoLight from "../../assets/tempo-logo-trans.png";
import logoDark from "../../assets/tempo-logo-dark-mode.png";
import scheduleUnifiedImg from "../../assets/schedule-unified.png";
import aiPlannerImg from "../../assets/ai-planner.png";
import calendarsImg from "../../assets/calendars.png";
import levelUpImg from "../../assets/level-up.png";
import abstractBlueWavesImg from "../../assets/abstract-blue-waves.jpg";
import horizontalLinesBgImg from "../../assets/abstract-blue-waves-horizontal.jpg";
import heroBgImg from "../../assets/hero-background.jpg";
import { BackgroundBeams } from "../ui/background-beams";
import { GlowingEffect } from "../ui/glowing-effect";
import { FlipWords } from "../ui/flip-words";
import { motion, AnimatePresence } from "motion/react";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
} from "../ui/resizable-navbar";

const SLIDES = [
  {
    icon: Clock,
    title: "Today's schedule, unified",
    description:
      "Tasks, meetings, and Google Calendar events merge into one chronological timeline — so you always know what's next.",
    bgImage: scheduleUnifiedImg,
  },
  {
    icon: Sparkles,
    title: "AI Day Planner",
    description:
      "Generate a tailored daily plan with Claude and import it straight into Tempo — no extra API costs on top of your subscription.",
    bgImage: aiPlannerImg,
  },
  {
    icon: CalendarDays,
    title: "Every calendar, one view",
    description:
      "Connect multiple Google accounts and see every meeting and event from each account, color-coded and in sync.",
    bgImage: calendarsImg,
  },
  {
    icon: Trophy,
    title: "Level up your routine",
    description:
      "Other planners just hand you a list. Tempo turns finishing it into XP, streaks, and achievements — the motivation most planners leave out.",
    bgImage: levelUpImg,
  },
];

const TOTAL_PANELS = SLIDES.length + 1;

const STRING_POSITIONS = [4, 16, 28, 40, 50, 60, 72, 84];

const STEPS = [
  {
    icon: CalendarPlus,
    title: "Connect your calendars",
    description:
      "Sign in with Google and link as many calendar accounts as you need — work, personal, freelance.",
  },
  {
    icon: Brain,
    title: "Plan your day",
    description:
      "Add tasks and meetings yourself, or copy a prompt to Claude and import the AI-generated plan in one click.",
  },
  {
    icon: PartyPopper,
    title: "Stay in Tempo",
    description:
      "Work through your unified timeline, earn XP for what you finish, build streaks, and stay focused with the built-in timer — momentum that compounds day after day.",
  },
];

const NAV_ITEMS = [
  { name: "Features", link: "#features" },
  { name: "How it works", link: "#how-it-works" },
  { name: "Pricing", link: "#pricing" },
];

const PRICING_TIERS = [
  {
    name: "Personal",
    price: "$12",
    suffix: "/ month",
    description: "For individuals who want an AI-powered edge on their day.",
    cta: "Get started",
    highlighted: true,
    badge: "Most popular",
    features: [
      "AI Day Planner (Claude-powered)",
      "Unlimited tasks & meetings",
      "Multiple calendar accounts",
      "Multi-job tracking & color coding",
      "Category time entry tagging",
      "Jira, Asana & Linear integration",
      "Exclusive achievements & rewards",
      "XP, streaks & level system",
      "Focus timer & Pomodoro",
    ],
  },
  {
    name: "Team",
    price: "$29",
    suffix: "/ user / month",
    description: "For small teams who want to move fast and stay aligned.",
    cta: "Get started",
    features: [
      "Everything in Personal",
      "Team workspace",
      "Admin controls & user management",
      "Assign tasks across team members",
      "Shared task boards",
      "Team achievements & leaderboards",
      "Team analytics & reporting",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Contact us",
    suffix: "",
    description: "For organizations that need full control at scale.",
    cta: "Contact sales",
    features: [
      "Everything in Team",
      "Company-wide workspace",
      "Role-based access control",
      "Multiple teams & departments",
      "Custom SSO & SCIM provisioning",
      "Org-wide analytics & exports",
      "Custom integrations",
      "Dedicated success manager",
      "SLA & compliance support",
    ],
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Tempo is the first planner that actually made me excited to open it in the morning. The XP and streaks are genuinely addictive.",
    name: "Sarah K.",
    role: "Freelance Designer",
    initials: "SK",
  },
  {
    quote:
      "I juggle three clients across two Google accounts. Seeing everything in one color-coded timeline has saved me from missing more than a few calls.",
    name: "Marcus T.",
    role: "Independent Consultant",
    initials: "MT",
  },
  {
    quote:
      "The AI day planner is what sold me. I describe my tasks, it builds the whole day. Then I just execute.",
    name: "Priya M.",
    role: "Product Manager",
    initials: "PM",
  },
];

export default function LoginScreen({ theme, onGetStarted }) {
  const [hProgress, setHProgress] = useState(0);
  const [howStep, setHowStep] = useState(0);
  const [howExpand, setHowExpand] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const horizontalRef = useRef(null);
  const howRef = useRef(null);
  const suppressSnapRef = useRef(false);

  function scrollToHash(e) {
    e.preventDefault();
    const href = e.currentTarget.getAttribute("href");
    const id = href && href.length > 1 ? href.slice(1) : null;
    const targetEl = id ? document.getElementById(id) : null;
    const top = targetEl
      ? targetEl.getBoundingClientRect().top + window.scrollY
      : 0;

    suppressSnapRef.current = true;
    window.scrollTo({ top, behavior: "smooth" });

    const clear = () => {
      suppressSnapRef.current = false;
      window.removeEventListener("scrollend", clear);
    };
    window.addEventListener("scrollend", clear);
    setTimeout(clear, 1500);
  }

  useEffect(() => {
    const prevU = { current: 0 };
    const snapping = { current: false };
    let snapEndTimeout;
    let initialized = false;

    function snapTo(target) {
      snapping.current = true;
      window.scrollTo({ top: target, behavior: "smooth" });
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
        } else if (
          delta > 0 &&
          prevU.current < lastEdge + 0.3 &&
          rawU >= lastEdge + 0.3
        ) {
          // exiting after the last panel - continue scrolling down into the next section
          snapTo(sectionTop + rect.height);
        } else {
          for (let i = 0; i < TOTAL_PANELS - 1; i++) {
            const forwardThreshold = i + 0.3;
            const backwardThreshold = i + 0.7;
            let target = null;
            if (
              delta > 0 &&
              prevU.current < forwardThreshold &&
              rawU >= forwardThreshold
            ) {
              target = (i + 1) / (TOTAL_PANELS - 1);
            } else if (
              delta < 0 &&
              prevU.current > backwardThreshold &&
              rawU <= backwardThreshold
            ) {
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

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(snapEndTimeout);
    };
  }, []);

  useEffect(() => {
    function onScroll() {
      const el = howRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      if (total <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / total));
      const EXPAND_END = 0.25;
      setHowExpand(Math.min(1, progress / EXPAND_END));
      const stepProgress = Math.max(
        0,
        (progress - EXPAND_END) / (1 - EXPAND_END),
      );
      setHowStep(Math.min(2, Math.floor(stepProgress * 3)));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen transition-colors">
      <ScrollProgressBar />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-blue-600 focus:text-white focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Navbar>
        <NavBody>
          <a
            href="#"
            onClick={scrollToHash}
            className="relative z-20 flex items-center px-2 py-1"
          >
            <img
              src={theme === "dark" ? logoDark : logoLight}
              alt="Tempo"
              className="h-10 w-auto"
            />
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
            <a
              href="#"
              onClick={scrollToHash}
              className="relative z-20 flex items-center px-2 py-1"
            >
              <img
                src={theme === "dark" ? logoDark : logoLight}
                alt="Tempo"
                className="h-9 w-auto"
              />
            </a>
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((o) => !o)}
            />
          </MobileNavHeader>
          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
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
      <div
        id="main-content"
        className="fixed inset-0 overflow-hidden"
        style={{
          backgroundImage: `url(${heroBgImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
        }}
      >
        <div className="relative z-10 h-full max-w-5xl mx-auto px-4 flex flex-col items-center justify-center text-center">
          <img
            src={logoDark}
            alt="Tempo logo"
            className="h-32 sm:h-44 w-auto mb-6 drop-shadow-lg"
          />
          <h1 className="text-4xl sm:text-6xl font-bold text-white drop-shadow-lg max-w-3xl leading-tight">
            Plan your time.
            <br />
            Stay in rhythm.
            <br />
            <span aria-live="polite" aria-atomic="true">
              Get things{" "}
              <FlipWords
                words={["done", "organized", "scheduled"]}
                className="text-blue-400 px-0"
              />
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base sm:text-lg text-white/80 drop-shadow">
            Tasks, meetings, and Google Calendar — together in one simple,
            gamified daily planner with AI-assisted planning built right in.
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

      <main className="relative bg-gradient-to-b from-white via-blue-900 to-slate-950 dark:from-blue-950 dark:via-slate-900 dark:to-slate-950">
        {/* Horizontal scroll feature showcase */}
        <section
          id="features"
          ref={horizontalRef}
          aria-label="Feature showcase"
          className="relative"
          style={{ height: `${TOTAL_PANELS * 100}vh` }}
        >
          <div
            className="sticky top-0 h-screen overflow-hidden flex items-center"
            style={{
              backgroundImage: `url(${horizontalLinesBgImg})`,
              backgroundSize: "160% auto",
              backgroundPosition: `${25 + hProgress * 40}% center`,
            }}
          >
            <div
              className="absolute inset-0 bg-slate-950/45 pointer-events-none"
              aria-hidden="true"
            />

            <div
              className="relative z-10 flex h-full"
              style={{
                width: `${TOTAL_PANELS * 100}vw`,
                transform: `translateX(-${hProgress * (TOTAL_PANELS - 1) * 100}vw)`,
              }}
            >
              <div className="w-screen h-full flex-shrink-0 flex flex-col items-center justify-center gap-6 px-6 py-10">
                <div className="max-w-2xl w-full text-center">
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                    Everything you need,{" "}
                    <span className="text-blue-400">IN ONE PLACE</span>
                  </h2>
                  <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400">
                    Scroll on to see how Tempo keeps your tasks, meetings, and
                    calendar in sync — with AI-assisted planning built right in.
                  </p>
                </div>
                <div className="relative w-full max-w-2xl">
                  <GlowingEffect
                    active={Math.round(hProgress * (TOTAL_PANELS - 1)) === 0}
                  />
                  <div className="relative aspect-[3/2] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xl">
                    <img
                      src="/tempo-landing-background.png"
                      alt="Tempo app preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {SLIDES.map(
                ({ icon: Icon, title, description, mockup, bgImage }, i) => (
                  <div
                    key={title}
                    className="w-screen h-full flex-shrink-0 flex items-center justify-center px-6"
                  >
                    {bgImage ? (
                      <div className="relative max-w-4xl w-full">
                        <GlowingEffect
                          active={
                            Math.round(hProgress * (TOTAL_PANELS - 1)) === i + 1
                          }
                        />
                        <div
                          className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-cover bg-center flex items-start"
                          style={{
                            backgroundImage: `url(${bgImage})`,
                            boxShadow:
                              "0 0 0 8px rgba(255,255,255,0.13), 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.12)",
                          }}
                        >
                          <div className="max-w-md pt-10 sm:pt-14 pl-8 sm:pl-12 pr-6 text-left">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 mb-4">
                              <Icon size={24} />
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-bold text-white">
                              {title === "Today's schedule, unified" ? (
                                <>
                                  Today&apos;s schedule,{" "}
                                  <span className="text-blue-400">UNIFIED</span>
                                </>
                              ) : title === "Every calendar, one view" ? (
                                <>
                                  Every calendar,{" "}
                                  <span className="text-blue-400">
                                    ONE VIEW
                                  </span>
                                </>
                              ) : title === "Level up your routine" ? (
                                <>
                                  Level up your{" "}
                                  <span className="text-blue-400">ROUTINE</span>
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
                          <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {title}
                          </h3>
                          <p className="mt-3 text-gray-500 dark:text-gray-400">
                            {description}
                          </p>
                        </div>
                        <div className="flex justify-center">{mockup}</div>
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>

            <div
              aria-hidden="true"
              className="absolute bottom-10 left-0 right-0 z-10 flex justify-center gap-2"
            >
              {Array.from({ length: TOTAL_PANELS }).map((_, i) => {
                const segment = 1 / (TOTAL_PANELS - 1);
                const active = Math.round(hProgress / segment) === i;
                return (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      active
                        ? "w-8 bg-blue-600"
                        : "w-1.5 bg-gray-300 dark:bg-gray-700"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats band */}
        <div className="relative overflow-hidden py-16 mt-24">
          <div className="relative z-10 max-w-5xl mx-auto px-4">
            <Reveal className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Built for people who{" "}
                <span className="text-blue-400 uppercase">move fast</span>
              </h2>
              <p className="mt-2 text-blue-200/60 text-sm">
                Thousands of professionals plan their day with Tempo
              </p>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              {[
                { value: 10000, suffix: "+", label: "Active users" },
                { value: 3, suffix: " min", label: "Average setup time" },
                { value: 98, suffix: "%", label: "Would recommend" },
              ].map(({ value, suffix, label }, i) => (
                <Reveal key={label} delay={i * 0.12}>
                  <div className="text-4xl sm:text-5xl font-extrabold text-white">
                    <AnimatedCounter to={value} suffix={suffix} />
                  </div>
                  <p className="mt-2 text-blue-200/70 text-sm font-medium">
                    {label}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* How it works - sticky scroll with expanding card */}
        <section
          id="how-it-works"
          ref={howRef}
          aria-label="How Tempo works"
          style={{ height: "400vh" }}
          className="relative"
        >
          <div className="sticky top-0 h-screen overflow-hidden">
            {/* Expanding card — waves image, grows from card to full screen */}
            <div
              className="absolute flex items-center justify-center overflow-hidden"
              style={{
                top: `${(1 - howExpand) * 17.5}vh`,
                bottom: `${(1 - howExpand) * 17.5}vh`,
                left: `${(1 - howExpand) * 20}%`,
                right: `${(1 - howExpand) * 20}%`,
                borderRadius: `${(1 - howExpand) * 24}px`,
                backgroundImage: `url(${abstractBlueWavesImg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundAttachment: "fixed",
              }}
            >
              {/* Dark filter — starts opaque, fades out as card expands */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: `rgba(0,0,0,${(1 - howExpand) * 0.7})`,
                }}
                aria-hidden="true"
              />

              {/* Content card — always visible; only the glass background fades in */}
              <div className="relative z-10 w-full max-w-lg rounded-2xl overflow-hidden text-center">
                <div
                  className="absolute inset-0 apple-glass"
                  style={{ opacity: howExpand }}
                  aria-hidden="true"
                />
                <div className="relative z-10 px-8 py-10">
                  <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-3">
                    Step {howStep + 1} of {STEPS.length}
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                    How Tempo <span className="text-blue-400">WORKS</span>
                  </h2>
                  <div
                    className="flex items-center justify-center gap-2 mb-8"
                    aria-hidden="true"
                  >
                    {STEPS.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-500 ${
                          i <= howStep ? "bg-blue-400 w-8" : "bg-white/20 w-4"
                        }`}
                      />
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    {STEPS.map(({ icon: Icon, title, description }, i) =>
                      i === howStep ? (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -30 }}
                          transition={{
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/20 text-blue-400 mx-auto mb-6">
                            <Icon size={30} />
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                            {title}
                          </h3>
                          <p className="text-gray-300 leading-relaxed">
                            {description}
                          </p>
                          <div className="mt-6 inline-block px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-semibold tracking-wide">
                            {
                              ["One-time setup", "AI-powered", "Daily ritual"][
                                i
                              ]
                            }
                          </div>
                        </motion.div>
                      ) : null,
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <p className="absolute bottom-10 z-10 text-xs text-blue-300/40">
                &#8595; Scroll to continue
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <div className="relative overflow-hidden">
          <SectionGlow />
          <div className="max-w-5xl mx-auto px-4 py-16">
            <Reveal className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                What people are <span className="text-blue-400">SAYING</span>
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Real feedback from real Tempo users.
              </p>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ quote, name, role, initials }, i) => (
                <Reveal key={name} delay={i * 0.12}>
                  <div className="apple-glass-static rounded-2xl p-6 flex flex-col gap-4 h-full">
                    <Quote size={20} className="text-blue-400 shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex-1">
                      {quote}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {role}
                        </p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div id="pricing" className="relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 py-16">
            <Reveal className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Plans built for{" "}
                <span className="text-blue-400">HOW YOU WORK</span>
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-400">
                From solo professionals to entire organizations — Tempo scales with you.
              </p>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              {PRICING_TIERS.map((tier, i) => (
                <Reveal
                  key={tier.name}
                  delay={i * 0.1}
                  className={tier.highlighted ? "sm:scale-105" : ""}
                >
                  <div
                    className={`relative rounded-2xl p-6 flex flex-col ${
                      tier.highlighted ? "apple-glass-static-blue" : "apple-glass-static"
                    }`}
                  >
                    {tier.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold whitespace-nowrap">
                        {tier.badge}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-white">
                      {tier.name}
                    </h3>
                    <p className="mt-1 text-sm text-blue-200/60">
                      {tier.description}
                    </p>
                    <div className="mt-4 flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-white">
                        {tier.price}
                      </span>
                      {tier.suffix && (
                        <span className="text-sm text-blue-200/60">
                          {tier.suffix}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={onGetStarted}
                      className={`mt-5 w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                        tier.highlighted
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {tier.cta}
                    </button>
                    <ul className="mt-6 space-y-2.5">
                      {tier.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-sm text-blue-100/80"
                        >
                          <Check
                            size={16}
                            className="text-blue-500 mt-0.5 flex-shrink-0"
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto px-4 py-16 text-center">
            <Reveal>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">
                Ready to find your <span className="text-blue-400">Tempo?</span>
              </h2>
              <p className="mt-4 text-lg text-blue-200/70">
                Connect your calendars, let AI plan your day, and start building momentum.
              </p>
              <div className="mt-8">
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-500 transition-colors shadow-xl cursor-pointer"
                >
                  Get started
                </button>
              </div>
              <p className="mt-6 text-xs text-blue-300/40">
                Signing in also lets Tempo import events from your Google
                Calendar.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative border-t border-white/10 overflow-hidden">
          <SectionGlow />
          <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <img src={logoDark} alt="Tempo" className="h-9 w-auto" />

            <nav
              aria-label="Footer navigation"
              className="flex items-center gap-6 text-sm font-medium text-slate-400"
            >
              <a
                href="#features"
                onClick={scrollToHash}
                className="hover:text-white transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={scrollToHash}
                className="hover:text-white transition-colors"
              >
                How it works
              </a>
              <a
                href="#pricing"
                onClick={scrollToHash}
                className="hover:text-white transition-colors"
              >
                Pricing
              </a>
              <button
                onClick={onGetStarted}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Sign in
              </button>
            </nav>

            <div className="flex flex-col items-center sm:items-end gap-1">
              <p className="text-xs text-slate-500">
                © {new Date().getFullYear()} Tempo. All rights reserved.
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                Product made with <Heart size={11} className="text-blue-500 fill-blue-500" aria-hidden="true" /> by{" "}
                <a href="https://daedabyte.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-400 transition-colors">
                  Daedabyte
                </a>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedCounter({ to, suffix = "", duration = 1.5 }) {
  const [ref, inView] = useInView();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    function step(now) {
      const progress = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [inView, to, duration]);
  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  const onScroll = useCallback(() => {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    setProgress(total > 0 ? scrolled / total : 0);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  return (
    <div
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent pointer-events-none"
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-sky-400 transition-none"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}

function SectionGlow() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/15 blur-3xl animate-drift" style={{ willChange: 'transform' }} />
      <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-purple-500/10 blur-3xl animate-drift-reverse" style={{ willChange: 'transform' }} />
    </div>
  );
}
