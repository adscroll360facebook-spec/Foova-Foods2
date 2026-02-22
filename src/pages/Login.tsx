import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, AlertCircle, Send, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SENDER_EMAIL = "foovafoods@gmail.com";
const RESET_COOLDOWN = 60; // seconds between reset link requests

const Login = () => {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // After 1 failed attempt → show forgot password
  const [failCount, setFailCount] = useState(0);
  const showForgot = failCount >= 1;

  // Forgot password flow
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [cooldown]);

  // Pre-fill forgot email from login email field
  useEffect(() => {
    if (forgotOpen && !forgotEmail && email) setForgotEmail(email);
  }, [forgotOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) {
      setFailCount((c) => c + 1);
      // Friendlier error messages
      if (result.error.toLowerCase().includes("invalid login") || result.error.toLowerCase().includes("invalid credentials")) {
        setError("Incorrect email or password. Please try again.");
      } else {
        setError(result.error);
      }
    } else {
      navigate("/");
    }
  };

  const handleSendResetLink = async () => {
    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (cooldown > 0) return;

    setForgotLoading(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);

    if (resetErr) {
      toast.error(resetErr.message);
      return;
    }

    setForgotSent(true);
    setCooldown(RESET_COOLDOWN);
    toast.success(`Reset link sent to ${forgotEmail}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome <span className="gold-text">Back</span>
          </h1>
          <p className="text-muted-foreground text-sm">Sign in to your FOOVA FOODS account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-foreground/80 block mb-1.5">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                required
                className="w-full px-4 py-3 pl-11 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                placeholder="you@example.com"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-foreground/80 block mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                required
                className={`w-full px-4 py-3 rounded-xl bg-secondary border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 pr-12 ${error ? "border-red-500 focus:ring-red-500/50" : "border-border focus:ring-accent/50"
                  }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-start gap-2 text-red-400 text-sm bg-red-950/20 border border-red-800/40 px-4 py-2.5 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* After 1 wrong attempt → show Forgot Password link inline */}
          <AnimatePresence>
            {showForgot && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => { setForgotOpen(true); setForgotSent(false); }}
                  className="text-sm text-accent hover:underline flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  Forgot your password? Send reset link
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-accent text-accent-foreground font-semibold rounded-full hover:shadow-[0_0_30px_hsl(43_85%_55%/0.4)] transition-shadow disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                Signing in...
              </span>
            ) : "Sign In"}
          </button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Don't have an account?{" "}
          <Link to="/signup" className="text-accent hover:underline">Sign up</Link>
        </p>
      </motion.div>

      {/* ── Forgot Password Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {forgotOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setForgotOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card p-8 w-full max-w-md shadow-2xl"
            >
              {forgotSent ? (
                /* Success State */
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-2">Check Your Email!</h2>
                  <p className="text-muted-foreground text-sm mb-1">
                    A password reset link was sent to:
                  </p>
                  <p className="text-accent font-semibold mb-4">{forgotEmail}</p>
                  <p className="text-muted-foreground text-xs mb-6">
                    Sent from <span className="text-foreground font-medium">{SENDER_EMAIL}</span>.
                    Check your spam folder if you don't see it within a minute.
                  </p>
                  <div className="flex gap-3">
                    {cooldown > 0 ? (
                      <button
                        disabled
                        className="flex-1 py-2.5 bg-secondary text-muted-foreground rounded-full text-sm font-medium"
                      >
                        Resend in {cooldown}s
                      </button>
                    ) : (
                      <button
                        onClick={() => { setForgotSent(false); }}
                        className="flex-1 py-2.5 bg-secondary text-foreground rounded-full text-sm font-medium hover:bg-secondary/80"
                      >
                        Send Again
                      </button>
                    )}
                    <button
                      onClick={() => setForgotOpen(false)}
                      className="flex-1 py-2.5 bg-accent text-accent-foreground rounded-full text-sm font-semibold"
                    >
                      Back to Login
                    </button>
                  </div>
                </div>
              ) : (
                /* Email Input State */
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                      <Send className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-bold">Reset Password</h2>
                      <p className="text-xs text-muted-foreground">
                        Link sent from <span className="text-accent">{SENDER_EMAIL}</span>
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mb-5">
                    Enter your account email and we'll send you a secure password reset link.
                  </p>
                  <div className="mb-5">
                    <label className="text-sm font-medium block mb-1.5">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 pl-11 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                        autoFocus
                      />
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setForgotOpen(false)}
                      className="flex-1 py-3 bg-secondary text-foreground rounded-full font-medium text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendResetLink}
                      disabled={forgotLoading || cooldown > 0}
                      className="flex-1 py-3 bg-accent text-accent-foreground rounded-full font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {forgotLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : cooldown > 0 ? (
                        `Resend in ${cooldown}s`
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Send Reset Link
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Login;
