import Link from "next/link";

import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function WorkspaceNotFound() {
  return (
    <div className="mx-auto flex max-w-[420px] flex-col items-center py-24 text-center">
      <span className="bg-fill text-label-3 inline-flex size-11 items-center justify-center rounded-[12px]">
        <Compass className="size-5" />
      </span>
      <h1 className="text-label mt-4 text-[17px] font-semibold tracking-[-0.02em]">
        Page not found
      </h1>
      <p className="text-label-2 mt-1.5 text-[12.5px] leading-5">
        That page doesn&apos;t exist, or it moved. Try the overview or search
        with ⌘K.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <Button asChild variant="secondary" size="md">
          <Link href="/app/tickets">My tickets</Link>
        </Button>
        <Button asChild variant="primary" size="md">
          <Link href="/app">Overview</Link>
        </Button>
      </div>
    </div>
  );
}
