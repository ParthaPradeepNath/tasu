import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Clock3,
  Eye,
  LifeBuoy,
  Pencil,
  Plus,
} from "lucide-react";
import type { Metadata } from "next";
import { requireViewer } from "@/lib/session";
import { isStaff } from "@/lib/permissions";
import { getArticleBySlug, listArticles } from "@/lib/articles";
import { CATEGORY_META, CATEGORY_TONE, TONE_CLASSES } from "@/lib/status";
import { relativeTime } from "@/lib/dates";
import { extractHeadings, Markdown, readingMinutes } from "@/components/markdown";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { GlassBadge } from "@/components/liquid-glass";
import { CategoryIcon } from "@/components/tickets/category-icon";
import { ArticleFeedback, TableOfContents } from "./article-feedback";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  return { title: article?.title ?? "Article" };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const viewer = await requireViewer();
  const staff = isStaff(viewer.role);

  const article = await getArticleBySlug(slug, staff);
  if (!article) notFound();

  const related = (await listArticles({ category: article.category, limit: 5 }))
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3);

  const headings = extractHeadings(article.body);
  const minutes = readingMinutes(article.body);
  const helpfulRate =
    article.helpfulCount + article.notHelpfulCount > 0
      ? Math.round(
          (article.helpfulCount / (article.helpfulCount + article.notHelpfulCount)) *
            100,
        )
      : null;

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link
          href="/app/knowledge"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-label-2 transition-colors hover:text-label"
        >
          <ArrowLeft className="size-3.5" />
          Knowledge
        </Link>
        <span className="text-label-3" aria-hidden>
          /
        </span>
        <span
          className={cn(
            "inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[10.5px] font-medium",
            TONE_CLASSES[CATEGORY_TONE[article.category]],
          )}
        >
          <CategoryIcon category={article.category} className="size-2.5" />
          {CATEGORY_META[article.category].label}
        </span>
        {!article.isPublished && (
          <GlassBadge
            tone="warning"
            width={56}
            height={20}
            className="ml-0.5 align-middle text-[10px]"
          >
            Draft
          </GlassBadge>
        )}
        {staff && (
          <div className="ml-auto">
            <Button asChild variant="secondary" size="sm">
              <Link href={`/app/knowledge/${article.slug}/edit`}>
                <Pencil />
                Edit article
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_252px]">
        <div className="min-w-0">
          <header className="mb-5">
            <h1 className="m-0 max-w-[680px] text-[29px] font-semibold leading-[1.16] tracking-[-0.03em] text-label text-balance break-words [overflow-wrap:anywhere]">
              {article.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11.5px] text-label-3">
              <span className="flex items-center gap-1.5">
                <Avatar
                  name={article.author.name}
                  color={article.author.avatarColor}
                  size={20}
                />
                <span className="font-medium text-label-2">
                  {article.author.name}
                </span>
                {article.author.title && (
                  <span className="hidden sm:inline">· {article.author.title}</span>
                )}
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3" />
                {minutes} min read
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" />
                {article.views.toLocaleString()} views
              </span>
              <span aria-hidden>·</span>
              <span>Updated {relativeTime(article.updatedAt)}</span>
            </div>

            {article.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex h-5 items-center rounded-[5px] bg-fill px-1.5 text-[10.5px] font-medium text-label-2"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <article className="surface-card px-5 py-6 sm:px-8 sm:py-7">
            <Markdown anchors>{article.body}</Markdown>
          </article>

          <div className="mt-4">
            <ArticleFeedback
              slug={article.slug}
              helpfulCount={article.helpfulCount}
              notHelpfulCount={article.notHelpfulCount}
            />
          </div>

          {helpfulRate !== null && (
            <p className="num mt-2 px-1 text-[10.5px] text-label-3">
              {helpfulRate}% of {article.helpfulCount + article.notHelpfulCount}{" "}
              readers found this helpful
            </p>
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-[76px] lg:max-h-[calc(100dvh-92px)] lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
          <TableOfContents headings={headings} />

          <div className="surface-card overflow-clip">
            <header className="flex h-10 items-center justify-between border-b border-separator px-3.5">
              <h2 className="m-0 text-[12px] font-semibold text-label">
                More in {CATEGORY_META[article.category].label.toLowerCase()}
              </h2>
              <Link
                href="/app/knowledge"
                className="text-[10.5px] font-medium text-accent hover:underline"
              >
                All
              </Link>
            </header>
            {related.length === 0 ? (
              <p className="px-3.5 py-4 text-[11.5px] leading-5 text-label-3">
                This is the only article in this category so far.
              </p>
            ) : (
              <ul className="divide-y divide-separator">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/app/knowledge/${item.slug}`}
                      className="group flex items-start gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-surface-hover"
                    >
                      <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-fill text-label-3">
                        <BookOpen className="size-3" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] font-medium leading-4 text-label">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[10.5px] text-label-3">
                          {readingMinutes(item.body)} min read
                        </span>
                      </span>
                      <ArrowUpRight className="mt-0.5 size-3 shrink-0 text-label-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="surface-card p-3.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-7 items-center justify-center rounded-[8px] bg-accent-soft text-accent">
                <LifeBuoy className="size-3.5" />
              </span>
              <p className="m-0 text-[12px] font-medium text-label">
                Still stuck?
              </p>
            </div>
            <p className="mt-2 text-[11px] leading-4 text-label-3">
              If this didn&apos;t solve it, IT would rather hear from you than
              have you lose an afternoon.
            </p>
            <Button asChild variant="secondary" size="sm" className="mt-2.5 w-full">
              <Link href="/app/tickets/new">
                <Plus />
                Open a ticket
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
