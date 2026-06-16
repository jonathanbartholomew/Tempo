import { useState, useEffect } from 'react';
import { LoaderFive } from '../ui/loader';
import heroBgImg from '../../assets/hero-background.jpg';

const PHRASES = [
  'Setting your Tempo...',
  'Tuning up your day...',
  'Finding your rhythm...',
];

export default function LoadingScreen({ phase = 'loading', user }) {
  const [phrase] = useState(() => PHRASES[Math.floor(Math.random() * PHRASES.length)]);
  const [loaderOpacity, setLoaderOpacity] = useState(1);
  const [greetingOpacity, setGreetingOpacity] = useState(0);
  const [screenOpacity, setScreenOpacity] = useState(1);

  const firstName = user?.name?.split(' ')[0] || '';
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  useEffect(() => {
    if (phase !== 'greeting') return;

    // Fade loader out
    setLoaderOpacity(0);
    // Fade greeting in after loader fades
    const showGreeting = setTimeout(() => setGreetingOpacity(1), 450);
    // Fade whole screen out
    const fadeScreen = setTimeout(() => setScreenOpacity(0), 1700);

    return () => { clearTimeout(showGreeting); clearTimeout(fadeScreen); };
  }, [phase]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{
        opacity: screenOpacity,
        transition: screenOpacity === 0 ? 'opacity 700ms ease-in-out' : 'none',
        background: '#05062d',
        backgroundImage: `url(${heroBgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%',
      }}
    >
      <div className="absolute inset-0 bg-[#05062d]/80" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />

      {/* Loading text */}
      <div
        className="relative z-10 text-center"
        style={{ opacity: loaderOpacity, transition: 'opacity 400ms ease-in-out', position: 'absolute' }}
      >
        <LoaderFive text={phrase} />
      </div>

      {/* Greeting text */}
      <div
        className="relative z-10 text-center space-y-2"
        style={{ opacity: greetingOpacity, transition: 'opacity 600ms ease-in-out', position: 'absolute' }}
      >
        <p className="text-xl font-light text-gray-300 tracking-wide">{timeOfDay}</p>
        <p className="text-5xl font-bold text-white tracking-tight">{firstName}</p>
        <p className="text-sm text-blue-400 mt-3 tracking-widest uppercase">Let's make today count</p>
      </div>
    </div>
  );
}
