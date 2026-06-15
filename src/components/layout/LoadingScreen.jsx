import { useState } from 'react';
import { BackgroundBeams } from '../ui/background-beams';
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
      <BackgroundBeams className="absolute inset-0 h-full opacity-40 dark:opacity-30" />
      <LoaderFive text={phrase} className="relative z-10" />
    </div>
  );
}
