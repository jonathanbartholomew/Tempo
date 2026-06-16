import { useState } from 'react';
import { LoaderFive } from '../ui/loader';

const PHRASES = [
  'Setting your Tempo...',
  'Tuning up your day...',
  'Finding your rhythm...',
];

export default function LoadingScreen() {
  const [phrase] = useState(() => PHRASES[Math.floor(Math.random() * PHRASES.length)]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-gray-950">
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-3xl pointer-events-none" />
      <LoaderFive text={phrase} className="relative z-10" />
    </div>
  );
}
