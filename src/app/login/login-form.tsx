"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, Loader2, LockKeyhole, TriangleAlert } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo, Wordmark } from "@/components/brand";
import { GlassButton, GlassCard } from "@/components/liquid-glass";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

const DEMOS = [
  {
    role: "Employee",
    name: "Parth Shah",
    email: "parth@tasu.app",
    note: "Requests support",
  },
  {
    role: "Agent",
    name: "Priya Nair",
    email: "priya@tasu.app",
    note: "Works the queue",
  },
  {
    role: "Admin",
    name: "Sam Okafor",
    email: "admin@tasu.app",
    note: "IT manager",
  },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = React.useState("parth@tasu.app");
  const [password, setPassword] = React.useState("tasu-demo");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function signIn(nextEmail = email, nextPassword = password) {
    setError(null);
    setLoading(true);
    const result = await authClient.signIn.email({
      email: nextEmail,
      password: nextPassword,
    });

    if (result.error) {
      setError(
        result.error.message ??
          "That didn't work. Check your email and password and try again.",
      );
      setLoading(false);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("tasu-demo");
    setError(null);
    void signIn(demoEmail, "tasu-demo");
  }

  return (
    <div className="relative z-10 w-full max-w-[404px]">
      <div className="mb-7 flex flex-col items-center gap-3">
        <Logo size={44} />
        <div className="flex items-baseline gap-1.5">
          <Wordmark className="text-[17px]" />
          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-label-3">
            Help desk
          </span>
        </div>
      </div>

      <GlassCard tint={0.72} blur={18} className="rounded-[22px] p-7">
        <div className="mb-6">
          <h1 className="m-0 text-[21px] font-semibold tracking-[-0.025em] text-label">
            Sign in to Tasu
          </h1>
          <p className="mt-1 text-[13px] leading-5 text-label-2">
            Support, handled. Use your work account to continue.
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void signIn();
          }}
        >
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-[12px] font-medium text-label-2"
            >
              Work email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@tasu.app"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-10 rounded-[10px] px-3 text-[13.5px]"
              aria-invalid={Boolean(error)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <label
                htmlFor="password"
                className="block text-[12px] font-medium text-label-2"
              >
                Password
              </label>
              <span className="text-[11px] text-label-3">Demo password: tasu-demo</span>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 rounded-[10px] px-3 text-[13.5px]"
              aria-invalid={Boolean(error)}
              required
              minLength={8}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-[9px] bg-danger-soft px-3 py-2.5 text-[12px] leading-4 text-danger"
            >
              <TriangleAlert className="mt-px size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <GlassButton
            type="submit"
            material="tinted"
            size="lg"
            className="w-full justify-between rounded-[12px] border border-white/15 bg-accent text-white"
            disabled={loading}
          >
            <span className="flex items-center gap-2">
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LockKeyhole className="size-4" />
              )}
              {loading ? "Signing in…" : "Sign in"}
            </span>
            <Kbd className="border-white/20 bg-white/10 text-white/70">
              <CornerDownLeft className="size-2.5" />
            </Kbd>
          </GlassButton>
        </form>

        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="eyebrow">Demo accounts</span>
            <span className="h-px flex-1 bg-separator" />
          </div>
          <div className="grid gap-1.5">
            {DEMOS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => fillDemo(demo.email)}
                disabled={loading}
                className={cn(
                  "group flex h-10 w-full items-center gap-2.5 rounded-[9px] border border-transparent px-2 text-left transition-[background-color,border-color] duration-100 hover:border-separator hover:bg-fill disabled:opacity-50",
                )}
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-fill text-[10px] font-semibold text-label-2">
                  {demo.role[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12.5px] font-medium leading-4 text-label">
                    {demo.role}
                    <span className="ml-1.5 font-normal text-label-3">
                      {demo.name}
                    </span>
                  </span>
                  <span className="block text-[11px] leading-4 text-label-3">
                    {demo.note}
                  </span>
                </span>
                <ArrowRight className="size-3.5 text-label-3 opacity-0 transition-opacity duration-100 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <p className="mt-5 text-center text-[11.5px] text-label-3">
        Trouble signing in? Ask IT — or open a ticket once you&apos;re in.
      </p>
    </div>
  );
}
