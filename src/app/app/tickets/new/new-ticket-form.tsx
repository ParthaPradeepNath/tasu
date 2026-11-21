"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  BookOpen,
  Check,
  CornerDownLeft,
  Loader2,
  Plus,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { createTicket, type ActionState } from "@/app/app/actions";
import type { Category, Priority } from "@/generated/prisma/enums";
import { CATEGORY_META, CATEGORY_ORDER, PRIORITY_META, PRIORITY_ORDER } from "@/lib/status";
import { SLA_TARGETS } from "@/lib/sla";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { PropertySelect, type SelectOption } from "@/components/ui/property-select";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

type Article = {
  slug: string;
  title: string;
  category: Category;
  tags: string[];
};

const initialState: ActionState = { error: null };

const CATEGORY_OPTIONS: SelectOption[] = CATEGORY_ORDER.map((category) => ({
  value: category,
  label: CATEGORY_META[category].label,
}));

const PRIORITY_OPTIONS: SelectOption[] = PRIORITY_ORDER.map((priority) => ({
  value: priority,
  label: PRIORITY_META[priority].label,
  hint:
    priority === "URGENT"
      ? "1h response · 8h resolve"
      : priority === "HIGH"
        ? "4h response · 24h resolve"
        : priority === "MEDIUM"
          ? "8h response · 48h resolve"
          : priority === "LOW"
            ? "24h response · 72h resolve"
            : "48h response · 96h resolve",
}));

export function NewTicketForm({
  articles,
  requesterName,
}: {
  articles: Article[];
  requesterName: string;
}) {
  const [state, formAction] = useActionState(createTicket, initialState);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<Category>("OTHER");
  const [priority, setPriority] = React.useState<Priority>("MEDIUM");
  const [tags, setTags] = React.useState<string[]>([]);
  const [mode, setMode] = React.useState<"write" | "preview">("write");
  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);

  const related = React.useMemo(() => {
    const words = title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 3);
    if (words.length === 0) return [];
    return articles
      .map((article) => {
        const haystack = `${article.title} ${article.tags.join(" ")}`.toLowerCase();
        const score = words.reduce(
          (total, word) => total + (haystack.includes(word) ? 1 : 0),
          0,
        );
        return { article, score };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((row) => row.article);
  }, [articles, title]);

  function insertArticle(article: Article) {
    setDescription((value) =>
      `${value}${value.trim() ? "\n\n" : ""}Possibly related: [${article.title}](/app/knowledge/${article.slug})`,
    );
    setMode("write");
    requestAnimationFrame(() => descriptionRef.current?.focus());
  }

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        const form = document.getElementById("new-ticket-form") as HTMLFormElement | null;
        form?.requestSubmit();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const sla = SLA_TARGETS[priority];

  return (
    <form
      id="new-ticket-form"
      action={formAction}
      className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]"
    >
      <div className="surface-card overflow-hidden">
        <div className="px-5 pt-5">
          <label htmlFor="title" className="sr-only">
            Title
          </label>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What's going wrong?"
            maxLength={140}
            autoFocus
            required
            className="w-full bg-transparent text-[20px] font-semibold leading-7 tracking-[-0.02em] text-label outline-none placeholder:text-label-3"
          />
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-label-3">
            <span>Opened by {requesterName}</span>
            <span aria-hidden>·</span>
            <span>IT typically replies within {sla.firstResponseHours}h</span>
            <span className="num ml-auto">{title.length}/140</span>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mx-5 mt-4 rounded-[10px] border border-accent/15 bg-accent-soft/60 p-2.5">
            <p className="mb-1.5 flex items-center gap-1.5 px-0.5 text-[10.5px] font-medium uppercase tracking-[0.05em] text-accent">
              <Sparkles className="size-3" />
              Might already be answered
            </p>
            <div className="grid gap-0.5">
              {related.map((article) => (
                <div
                  key={article.slug}
                  className="flex items-center gap-2 rounded-[6px] px-1.5 py-1 transition-colors hover:bg-surface-solid/60"
                >
                  <BookOpen className="size-3 shrink-0 text-accent/70" />
                  <Link
                    href={`/app/knowledge/${article.slug}`}
                    target="_blank"
                    className="min-w-0 flex-1 truncate text-[12px] font-medium text-label hover:text-accent"
                  >
                    {article.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => insertArticle(article)}
                    className="press shrink-0 rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-medium text-accent hover:bg-accent-soft-strong"
                  >
                    Reference
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-1 border-y border-separator bg-surface-sunken/40 px-4 py-1.5">
          <TabButton active={mode === "write"} onClick={() => setMode("write")}>
            Write
          </TabButton>
          <TabButton
            active={mode === "preview"}
            onClick={() => setMode("preview")}
            disabled={!description.trim()}
          >
            Preview
          </TabButton>
          <span className="ml-auto hidden items-center gap-1 text-[10.5px] text-label-3 sm:flex">
            Markdown supported
          </span>
        </div>

        <div className="relative">
          {mode === "write" ? (
            <>
              <label htmlFor="description" className="sr-only">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                ref={descriptionRef}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What happened? What have you tried? Anything that would help IT reproduce it…"
                required
                minLength={12}
                className="min-h-[240px] w-full resize-y bg-transparent px-5 py-4 text-[13.5px] leading-6 text-label outline-none placeholder:text-label-3"
              />
            </>
          ) : (
            <div className="min-h-[240px] px-5 py-4">
              <Markdown>{description}</Markdown>
            </div>
          )}
        </div>

        {state.error && (
          <div
            role="alert"
            className="mx-5 mb-4 flex items-start gap-2 rounded-[9px] bg-danger-soft px-3 py-2.5 text-[12px] leading-4 text-danger"
          >
            <TriangleAlert className="mt-px size-3.5 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <div className="sticky bottom-0 flex items-center gap-2 border-t border-separator bg-[color-mix(in_srgb,var(--surface-solid)_92%,transparent)] px-4 py-3 backdrop-blur-xl">
          <span className="hidden text-[11px] text-label-3 sm:block">
            You&apos;ll get an email and an in-app update on every reply.
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="md">
              <Link href="/app/tickets">Cancel</Link>
            </Button>
            <SubmitButton />
          </div>
        </div>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-[76px]">
        <div className="surface-card overflow-hidden">
          <header className="flex h-10 items-center border-b border-separator px-3.5">
            <h2 className="m-0 text-[12px] font-semibold text-label">Properties</h2>
          </header>
          <div className="space-y-3 p-3.5">
            <div>
              <p className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.055em] text-label-3">
                Category
              </p>
              <div className="flex flex-wrap gap-1.5">
                <PropertySelect
                  variant="pill"
                  label="Category"
                  value={category}
                  options={CATEGORY_OPTIONS}
                  onChange={(value) => setCategory(value as Category)}
                />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.055em] text-label-3">
                Priority
              </p>
              <PropertySelect
                variant="pill"
                label="Priority"
                value={priority}
                options={PRIORITY_OPTIONS}
                onChange={(value) => setPriority(value as Priority)}
                align="start"
              />
            </div>

            <TagEditor tags={tags} onChange={setTags} />

            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="priority" value={priority} />
            <input type="hidden" name="tags" value={tags.join(",")} />
          </div>
        </div>

        <div className="surface-card p-3.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-7 items-center justify-center rounded-[8px] bg-warning-soft text-warning">
              <Check className="size-3.5" />
            </span>
            <div>
              <p className="m-0 text-[12px] font-medium text-label">
                Response target
              </p>
              <p className="m-0 text-[11px] text-label-3">
                {sla.firstResponseHours}h first reply · {sla.resolveHours}h resolve
              </p>
            </div>
          </div>
          <p className="mt-2.5 text-[11px] leading-4 text-label-3">
            Targets scale with priority. If it&apos;s blocking your work, say so
            in the description.
          </p>
        </div>

        <p className="px-1 text-[11px] leading-4 text-label-3">
          Press{" "}
          <Kbd>⌘</Kbd> <Kbd>
            <CornerDownLeft className="size-2.5" />
          </Kbd>{" "}
          to create the ticket from anywhere in the form.
        </p>
      </aside>
    </form>
  );
}

function TabButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "press rounded-[6px] px-2 py-1 text-[11.5px] font-medium transition-colors duration-150 disabled:opacity-40",
        active
          ? "bg-surface-solid text-label shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          : "text-label-2 hover:text-label",
      )}
    >
      {children}
    </button>
  );
}

function TagEditor({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = React.useState("");

  function addTag(value: string) {
    const next = value.trim().replace(/^#/, "").toLowerCase();
    if (!next || tags.includes(next) || tags.length >= 8) return;
    onChange([...tags, next]);
    setDraft("");
  }

  return (
    <div>
      <p className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.055em] text-label-3">
        Tags
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex h-6 items-center gap-1 rounded-full bg-fill pl-2 pr-1 text-[11px] font-medium text-label-2"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(tags.filter((item) => item !== tag))}
              className="press inline-flex size-4 items-center justify-center rounded-full text-label-3 hover:bg-fill-strong hover:text-label"
            >
              <X className="size-2.5" />
            </button>
          </span>
        ))}
        {tags.length < 8 && (
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTag(draft);
              }
              if (event.key === "Backspace" && !draft && tags.length > 0) {
                onChange(tags.slice(0, -1));
              }
            }}
            onBlur={() => addTag(draft)}
            placeholder={tags.length === 0 ? "Add a tag…" : "Add"}
            className="h-6 min-w-[70px] flex-1 rounded-[6px] bg-transparent px-1 text-[11.5px] text-label outline-none placeholder:text-label-3"
          />
        )}
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Plus />}
      {pending ? "Creating…" : "Create ticket"}
      {!pending && (
        <Kbd className="ml-0.5 border-white/20 bg-white/10 text-white/70">⌘⏎</Kbd>
      )}
    </Button>
  );
}
