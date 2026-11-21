"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Viewer } from "@/lib/session";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

export function GlobalShortcuts({ user }: { user: Viewer }) {
  const router = useRouter();

  React.useEffect(() => {
    let goPending = false;
    let goTimer: ReturnType<typeof setTimeout> | undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (document.querySelector("[cmdk-dialog]")) return;

      const key = event.key.toLowerCase();

      if (goPending) {
        goPending = false;
        if (goTimer) clearTimeout(goTimer);
        if (key === "q") {
          event.preventDefault();
          router.push(user.role === "employee" ? "/app/tickets" : "/app/queue");
        }
        if (key === "k") {
          event.preventDefault();
          router.push("/app/knowledge");
        }
        if (key === "i") {
          event.preventDefault();
          router.push("/app/inbox");
        }
        return;
      }

      if (key === "g") {
        goPending = true;
        goTimer = setTimeout(() => {
          goPending = false;
        }, 900);
        return;
      }

      if (key === "c" && !event.shiftKey) {
        event.preventDefault();
        router.push("/app/tickets/new");
        return;
      }

      if (event.key === "/") {
        const input = document.querySelector<HTMLInputElement>(
          "[data-search-input]",
        );
        if (input) {
          event.preventDefault();
          input.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (goTimer) clearTimeout(goTimer);
    };
  }, [router, user.role]);

  return null;
}
