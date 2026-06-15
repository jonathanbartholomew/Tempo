import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export function LoaderFive({ text, className }) {
  return (
    <div className="font-sans font-bold">
      <motion.div
        animate={{ backgroundPosition: ['200% center', '-200% center'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className={cn(
          'bg-clip-text text-transparent bg-[length:200%_100%]',
          'bg-gradient-to-r from-gray-400 via-gray-900 to-gray-400',
          'dark:from-gray-600 dark:via-white dark:to-gray-600',
          'text-xl sm:text-2xl md:text-3xl',
          className
        )}
      >
        {text}
      </motion.div>
    </div>
  );
}
