"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import Link from "next/link";

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
import { motion, useReducedMotion } from "motion/react";

import { type ActionState, saveArticle } from "@/app/app/actions";
import { GlassBadge } from "@/components/liquid-glass";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  PropertySelect,
  type SelectOption,
} from "@/components/ui/property-select";
import type { Category } from "@/generated/prisma/enums";
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/status";
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
    article?.category ?? "OTHER"
  );
  const [tags, setTags] = React.useState<string[]>(article?.tags ?? []);
  const [published, setPublished] = React.useState(
    article?.isPublished ?? true
  );
  const [mode, setMode] = React.useState<"write" | "preview">("write");
  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        const form = document.getElementById(
          "article-form"
        ) as HTMLFormElement | null;
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
          className="text-label-2 hover:text-label inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors"
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
              href={
                article ? `/app/knowledge/${article.slug}` : "/app/knowledge"
              }
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
              className="text-label placeholder:text-label-3 w-full bg-transparent text-[22px] leading-7 font-semibold tracking-[-0.025em] outline-none"
            />
            <div className="text-label-3 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
              <Pencil className="size-3 shrink-0" />
              <span className="min-w-0 truncate">
                {article
                  ? "Editing an existing guide"
                  : "New guide · visible to everyone once published"}
              </span>
              <span className="num ml-auto shrink-0">{title.length}/160</span>
            </div>
          </div>

          <div className="border-separator bg-surface-sunken/40 mt-4 flex items-center gap-1 border-y px-4 py-1.5">
            <TabButton
              active={mode === "write"}
              onClick={() => setMode("write")}
            >
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
            <span className="text-label-3 ml-auto hidden items-center gap-1 text-[10.5px] sm:flex">
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
                placeholder={
                  "## Overview\n\nExplain the fix in a sentence.\n\n## Steps\n\n1. …\n2. …"
                }
                required
                minLength={40}
                className="text-label placeholder:text-label-3 min-h-[430px] w-full resize-y bg-transparent px-5 py-4 font-mono text-[12.5px] leading-6 outline-none"
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
              className="bg-danger-soft text-danger mx-5 mb-4 flex items-start gap-2 rounded-[9px] px-3 py-2.5 text-[12px] leading-4"
            >
              <TriangleAlert className="mt-px size-3.5 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-[76px] lg:max-h-[calc(100dvh-92px)] lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">
          <div className="surface-card overflow-clip">
            <header className="border-separator flex h-10 items-center border-b px-3.5">
              <h2 className="text-label m-0 text-[12px] font-semibold">
                Properties
              </h2>
            </header>
            <div className="space-y-3 p-3.5">
              <div>
                <p className="text-label-3 mb-1.5 text-[10.5px] font-medium tracking-[0.055em] uppercase">
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

              <div className="border-separator border-t pt-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-label m-0 text-[12px] font-medium">
                      Published
                    </p>
                    <p className="text-label-3 m-0 mt-0.5 text-[10.5px] leading-4">
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
                      published ? "bg-success" : "bg-fill-strong"
                    )}
                  >
                    <motion.span
                      initial={false}
                      animate={{
                        transform: `translateX(${published ? 16 : 0}px)`,
                      }}
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 800, damping: 42 }
                      }
                      className="absolute top-[2px] left-[2px] size-[18px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card p-3.5">
            <div className="flex items-center gap-2">
              <span className="bg-accent-soft text-accent inline-flex size-7 items-center justify-center rounded-[8px]">
                <Sparkles className="size-3.5" />
              </span>
              <p className="text-label m-0 text-[12px] font-medium">
                What makes a good guide
              </p>
            </div>
            <ul className="text-label-3 mt-2.5 space-y-1.5 text-[11px] leading-4">
              <li className="flex gap-1.5">
                <Check className="text-success mt-0.5 size-3 shrink-0" />
                Title it the way someone would ask the question.
              </li>
              <li className="flex gap-1.5">
                <Check className="text-success mt-0.5 size-3 shrink-0" />
                Lead with the fix, then the detail.
              </li>
              <li className="flex gap-1.5">
                <Check className="text-success mt-0.5 size-3 shrink-0" />
                Number the steps and name the menus.
              </li>
              <li className="flex gap-1.5">
                <Check className="text-success mt-0.5 size-3 shrink-0" />
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
          : "text-label-2 hover:text-label"
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
      <p className="text-label-3 mb-1.5 text-[10.5px] font-medium tracking-[0.055em] uppercase">
        Tags
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-fill text-label-2 inline-flex h-6 items-center gap-1 rounded-full pr-1 pl-2 text-[11px] font-medium"
          >
            <span className="max-w-[180px] truncate">{tag}</span>
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(tags.filter((item) => item !== tag))}
              className="press text-label-3 hover:bg-fill-strong hover:text-label inline-flex size-4 items-center justify-center rounded-full"
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
            className="text-label placeholder:text-label-3 h-6 min-w-[70px] flex-1 rounded-[6px] bg-transparent px-1 text-[11.5px] outline-none"
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
