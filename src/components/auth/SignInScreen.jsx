import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { ArrowLeft } from 'lucide-react';
import logoDark from '../../assets/tempo-logo-dark-mode.png';
import { BackgroundBeams } from '../ui/background-beams';
import { GoogleIcon } from '../ui/google-icon';

const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

export default function SignInScreen({ onLogin, onBack }) {
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

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
    <div className="min-h-screen flex bg-gray-950">
      {/* Left: branding panel with tracing beams */}
      <div className="hidden lg:flex relative w-1/2 items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900">
        <BackgroundBeams className="absolute inset-0 h-full scale-150" />
        <button onClick={onBack} className="relative z-10">
          <img src={logoDark} alt="Tempo" className="h-64 w-auto drop-shadow-lg" />
        </button>
      </div>

      {/* Right: sign-in form */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-16">
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to home
        </button>

        <div className="w-full max-w-sm">
          <button onClick={onBack} className="lg:hidden mb-8 flex items-center justify-center w-full">
            <img src={logoDark} alt="Tempo" className="h-12 w-auto" />
          </button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">Sign in</h1>
            <p className="mt-2 text-sm text-gray-400">Welcome back! Please sign in to continue.</p>
          </div>

          <button
            onClick={() => googleLogin()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-800/80 hover:bg-gray-800 border border-gray-700 text-white text-sm font-semibold transition-colors"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-gray-500">
            <div className="h-px flex-1 bg-gray-800" />
            or
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          <label htmlFor="signin-email" className="block text-sm font-medium text-gray-300 mb-2">
            Email address
          </label>
          <input
            id="signin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hello@app.com"
            className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="button"
            className="mt-4 w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-lg transition-colors"
          >
            Continue
          </button>

          {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}

          <p className="mt-6 text-center text-sm text-gray-400">
            Don&apos;t have an account? <span className="font-semibold text-white">Sign up</span>
          </p>

          <p className="mt-10 text-center text-xs text-gray-500">
            © Tempo · Privacy · Terms
          </p>
        </div>
      </div>
    </div>
  );
}
