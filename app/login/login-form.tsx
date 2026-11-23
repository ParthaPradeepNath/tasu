"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import {
  ArrowRight,
  CornerDownLeft,
  Loader2,
  LockKeyhole,
  TriangleAlert,
} from "lucide-react";

import { Logo, Wordmark } from "@/components/brand";
import { GlassButton, GlassCard } from "@/components/liquid-glass";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { useWebHaptics } from "@/hooks/use-web-haptics";
import { authClient } from "@/lib/auth-client";

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
  const { triggerHaptic } = useWebHaptics();

  async function signIn(nextEmail = email, nextPassword = password) {
    setError(null);
    setLoading(true);
    const result = await authClient.signIn.email({
      email: nextEmail,
      password: nextPassword,
    });

    if (result.error) {
      triggerHaptic("error");
      setError(
        result.error.message ??
          "That didn't work. Check your email and password and try again."
      );
      setLoading(false);
      return;
    }

    triggerHaptic("success");
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
          <span className="text-label-3 text-[11px] font-medium tracking-[0.12em] uppercase">
            Help desk
          </span>
        </div>
      </div>

      <GlassCard tint={0.72} blur={18} className="rounded-[22px] p-7">
        <div className="mb-6">
          <h1 className="text-label m-0 text-[21px] font-semibold tracking-[-0.025em]">
            Sign in to Tasu
          </h1>
          <p className="text-label-2 mt-1 text-[13px] leading-5">
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
              className="text-label-2 block text-[12px] font-medium"
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
                className="text-label-2 block text-[12px] font-medium"
              >
                Password
              </label>
              <span className="text-label-3 text-[11px]">
                Demo password: tasu-demo
              </span>
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
              className="bg-danger-soft text-danger flex items-start gap-2 rounded-[9px] px-3 py-2.5 text-[12px] leading-4"
            >
              <TriangleAlert className="mt-px size-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <GlassButton
            type="submit"
            material="tinted"
            size="lg"
            className="bg-accent w-full justify-between rounded-[12px] border border-white/15 text-white"
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
            <span className="bg-separator h-px flex-1" />
          </div>
          <div className="grid gap-1.5">
            {DEMOS.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => fillDemo(demo.email)}
                disabled={loading}
                className="press group hover:border-separator hover:bg-fill flex h-10 w-full items-center gap-2.5 rounded-[9px] border border-transparent px-2 text-left disabled:opacity-50"
              >
                <span className="bg-fill text-label-2 flex size-6 items-center justify-center rounded-full text-[10px] font-semibold">
                  {demo.role[0]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-label block text-[12.5px] leading-4 font-medium">
                    {demo.role}
                    <span className="text-label-3 ml-1.5 font-normal">
                      {demo.name}
                    </span>
                  </span>
                  <span className="text-label-3 block text-[11px] leading-4">
                    {demo.note}
                  </span>
                </span>
                <ArrowRight className="nudge text-label-3 size-3.5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" />
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      <p className="text-label-3 mt-5 text-center text-[11.5px]">
        Trouble signing in? Ask IT — or open a ticket once you&apos;re in.
      </p>
    </div>
  );
}
