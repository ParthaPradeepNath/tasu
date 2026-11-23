import Link from "next/link";

import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ArticleNotFound() {
  return (
    <div className="mx-auto flex max-w-[420px] flex-col items-center py-24 text-center">
      <span className="bg-fill text-label-3 inline-flex size-11 items-center justify-center rounded-[12px]">
        <FileQuestion className="size-5" />
      </span>
      <h1 className="text-label mt-4 text-[17px] font-semibold tracking-[-0.02em]">
        Article not found
      </h1>
      <p className="text-label-2 mt-1.5 text-[12.5px] leading-5">
        This guide may have been unpublished or renamed. Search the knowledge
        base, or ask IT directly.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <Button asChild variant="secondary" size="md">
          <Link href="/app/knowledge">Knowledge</Link>
        </Button>
        <Button asChild variant="primary" size="md">
          <Link href="/app/tickets/new">Open a ticket</Link>
        </Button>
      </div>
    </div>
  );
}
