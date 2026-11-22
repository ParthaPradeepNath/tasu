"use client";

import * as React from "react";
import { useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CornerDownLeft,
  Loader2,
  Lock,
  MessageSquare,
  Send,
} from "lucide-react";
import type { ReplyType } from "@/generated/prisma/enums";
import { addReply } from "@/app/app/actions";
import { relativeTime } from "@/lib/dates";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

export type ThreadReply = {
  id: string;
  body: string;
  isInternal: boolean;
  type: ReplyType;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarColor: string | null;
    role: string;
    title: string | null;
  };
};

type DisplayReply = ThreadReply & { pending?: boolean };
type PendingReply = ThreadReply & { pending: true };

export function TicketThread({
  ticketId,
  description,
  requester,
  replies,
  viewer,
  staff,
  locked,
}: {
  ticketId: string;
  description: string;
  requester: {
    name: string;
    avatarColor: string | null;
    title: string | null;
    department: string | null;
    createdAt: string;
  };
  replies: ThreadReply[];
  viewer: { id: string; name: string; avatarColor: string | null; role: string };
  staff: boolean;
  locked: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [internal, setInternal] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [optimisticReplies, addOptimisticReply] = useOptimistic<DisplayReply[], PendingReply>(
    replies,
    (state, reply) => [...state, reply],
  );

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;

    const payload = new FormData();
    payload.set("ticketId", ticketId);
    payload.set("body", trimmed);
    payload.set("isInternal", String(internal));

    setSending(true);
    addOptimisticReply({
      id: `pending-${Date.now()}`,
      body: trimmed,
      isInternal: internal,
      type: "REPLY",
      createdAt: new Date().toISOString(),
      author: {
        id: viewer.id,
        name: viewer.name,
        avatarColor: viewer.avatarColor,
        role: viewer.role,
        title: null,
      },
      pending: true,
    });

    const result = await addReply({ error: null }, payload);
    setSending(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setBody("");
    setInternal(false);
    toast.success(internal ? "Internal note added." : "Reply sent.");
    router.refresh();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <div>
      <ol className="space-y-5">
        <li className="flex gap-3">
          <Avatar
            name={requester.name}
            color={requester.avatarColor}
            size={30}
            className="mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-[12.5px] font-semibold text-label">
                {requester.name}
              </span>
              {requester.title && (
                <span className="text-[11px] text-label-3">
                  {requester.title}
                  {requester.department ? ` · ${requester.department}` : ""}
                </span>
              )}
              <span className="text-[11px] text-label-3" suppressHydrationWarning>
                opened {relativeTime(requester.createdAt)}
              </span>
            </div>
            <div className="mt-2 rounded-[12px] border border-separator bg-surface-solid px-4 py-3 shadow-[var(--shadow-card)]">
              <Markdown>{description}</Markdown>
            </div>
          </div>
        </li>

        {optimisticReplies.map((reply) => {
          if (reply.type === "SYSTEM") {
            return (
              <li
                key={reply.id}
                className={cn(
                  "flex items-center gap-2 pl-1 text-[11.5px] text-label-3",
                  reply.pending && "opacity-60",
                )}
              >
                <span className="size-1.5 shrink-0 rounded-full bg-label-3/60" />
                <span className="text-label-2">{reply.body}</span>
                <span aria-hidden>·</span>
                <time dateTime={reply.createdAt} suppressHydrationWarning>
                  {relativeTime(reply.createdAt)}
                </time>
              </li>
            );
          }

          const own = reply.author.id === viewer.id;

          return (
            <li
              key={reply.id}
              className={cn(
                "flex gap-3",
                reply.pending && "opacity-60",
              )}
            >
              <Avatar
                name={reply.author.name}
                color={reply.author.avatarColor}
                size={30}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-[12.5px] font-semibold text-label">
                    {reply.author.name}
                  </span>
                  {reply.author.role !== "employee" && (
                    <span className="rounded-[4px] bg-fill px-1 py-px text-[9.5px] font-medium uppercase tracking-[0.04em] text-label-3">
                      IT
                    </span>
                  )}
                  {own && (
                    <span className="text-[10.5px] text-label-3">you</span>
                  )}
                  <span className="text-[11px] text-label-3" suppressHydrationWarning>
                    {reply.pending ? "sending…" : relativeTime(reply.createdAt)}
                  </span>
                  {reply.isInternal && (
                    <span className="inline-flex items-center gap-1 rounded-[4px] bg-warning-soft px-1.5 py-px text-[9.5px] font-medium uppercase tracking-[0.04em] text-warning">
                      <Lock className="size-2.5" />
                      Internal
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    "mt-2 rounded-[12px] border px-4 py-3",
                    reply.isInternal
                      ? "border-warning/20 border-l-2 border-l-warning bg-warning-soft/40"
                      : "border-separator bg-surface-solid shadow-[var(--shadow-card)]",
                  )}
                >
                  <Markdown>{reply.body}</Markdown>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="sticky bottom-4 mt-6">
        <div
          className={cn(
            "surface-card overflow-clip transition-[border-color,box-shadow] duration-100",
            internal && "border-warning/30 shadow-[0_0_0_3px_var(--warning-soft)]",
          )}
        >
          <div className="flex items-center gap-2 border-b border-separator px-3 py-1.5">
            <MessageSquare className="size-3.5 text-label-3" />
            <span className="text-[11px] font-medium text-label-2">
              {locked
                ? "This ticket is closed"
                : internal
                  ? "Internal note — only IT can see this"
                  : "Reply to the requester"}
            </span>
            {staff && !locked && (
              <button
                type="button"
                onClick={() => setInternal((value) => !value)}
                aria-pressed={internal}
                className={cn(
                  "press ml-auto inline-flex h-6 items-center gap-1 rounded-full px-2 text-[10.5px] font-medium transition-colors",
                  internal
                    ? "bg-warning-soft text-warning"
                    : "text-label-3 hover:bg-fill hover:text-label",
                )}
              >
                <Lock className="size-2.5" />
                {internal ? "Internal" : "Note"}
              </button>
            )}
          </div>
          <label htmlFor="reply-body" className="sr-only">
            Reply
          </label>
          <textarea
            id="reply-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={locked}
            rows={3}
            placeholder={
              locked
                ? "Reopen the ticket to continue the conversation."
                : internal
                  ? "Leave a note for the IT team…"
                  : "Write a reply… Markdown supported."
            }
            className="min-h-[84px] w-full resize-none bg-transparent px-4 py-3 text-[13px] leading-6 text-label outline-none placeholder:text-label-3 disabled:opacity-50"
          />
          <div className="flex items-center gap-2 border-t border-separator px-3 py-2">
            <span className="hidden items-center gap-1 text-[10.5px] text-label-3 sm:flex">
              <Kbd>⌘</Kbd>
              <Kbd>
                <CornerDownLeft className="size-2.5" />
              </Kbd>
              to send
            </span>
            <div className="ml-auto flex items-center gap-2">
              {body.trim() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBody("")}
                  disabled={sending}
                >
                  Discard
                </Button>
              )}
              <Button
                variant={internal ? "secondary" : "primary"}
                size="md"
                onClick={() => void submit()}
                disabled={!body.trim() || sending || locked}
              >
                {sending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send />
                )}
                {internal ? "Add note" : "Reply"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
