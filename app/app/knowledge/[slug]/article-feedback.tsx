"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { voteArticle, markArticleView } from "@/app/app/actions";
import { useWebHaptics } from "@/hooks/use-web-haptics";
import { cn } from "@/lib/utils";

export function ArticleFeedback({
  slug,
  helpfulCount,
  notHelpfulCount,
}: {
  slug: string;
  helpfulCount: number;
  notHelpfulCount: number;
}) {
  const [vote, setVote] = React.useState<"up" | "down" | null>(null);
  const [counts, setCounts] = React.useState({
    up: helpfulCount,
    down: notHelpfulCount,
  });
  const [pending, startTransition] = React.useTransition();
  const { triggerHaptic } = useWebHaptics();

  React.useEffect(() => {
    const key = `tasu.viewed.${slug}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    void markArticleView(slug);
  }, [slug]);

  function cast(next: "up" | "down") {
    if (vote || pending) return;
    triggerHaptic("success");
    setVote(next);
    setCounts((current) => ({
      up: current.up + (next === "up" ? 1 : 0),
      down: current.down + (next === "down" ? 1 : 0),
    }));
    startTransition(async () => {
      await voteArticle(slug, next === "up");
    });
  }

  return (
    <div className="surface-card px-4 py-3.5">
      <motion.div
        key={vote ?? "ask"}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-center gap-3"
      >
        {vote ? (
          <>
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="inline-flex size-7 items-center justify-center rounded-full bg-success-soft text-success"
            >
              <Check className="size-3.5" />
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[12.5px] font-medium text-label">
                Thanks for the feedback
              </p>
              <p className="m-0 mt-0.5 text-[11px] text-label-3">
                {vote === "up"
                  ? "Glad it helped. IT sees which guides actually work."
                  : "Noted — this article is flagged for a rewrite."}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1">
              <p className="m-0 text-[12.5px] font-medium text-label">
                Did this answer your question?
              </p>
              <p className="m-0 mt-0.5 text-[11px] text-label-3">
                {counts.up} people found this helpful
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => cast("up")}
                className="press inline-flex h-7 items-center gap-1.5 rounded-[7px] border border-separator bg-surface-solid px-2.5 text-[11.5px] font-medium text-label-2 hover:border-success/40 hover:bg-success-soft hover:text-success"
              >
                <ThumbsUp className="size-3" />
                Yes
              </button>
              <button
                type="button"
                onClick={() => cast("down")}
                className="press inline-flex h-7 items-center gap-1.5 rounded-[7px] border border-separator bg-surface-solid px-2.5 text-[11.5px] font-medium text-label-2 hover:border-danger/40 hover:bg-danger-soft hover:text-danger"
              >
                <ThumbsDown className="size-3" />
                Not quite
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export function TableOfContents({
  headings,
}: {
  headings: { id: string; text: string; level: 2 | 3 }[];
}) {
  const [active, setActive] = React.useState(headings[0]?.id ?? "");

  React.useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-84px 0px -65% 0px", threshold: [0, 1] },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div className="surface-card overflow-clip">
      <header className="flex h-10 items-center border-b border-separator px-3.5">
        <h2 className="m-0 text-[12px] font-semibold text-label">On this page</h2>
      </header>
      <nav aria-label="Table of contents" className="p-2">
        <ul className="space-y-0.5">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={active === heading.id ? "location" : undefined}
                className={cn(
                  "block rounded-[6px] py-1 pr-2 text-[11.5px] leading-[1.45] transition-colors duration-100",
                  heading.level === 3 ? "pl-5" : "pl-2",
                  active === heading.id
                    ? "bg-accent-soft font-medium text-accent"
                    : "text-label-2 hover:bg-surface-hover hover:text-label",
                )}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
