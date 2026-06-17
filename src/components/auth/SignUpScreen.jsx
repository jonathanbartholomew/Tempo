import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import logoDark from "../../assets/tempo-logo-dark-mode.png";
import heroBgImg from "../../assets/hero-background.jpg";
import { GoogleIcon } from "../ui/google-icon";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

export default function SignUpScreen({ onGoogleLogin, onRegister, onBack, onSignIn }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const googleLogin = useGoogleLogin({
    scope: `openid email profile ${CALENDAR_SCOPE}`,
    onSuccess: async (tokenResponse) => {
      try {
        await onGoogleLogin(tokenResponse);
      } catch {
        setError("Google sign-up failed. Please try again.");
      }
    },
    onError: () => setError("Google sign-up failed. Please try again."),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }

    setLoading(true);
    try {
      await onRegister(name.trim(), email.trim(), password);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Left: branding panel */}
      <div
        className="hidden lg:flex relative w-1/2 items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroBgImg})`,
          backgroundSize: "cover",
          backgroundPosition: "right 20%",
        }}
      >
        <button onClick={onBack} className="relative z-10">
          <img src={logoDark} alt="Tempo" className="h-64 w-auto drop-shadow-lg" />
        </button>
      </div>

      {/* Right: sign-up form */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-16 overflow-y-auto">
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
            <h1 className="text-3xl font-bold text-white">Create account</h1>
            <p className="mt-2 text-sm text-gray-400">Get started with Tempo for free.</p>
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
            or sign up with email
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-gray-300 mb-2">
                Full name
              </label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                autoComplete="name"
                className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-gray-300 mb-2">
                Password <span className="text-gray-500 font-normal">(min 8 characters)</span>
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="signup-confirm" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm password
              </label>
              <input
                id="signup-confirm"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl bg-gray-800/80 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shadow-lg transition-colors"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Create account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{" "}
            <button onClick={onSignIn} className="font-semibold text-white hover:text-blue-400 transition-colors">
              Sign in
            </button>
          </p>

          <p className="mt-10 text-center text-xs text-gray-500">© Tempo · Privacy · Terms</p>
        </div>
      </div>
    </div>
  );
}
