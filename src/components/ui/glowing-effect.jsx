import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export function GlowingEffect({ active, className }) {
  return (
    <motion.div
      aria-hidden="true"
      animate={{ opacity: active ? 1 : 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className={cn('pointer-events-none absolute -inset-2 -z-10 rounded-[inherit] blur-2xl', className)}
      style={{
        background:
          'radial-gradient(circle at 25% 25%, #60a5fa 0%, transparent 50%), ' +
          'radial-gradient(circle at 75% 75%, #2563eb 0%, transparent 50%), ' +
          'radial-gradient(circle at 75% 25%, #38bdf8 0%, transparent 50%), ' +
          'radial-gradient(circle at 25% 75%, #1d4ed8 0%, transparent 50%)',
      }}
    />
  );
}
