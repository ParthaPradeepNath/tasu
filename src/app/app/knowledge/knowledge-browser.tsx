"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Clock3,
  Eye,
  Search,
  Sparkles,
  ThumbsUp,
  X,
} from "lucide-react";
import type { Category } from "@/generated/prisma/enums";
import { CATEGORY_META, CATEGORY_ORDER, CATEGORY_TONE, TONE_CLASSES } from "@/lib/status";
import { CategoryIcon } from "@/components/tickets/category-icon";
import { plainText, readingMinutes } from "@/components/markdown";
import { relativeTime } from "@/lib/dates";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

export type KnowledgeArticleSummary = {
  slug: string;
  title: string;
  body: string;
  category: Category;
  tags: string[];
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  updatedAt: string;
};

export function KnowledgeBrowser({
  articles,
  featured,
}: {
  articles: KnowledgeArticleSummary[];
  featured: string[];
}) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<Category | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const normalized = query.trim().toLowerCase();
  const filtered = React.useMemo(() => {
    return articles.filter((article) => {
      if (category && article.category !== category) return false;
      if (!normalized) return true;
      return `${article.title} ${article.body} ${article.tags.join(" ")}`
        .toLowerCase()
        .includes(normalized);
    });
  }, [articles, category, normalized]);

  const featuredArticles = featured
    .map((slug) => articles.find((article) => article.slug === slug))
    .filter((article): article is KnowledgeArticleSummary => Boolean(article));

  const groups = CATEGORY_ORDER.map((key) => ({
    key,
    articles: articles.filter((article) => article.category === key),
  })).filter((group) => group.articles.length > 0);

  const browsing = !normalized && !category;

  return (
    <div>
      <div className="surface-card overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3">
          <Search className="size-4 shrink-0 text-label-3" />
          <label htmlFor="knowledge-search" className="sr-only">
            Search the knowledge base
          </label>
          <input
            id="knowledge-search"
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guides, fixes, and how-tos…"
            className="h-7 w-full bg-transparent text-[14px] text-label outline-none placeholder:text-label-3"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="press inline-flex size-6 shrink-0 items-center justify-center rounded-full text-label-3 hover:bg-fill hover:text-label"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <span className="hidden shrink-0 items-center gap-1 text-[10.5px] text-label-3 sm:flex">
              <Kbd>/</Kbd> to search
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-separator bg-surface-sunken/40 px-4 py-2">
          <CategoryPill
            active={!category}
            onClick={() => setCategory(null)}
            label="All"
            count={articles.length}
          />
          {CATEGORY_ORDER.map((key) => {
            const count = articles.filter((article) => article.category === key).length;
            if (count === 0) return null;
            return (
              <CategoryPill
                key={key}
                active={category === key}
                onClick={() => setCategory(category === key ? null : key)}
                label={CATEGORY_META[key].label}
                count={count}
              />
            );
          })}
        </div>
      </div>

      {browsing ? (
        <>
          {featuredArticles.length > 0 && (
            <section className="mt-6">
              <div className="mb-2.5 flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-accent" />
                <h2 className="m-0 text-[12.5px] font-semibold text-label">
                  Most read
                </h2>
                <span className="text-[11px] text-label-3">— start here</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {featuredArticles.map((article) => (
                  <FeaturedCard key={article.slug} article={article} />
                ))}
              </div>
            </section>
          )}

          <section className="mt-7">
            <div className="mb-2.5 flex items-end justify-between gap-3">
              <h2 className="m-0 text-[12.5px] font-semibold text-label">
                Browse all
              </h2>
              <span className="num text-[11px] text-label-3">
                {articles.length} articles
              </span>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {groups.map((group) => (
                <div key={group.key} className="surface-card overflow-hidden">
                  <header className="flex h-10 items-center gap-2 border-b border-separator px-3.5">
                    <span
                      className={cn(
                        "inline-flex size-5 items-center justify-center rounded-[5px]",
                        TONE_CLASSES[CATEGORY_TONE[group.key]],
                      )}
                    >
                      <CategoryIcon category={group.key} className="size-3" />
                    </span>
                    <h3 className="m-0 text-[12px] font-semibold text-label">
                      {CATEGORY_META[group.key].label}
                    </h3>
                    <span className="num ml-auto text-[10.5px] text-label-3">
                      {group.articles.length}
                    </span>
                  </header>
                  <ul className="divide-y divide-separator">
                    {group.articles.map((article) => (
                      <li key={article.slug}>
                        <ArticleRow article={article} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="mt-6">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <h2 className="m-0 text-[12.5px] font-semibold text-label">
              {normalized
                ? `${filtered.length} ${filtered.length === 1 ? "result" : "results"} for “${query.trim()}”`
                : `${CATEGORY_META[category!].label} · ${filtered.length} articles`}
            </h2>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory(null);
              }}
              className="press text-[11.5px] font-medium text-accent hover:underline"
            >
              Clear
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="surface-card flex flex-col items-center px-6 py-14 text-center">
              <span className="mb-4 inline-flex size-11 items-center justify-center rounded-[12px] bg-fill text-label-3">
                <Search className="size-4.5" />
              </span>
              <h3 className="m-0 text-[14px] font-medium text-label">
                No articles match
              </h3>
              <p className="mt-1 max-w-[320px] text-[12.5px] leading-5 text-label-2">
                Try a shorter search, or open a ticket and IT will write the
                answer for next time.
              </p>
              <Link
                href="/app/tickets/new"
                className="press mt-4 inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-accent px-3 text-[12px] font-medium text-white"
              >
                Open a ticket
              </Link>
            </div>
          ) : (
            <div className="surface-card overflow-hidden">
              <ul className="divide-y divide-separator">
                {filtered.map((article) => (
                  <li key={article.slug}>
                    <ArticleRow article={article} expanded />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function CategoryPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "press inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium transition-colors duration-150",
        active
          ? "bg-surface-solid text-label shadow-[0_1px_2px_rgba(0,0,0,0.07)]"
          : "text-label-2 hover:bg-fill hover:text-label",
      )}
    >
      {label}
      <span className={cn("num text-[10px]", active ? "text-label-3" : "text-label-3")}>
        {count}
      </span>
    </button>
  );
}

function FeaturedCard({ article }: { article: KnowledgeArticleSummary }) {
  return (
    <Link
      href={`/app/knowledge/${article.slug}`}
      className="surface-card group flex min-h-[150px] flex-col p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)]"
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-[8px]",
            TONE_CLASSES[CATEGORY_TONE[article.category]],
          )}
        >
          <CategoryIcon category={article.category} className="size-3.5" />
        </span>
        <span className="text-[10.5px] font-medium uppercase tracking-[0.05em] text-label-3">
          {CATEGORY_META[article.category].label}
        </span>
        <ArrowUpRight className="ml-auto size-3.5 text-label-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <h3 className="mt-3 text-[14px] font-semibold leading-[1.35] tracking-[-0.015em] text-label">
        {article.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-[1.55] text-label-2">
        {plainText(article.body, 120)}
      </p>
      <div className="mt-auto flex items-center gap-3 pt-3 text-[10.5px] text-label-3">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="size-3" />
          {readingMinutes(article.body)} min
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="size-3" />
          {article.views.toLocaleString()}
        </span>
        <span className="inline-flex items-center gap-1">
          <ThumbsUp className="size-3" />
          {article.helpfulCount}
        </span>
      </div>
    </Link>
  );
}

function ArticleRow({
  article,
  expanded = false,
}: {
  article: KnowledgeArticleSummary;
  expanded?: boolean;
}) {
  return (
    <Link
      href={`/app/knowledge/${article.slug}`}
      className="group flex items-start gap-3 px-3.5 py-3 transition-colors duration-150 hover:bg-surface-hover"
    >
      <span
        className={cn(
          "mt-px inline-flex size-6 shrink-0 items-center justify-center rounded-[6px]",
          TONE_CLASSES[CATEGORY_TONE[article.category]],
        )}
      >
        <CategoryIcon category={article.category} className="size-3" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-medium leading-[1.4] text-label">
          {article.title}
        </span>
        {expanded && (
          <span className="mt-0.5 line-clamp-1 block text-[11.5px] leading-[1.5] text-label-2">
            {plainText(article.body, 160)}
          </span>
        )}
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-label-3">
          <span>{CATEGORY_META[article.category].label}</span>
          <span aria-hidden>·</span>
          <span suppressHydrationWarning>
            updated {relativeTime(article.updatedAt)}
          </span>
          <span aria-hidden>·</span>
          <span className="num">{article.views.toLocaleString()} views</span>
          {article.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="inline-flex h-4 items-center rounded-[4px] bg-fill px-1 text-[9.5px] font-medium text-label-2"
            >
              {tag}
            </span>
          ))}
        </span>
      </span>
      <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-label-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
    </Link>
  );
}
