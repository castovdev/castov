"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Shield, ArrowLeft, Lock } from "lucide-react";

function getSafeRedirectUrl(target: string | null, fallback = "/account"): string {
  if (!target) return fallback;
  const trimmed = target.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\") &&
    !trimmed.includes(":")
  ) {
    return trimmed;
  }
  return fallback;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = getSafeRedirectUrl(searchParams.get("redirectedFrom"), "/account");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(
    errorParam === "auth_callback_failed" ? "Authentication callback failed. Please try again." : null
  );
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) {
        if (user) {
          router.replace(redirectedFrom);
        } else {
          setCheckingAuth(false);
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, [supabase, router, redirectedFrom]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(redirectedFrom);
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Account created successfully. Check your email for confirmation or sign in.");
        setIsLogin(true);
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderAuth = async (provider: "google" | "github") => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectedFrom)}`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-xs font-mono text-muted">Checking authentication session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md bg-card border border-line rounded-2xl shadow-xl shadow-black/5 dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-accent/15 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex justify-between items-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-fg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-accent/10 border border-accent/20 text-accent font-medium">
            <Lock className="w-3 h-3" /> Secure Vault Auth
          </span>
        </div>

        <div className="relative z-10 text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-fg tracking-tight">
            {isLogin ? "Sign in to Castov" : "Create developer account"}
          </h1>
          <p className="text-sm text-muted mt-2">
            {isLogin
              ? "Access encrypted Team Vaults and developer workspace"
              : "Sign up to collaborate securely with your team"}
          </p>
        </div>

        {message && (
          <div className="relative z-10 mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400">
            {message}
          </div>
        )}

        {error && (
          <div className="relative z-10 mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl text-xs font-mono text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="relative z-10 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-fg mb-1.5 uppercase tracking-wide">
              Work Email
            </label>
            <input
              type="email"
              required
              className="w-full bg-field border border-line rounded-xl px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors placeholder:text-muted font-mono"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@company.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-fg mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full bg-field border border-line rounded-xl px-4 py-3 text-sm text-fg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors placeholder:text-muted font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-accent-fg hover:bg-accent-hover font-bold py-3 rounded-xl transition-all shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Authenticating..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="relative z-10 mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-line" />
          </div>
          <div className="relative flex justify-center text-xs font-medium">
            <span className="bg-card px-4 text-xs font-semibold tracking-wider text-muted uppercase">
              OR CONTINUE WITH
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => handleProviderAuth("github")}
            type="button"
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-field border border-line rounded-xl text-sm font-semibold text-fg hover:bg-hover hover:border-line transition-all cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </button>
          <button
            onClick={() => handleProviderAuth("google")}
            type="button"
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-field border border-line rounded-xl text-sm font-semibold text-fg hover:bg-hover hover:border-line transition-all cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </button>
        </div>

        <p className="relative z-10 mt-6 text-center text-sm text-muted">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-fg font-bold hover:underline ml-1 cursor-pointer"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-muted text-sm font-mono">Loading authentication...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
