"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  Check,
  CornerDownLeft,
  Eye,
  Loader2,
  Pencil,
  Save,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import type { Category } from "@/generated/prisma/enums";
import { saveArticle, type ActionState } from "@/app/app/actions";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { GlassBadge } from "@/components/liquid-glass";
import { Kbd } from "@/components/ui/kbd";
import { PropertySelect, type SelectOption } from "@/components/ui/property-select";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

type EditableArticle = {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: Category;
  tags: string[];
  isPublished: boolean;
};

const initialState: ActionState = { error: null };

const CATEGORY_OPTIONS: SelectOption[] = CATEGORY_ORDER.map((category) => ({
  value: category,
  label: CATEGORY_META[category].label,
}));

export function ArticleEditor({ article }: { article?: EditableArticle }) {
  const reduced = useReducedMotion();
  const [state, formAction] = useActionState(saveArticle, initialState);
  const [title, setTitle] = React.useState(article?.title ?? "");
  const [body, setBody] = React.useState(article?.body ?? "");
  const [category, setCategory] = React.useState<Category>(
    article?.category ?? "OTHER",
  );
  const [tags, setTags] = React.useState<string[]>(article?.tags ?? []);
  const [published, setPublished] = React.useState(
    article?.isPublished ?? true,
  );
  const [mode, setMode] = React.useState<"write" | "preview">("write");
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        const form = document.getElementById("article-form") as HTMLFormElement | null;
        form?.requestSubmit();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <form
      id="article-form"
      action={formAction}
      className="mx-auto max-w-[1080px]"
    >
      <input type="hidden" name="id" value={article?.id ?? ""} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="tags" value={tags.join(",")} />
      <input type="hidden" name="isPublished" value={String(published)} />
      <h1 className="sr-only">
        {article ? `Edit ${article.title}` : "New article"}
      </h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href={article ? `/app/knowledge/${article.slug}` : "/app/knowledge"}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-label-2 transition-colors hover:text-label"
        >
          <ArrowLeft className="size-3.5" />
          {article ? "Back to article" : "Knowledge"}
        </Link>
        <GlassBadge
          tone={published ? "success" : "warning"}
          width={published ? 92 : 60}
          height={20}
          className="align-middle text-[10px]"
        >
          {published ? "Published" : "Draft"}
        </GlassBadge>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="md">
            <Link
              href={article ? `/app/knowledge/${article.slug}` : "/app/knowledge"}
            >
              Cancel
            </Link>
          </Button>
          <SubmitButton published={published} />
        </div>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_268px]">
        <div className="surface-card overflow-clip">
          <div className="px-5 pt-5">
            <label htmlFor="article-title" className="sr-only">
              Article title
            </label>
            <input
              id="article-title"
              name="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What question does this answer?"
              maxLength={160}
              autoFocus
              required
              className="w-full bg-transparent text-[22px] font-semibold leading-7 tracking-[-0.025em] text-label outline-none placeholder:text-label-3"
            />
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-label-3">
              <Pencil className="size-3 shrink-0" />
              <span className="min-w-0 truncate">
                {article
                  ? "Editing an existing guide"
                  : "New guide · visible to everyone once published"}
              </span>
              <span className="num ml-auto shrink-0">{title.length}/160</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1 border-y border-separator bg-surface-sunken/40 px-4 py-1.5">
            <TabButton active={mode === "write"} onClick={() => setMode("write")}>
              Write
            </TabButton>
            <TabButton
              active={mode === "preview"}
              onClick={() => setMode("preview")}
              disabled={!body.trim()}
            >
              <Eye className="size-3" />
              Preview
            </TabButton>
            <span className="ml-auto hidden items-center gap-1 text-[10.5px] text-label-3 sm:flex">
              Markdown supported · <Kbd>⌘</Kbd> <Kbd>⏎</Kbd> to save
            </span>
          </div>

          {mode === "write" ? (
            <div>
              <label htmlFor="article-body" className="sr-only">
                Article body
              </label>
              <textarea
                id="article-body"
                name="body"
                ref={bodyRef}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={"## Overview\n\nExplain the fix in a sentence.\n\n## Steps\n\n1. …\n2. …"}
                required
                minLength={40}
                className="min-h-[430px] w-full resize-y bg-transparent px-5 py-4 font-mono text-[12.5px] leading-6 text-label outline-none placeholder:text-label-3"
              />
            </div>
          ) : (
            <div className="min-h-[430px] px-5 py-4">
              <input type="hidden" name="body" value={body} />
              <Markdown anchors>{body}</Markdown>
            </div>
          )}

          {state.error && (
            <div
              role="alert"
              className="mx-5 mb-4 flex items-start gap-2 rounded-[9px] bg-danger-soft px-3 py-2.5 text-[12px] leading-4 text-danger"
            >
              <TriangleAlert className="mt-px size-3.5 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-[76px] lg:max-h-[calc(100dvh-92px)] lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
          <div className="surface-card overflow-clip">
            <header className="flex h-10 items-center border-b border-separator px-3.5">
              <h2 className="m-0 text-[12px] font-semibold text-label">
                Properties
              </h2>
            </header>
            <div className="space-y-3 p-3.5">
              <div>
                <p className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.055em] text-label-3">
                  Category
                </p>
                <PropertySelect
                  variant="pill"
                  label="Category"
                  value={category}
                  options={CATEGORY_OPTIONS}
                  onChange={(value) => setCategory(value as Category)}
                />
              </div>

              <TagEditor tags={tags} onChange={setTags} />

              <div className="border-t border-separator pt-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="m-0 text-[12px] font-medium text-label">
                      Published
                    </p>
                    <p className="m-0 mt-0.5 text-[10.5px] leading-4 text-label-3">
                      {published
                        ? "Everyone in the workspace can read this."
                        : "Only IT staff can see drafts."}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={published}
                    aria-label="Published"
                    onClick={() => setPublished((value) => !value)}
                    className={cn(
                      "press relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-100",
                      published ? "bg-success" : "bg-fill-strong",
                    )}
                  >
                    <motion.span
                      initial={false}
                      animate={{ transform: `translateX(${published ? 16 : 0}px)` }}
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 800, damping: 42 }
                      }
                      className="absolute left-[2px] top-[2px] size-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card p-3.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex size-7 items-center justify-center rounded-[8px] bg-accent-soft text-accent">
                <Sparkles className="size-3.5" />
              </span>
              <p className="m-0 text-[12px] font-medium text-label">
                What makes a good guide
              </p>
            </div>
            <ul className="mt-2.5 space-y-1.5 text-[11px] leading-4 text-label-3">
              <li className="flex gap-1.5">
                <Check className="mt-0.5 size-3 shrink-0 text-success" />
                Title it the way someone would ask the question.
              </li>
              <li className="flex gap-1.5">
                <Check className="mt-0.5 size-3 shrink-0 text-success" />
                Lead with the fix, then the detail.
              </li>
              <li className="flex gap-1.5">
                <Check className="mt-0.5 size-3 shrink-0 text-success" />
                Number the steps and name the menus.
              </li>
              <li className="flex gap-1.5">
                <Check className="mt-0.5 size-3 shrink-0 text-success" />
                End with what to do if it still fails.
              </li>
            </ul>
          </div>
        </aside>
      </div>
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
        "press inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[11.5px] font-medium transition-colors duration-100 disabled:opacity-40",
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
    if (!next || tags.includes(next) || tags.length >= 10) return;
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
            <span className="max-w-[180px] truncate">{tag}</span>
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
        {tags.length < 10 && (
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

function SubmitButton({ published }: { published: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="primary" size="md" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save />}
      {pending ? "Saving…" : published ? "Save article" : "Save draft"}
      {!pending && (
        <Kbd className="ml-0.5 border-white/20 bg-white/10 text-white/70">
          <CornerDownLeft className="size-2.5" />
        </Kbd>
      )}
    </Button>
  );
}
