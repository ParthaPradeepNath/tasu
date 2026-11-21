"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-[460px] flex-col items-center py-24 text-center">
      <span className="inline-flex size-11 items-center justify-center rounded-[12px] bg-danger-soft text-danger">
        <TriangleAlert className="size-5" />
      </span>
      <h1 className="mt-4 text-[17px] font-semibold tracking-[-0.02em] text-label">
        Something went wrong
      </h1>
      <p className="mt-1.5 text-[12.5px] leading-5 text-label-2">
        The page hit an unexpected error. Your data is safe — try again, or head
        back to the overview.
      </p>
      {error.digest && (
        <p className="num mt-2 font-mono text-[10.5px] text-label-3">
          {error.digest}
        </p>
      )}
      <div className="mt-5 flex items-center gap-2">
        <Button variant="secondary" size="md" onClick={() => reset()}>
          <RotateCcw />
          Try again
        </Button>
        <Button asChild variant="primary" size="md">
          <Link href="/app">Overview</Link>
        </Button>
      </div>
    </div>
  );
}
