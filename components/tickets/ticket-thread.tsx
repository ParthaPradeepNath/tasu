"use client";

import * as React from "react";
import { useOptimistic } from "react";

import { useRouter } from "next/navigation";

import {
  CornerDownLeft,
  Loader2,
  Lock,
  MessageSquare,
  Send,
} from "lucide-react";
import { toast } from "sonner";

import { addReply } from "@/app/app/actions";
import { Markdown } from "@/components/markdown";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import type { ReplyType } from "@/generated/prisma/enums";
import { useWebHaptics } from "@/hooks/use-web-haptics";
import { relativeTime } from "@/lib/dates";
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
  viewer: {
    id: string;
    name: string;
    avatarColor: string | null;
    role: string;
  };
  staff: boolean;
  locked: boolean;
}) {
  const router = useRouter();
  const { triggerHaptic } = useWebHaptics();
  const [body, setBody] = React.useState("");
  const [internal, setInternal] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [optimisticReplies, addOptimisticReply] = useOptimistic<
    DisplayReply[],
    PendingReply
  >(replies, (state, reply) => [...state, reply]);

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
      triggerHaptic("error");
      toast.error(result.error);
      return;
    }

    setBody("");
    setInternal(false);
    triggerHaptic("success");
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
      <ol className="list-enter space-y-5">
        <li className="flex gap-3">
          <Avatar
            name={requester.name}
            color={requester.avatarColor}
            size={30}
            className="mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-label text-[12.5px] font-semibold">
                {requester.name}
              </span>
              {requester.title && (
                <span className="text-label-3 text-[11px]">
                  {requester.title}
                  {requester.department ? ` · ${requester.department}` : ""}
                </span>
              )}
              <span
                className="text-label-3 text-[11px]"
                suppressHydrationWarning
              >
                opened {relativeTime(requester.createdAt)}
              </span>
            </div>
            <div className="border-separator bg-surface-solid mt-2 rounded-[12px] border px-4 py-3 shadow-[var(--shadow-card)]">
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
                  "text-label-3 flex items-center gap-2 pl-1 text-[11.5px]",
                  reply.pending && "opacity-60"
                )}
              >
                <span className="bg-label-3/60 size-1.5 shrink-0 rounded-full" />
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
              className={cn("flex gap-3", reply.pending && "opacity-60")}
            >
              <Avatar
                name={reply.author.name}
                color={reply.author.avatarColor}
                size={30}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-label text-[12.5px] font-semibold">
                    {reply.author.name}
                  </span>
                  {reply.author.role !== "employee" && (
                    <span className="bg-fill text-label-3 rounded-[4px] px-1 py-px text-[9.5px] font-medium tracking-[0.04em] uppercase">
                      IT
                    </span>
                  )}
                  {own && (
                    <span className="text-label-3 text-[10.5px]">you</span>
                  )}
                  <span
                    className="text-label-3 text-[11px]"
                    suppressHydrationWarning
                  >
                    {reply.pending ? "sending…" : relativeTime(reply.createdAt)}
                  </span>
                  {reply.isInternal && (
                    <span className="bg-warning-soft text-warning inline-flex items-center gap-1 rounded-[4px] px-1.5 py-px text-[9.5px] font-medium tracking-[0.04em] uppercase">
                      <Lock className="size-2.5" />
                      Internal
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    "mt-2 rounded-[12px] border px-4 py-3",
                    reply.isInternal
                      ? "border-warning/20 border-l-warning bg-warning-soft/40 border-l-2"
                      : "border-separator bg-surface-solid shadow-[var(--shadow-card)]"
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
            internal &&
              "border-warning/30 shadow-[0_0_0_3px_var(--warning-soft)]"
          )}
        >
          <div className="border-separator flex items-center gap-2 border-b px-3 py-1.5">
            <MessageSquare className="text-label-3 size-3.5" />
            <span className="text-label-2 text-[11px] font-medium">
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
                    : "text-label-3 hover:bg-fill hover:text-label"
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
            className="text-label placeholder:text-label-3 min-h-[84px] w-full resize-none bg-transparent px-4 py-3 text-[13px] leading-6 outline-none disabled:opacity-50"
          />
          <div className="border-separator flex items-center gap-2 border-t px-3 py-2">
            <span className="text-label-3 hidden items-center gap-1 text-[10.5px] sm:flex">
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
                {sending ? <Loader2 className="animate-spin" /> : <Send />}
                {internal ? "Add note" : "Reply"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
