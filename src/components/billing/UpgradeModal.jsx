import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, CreditCard, Lock, Zap, Building2, Star, Loader2 } from 'lucide-react';

const PLANS = [
  {
    id: 'personal_pro',
    name: 'Personal Pro',
    price: '$10',
    period: '/mo',
    icon: Zap,
    color: 'blue',
    features: ['Everything in trial', 'Weekly AI planning', 'Unlimited tasks & goals', 'Priority support'],
  },
  {
    id: 'team',
    name: 'Team',
    price: '$29',
    period: '/mo',
    icon: Building2,
    color: 'purple',
    popular: true,
    features: ['Everything in Personal Pro', 'Create & manage an organization', 'Team goals & company achievements', 'Task assignment & PM tools', 'Up to 25 members'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$99',
    period: '/mo flat',
    icon: Star,
    color: 'amber',
    features: ['Everything in Team', 'Unlimited members', 'Custom roles & permissions', 'Dedicated support', 'SLA guarantee'],
  },
];

const COLOR = {
  blue:   { card: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',   badge: 'bg-blue-600', btn: 'bg-blue-600 hover:bg-blue-700',   text: 'text-blue-600 dark:text-blue-400',   ring: 'ring-blue-500' },
  purple: { card: 'border-purple-500 bg-purple-50 dark:bg-purple-950/30', badge: 'bg-purple-600', btn: 'bg-purple-600 hover:bg-purple-700', text: 'text-purple-600 dark:text-purple-400', ring: 'ring-purple-500' },
  amber:  { card: 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',  badge: 'bg-amber-600', btn: 'bg-amber-600 hover:bg-amber-700',   text: 'text-amber-600 dark:text-amber-400',  ring: 'ring-amber-500' },
};

function formatCard(val) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(val) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

export default function UpgradeModal({ onClose, onSubscribe, userEmail }) {
  const [step, setStep] = useState('plans'); // plans | payment | processing | success
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]); // Team default
  const [form, setForm] = useState({ name: '', card: '', expiry: '', cvv: '', email: userEmail || '' });
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (form.card.replace(/\s/g, '').length < 16) e.card = 'Enter a valid 16-digit card number';
    if (form.expiry.length < 5) e.expiry = 'Enter MM/YY';
    if (form.cvv.length < 3) e.cvv = 'Enter CVV';
    if (!form.email.trim()) e.email = 'Required';
    return e;
  }

  async function handlePay(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setStep('processing');
    await new Promise((r) => setTimeout(r, 1800));
    try {
      await onSubscribe(selectedPlan.id);
      setStep('success');
    } catch {
      setStep('payment');
    }
  }

  const c = COLOR[selectedPlan.color];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Close */}
        {step !== 'processing' && step !== 'success' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* ── Step 1: Plan selection ─────────────────────────────────────── */}
          {step === 'plans' && (
            <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-5">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Choose your plan</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upgrade anytime. Cancel anytime.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLANS.map((p) => {
                  const col = COLOR[p.color];
                  const Icon = p.icon;
                  const sel = selectedPlan.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlan(p)}
                      className={`relative text-left rounded-xl border-2 p-4 transition-all ${sel ? col.card + ' ' + col.ring + ' ring-2' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                    >
                      {p.popular && (
                        <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${col.badge}`}>
                          POPULAR
                        </span>
                      )}
                      <Icon size={18} className={`mb-2 ${col.text}`} />
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{p.name}</p>
                      <p className="mt-1">
                        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{p.price}</span>
                        <span className="text-xs text-gray-400 ml-1">{p.period}</span>
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <Check size={11} className="mt-0.5 text-green-500 flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setStep('payment')}
                className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-colors ${c.btn}`}
              >
                Continue with {selectedPlan.name} — {selectedPlan.price}{selectedPlan.period}
              </button>
            </motion.div>
          )}

          {/* ── Step 2: Payment ────────────────────────────────────────────── */}
          {step === 'payment' && (
            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
              <div className="px-6 pr-14 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-gray-100">Payment details</h2>
                  <p className={`text-xs font-semibold mt-0.5 ${c.text}`}>{selectedPlan.name} — {selectedPlan.price}{selectedPlan.period}</p>
                </div>
                <button onClick={() => setStep('plans')} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline">
                  Change plan
                </button>
              </div>
              <form onSubmit={handlePay} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name on card</label>
                    <input
                      value={form.name}
                      onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((r) => ({ ...r, name: null })); }}
                      placeholder="Jonathan Bartholomew"
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 ${errors.name ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'}`}
                    />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Card number</label>
                    <div className="relative">
                      <CreditCard size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={form.card}
                        onChange={(e) => { setForm((f) => ({ ...f, card: formatCard(e.target.value) })); setErrors((r) => ({ ...r, card: null })); }}
                        placeholder="1234 5678 9012 3456"
                        className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm font-mono dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 ${errors.card ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'}`}
                      />
                    </div>
                    {errors.card && <p className="text-xs text-red-500 mt-1">{errors.card}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Expiry</label>
                    <input
                      value={form.expiry}
                      onChange={(e) => { setForm((f) => ({ ...f, expiry: formatExpiry(e.target.value) })); setErrors((r) => ({ ...r, expiry: null })); }}
                      placeholder="MM/YY"
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm font-mono dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 ${errors.expiry ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'}`}
                    />
                    {errors.expiry && <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">CVV</label>
                    <input
                      value={form.cvv}
                      onChange={(e) => { setForm((f) => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })); setErrors((r) => ({ ...r, cvv: null })); }}
                      placeholder="123"
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm font-mono dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 ${errors.cvv ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'}`}
                    />
                    {errors.cvv && <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Billing email</label>
                    <input
                      value={form.email}
                      onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setErrors((r) => ({ ...r, email: null })); }}
                      type="email"
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-500'}`}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${c.btn}`}
                >
                  <Lock size={14} />
                  Pay {selectedPlan.price}{selectedPlan.period} — Subscribe
                </button>
                <p className="text-center text-xs text-gray-400">
                  Secured checkout. Cancel anytime from Settings.
                </p>
              </form>
            </motion.div>
          )}

          {/* ── Step 3: Processing ─────────────────────────────────────────── */}
          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-20 flex flex-col items-center gap-4">
              <Loader2 size={40} className="animate-spin text-blue-500" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processing your payment…</p>
            </motion.div>
          )}

          {/* ── Step 4: Success ────────────────────────────────────────────── */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }} className="py-16 flex flex-col items-center gap-4 px-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center"
              >
                <Check size={32} className="text-green-500" />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">You're on {selectedPlan.name}!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your account has been upgraded. All {selectedPlan.name} features are now unlocked.</p>
              <button
                onClick={onClose}
                className={`mt-2 px-8 py-3 rounded-xl text-white font-semibold text-sm transition-colors ${c.btn}`}
              >
                Get started
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
