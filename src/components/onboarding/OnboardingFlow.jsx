import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import logoDark from '../../assets/tempo-logo-dark-mode.png';

const STEPS = [
  {
    key: 'usageType',
    title: 'What brings you to Tempo?',
    subtitle: 'Select all that apply',
    options: [
      'Personal Productivity',
      'Freelance & Client Work',
      'Small Business',
      'Team / Organization',
      'Student',
    ],
  },
  {
    key: 'role',
    title: "What's your role?",
    subtitle: "We'll use this to personalize your experience",
    options: [
      'Freelancer / Contractor',
      'Employee',
      'Business Owner',
      'Manager / Team Lead',
      'Individual Contributor',
      'Student',
      'Executive / Director',
    ],
  },
  {
    key: 'specialty',
    title: 'What do you do?',
    subtitle: 'Pick your area of work — select all that fit',
    options: [
      'Software Development',
      'Web Development',
      'Project Management',
      'Design / UX',
      'Product Management',
      'Marketing',
      'Sales',
      'Data / Analytics',
      'DevOps / Infrastructure',
      'Content Creation',
      'Finance / Accounting',
      'Consulting',
    ],
  },
  {
    key: 'goals',
    title: 'What are you hoping to achieve?',
    subtitle: 'Select everything that resonates',
    options: [
      'Stay on top of my schedule',
      'Manage multiple jobs or clients',
      'Build consistent daily habits',
      'Track focus & deep work time',
      'Reduce overwhelm',
      'Hit my daily goals',
      'Collaborate with a team',
    ],
  },
];

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState({ usageType: [], role: [], specialty: [], goals: [] });

  const current = STEPS[step];
  const selected = selections[current.key];
  const isLast = step === STEPS.length - 1;

  function toggle(option) {
    setSelections((prev) => {
      const list = prev[current.key];
      return {
        ...prev,
        [current.key]: list.includes(option) ? list.filter((o) => o !== option) : [...list, option],
      };
    });
  }

  function handleNext() {
    if (isLast) {
      onComplete({ ...selections, onboardingComplete: true });
    } else {
      setStep((s) => s + 1);
    }
  }

return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/40 via-gray-950 to-gray-950 pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        <img src={logoDark} alt="Tempo" className="h-12 w-auto mb-10 opacity-90" />

        {/* Step dots */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === step
                  ? 'w-6 h-2 bg-blue-500'
                  : i < step
                  ? 'w-2 h-2 bg-blue-500/50'
                  : 'w-2 h-2 bg-gray-700'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22 }}
            className="w-full flex flex-col items-center"
          >
            <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">
              Step {step + 1} of {STEPS.length}
            </p>
            <h1 className="text-3xl font-bold text-white text-center mb-2">{current.title}</h1>
            <p className="text-gray-400 text-sm text-center mb-8">{current.subtitle}</p>

            {/* Bubbles */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {current.options.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <motion.button
                    key={option}
                    onClick={() => toggle(option)}
                    whileTap={{ scale: 0.94 }}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <Check size={13} />
                      </motion.span>
                    )}
                    {option}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={handleNext}
          disabled={selected.length === 0}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-blue-500/20"
        >
          {isLast ? 'Get started' : 'Continue'}
          <ArrowRight size={16} />
        </button>

      </div>
    </div>
  );
}
