"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  CircleDot,
  Ellipsis,
  Loader2,
  RotateCcw,
  UserRoundPlus,
  Clock,
  XCircle,
} from "lucide-react";
import type { TicketStatus } from "@/generated/prisma/enums";
import { updateTicket } from "@/app/app/actions";
import { useWebHaptics } from "@/hooks/use-web-haptics";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TicketActions({
  ticketId,
  status,
  assigneeId,
  viewerId,
  staff,
}: {
  ticketId: string;
  status: TicketStatus;
  assigneeId: string | null;
  viewerId: string;
  staff: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const { triggerHaptic } = useWebHaptics();

  function change(payload: Record<string, string>, message: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("ticketId", ticketId);
      for (const [key, value] of Object.entries(payload)) {
        formData.set(key, value);
      }
      const result = await updateTicket({ error: null }, formData);
      if (result.error) {
        triggerHaptic("error");
        toast.error(result.error);
        return;
      }
      triggerHaptic("success");
      toast.success(message);
      router.refresh();
    });
  }

  if (!staff) {
    if (status === "RESOLVED") {
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="md"
            disabled={pending}
            onClick={() => change({ status: "OPEN" }, "Reopened — IT will take another look.")}
          >
            <RotateCcw />
            Still broken
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={pending}
            onClick={() =>
              change({ status: "CLOSED" }, "Confirmed. Ticket closed — thanks!")
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : <Check />}
            Confirm fix
          </Button>
        </div>
      );
    }

    if (status === "CLOSED") {
      return (
        <Button
          variant="secondary"
          size="md"
          disabled={pending}
          onClick={() => change({ status: "OPEN" }, "Reopened — IT will take another look.")}
        >
          <RotateCcw />
          Reopen
        </Button>
      );
    }

    return (
      <Button
        variant="primary"
        size="md"
        onClick={() => {
          const composer = document.getElementById("reply-body");
          composer?.focus();
        }}
      >
        <CircleDot />
        Reply
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {assigneeId !== viewerId && (
        <Button
          variant="secondary"
          size="md"
          disabled={pending}
          onClick={() =>
            change(
              { assigneeId: viewerId },
              "Assigned to you. It's in your queue now.",
            )
          }
        >
          <UserRoundPlus />
          Assign to me
        </Button>
      )}
      {status !== "RESOLVED" && status !== "CLOSED" ? (
        <Button
          variant="primary"
          size="md"
          disabled={pending}
          onClick={() =>
            change({ status: "RESOLVED" }, "Resolved. The requester has been asked to confirm.")
          }
        >
          {pending ? <Loader2 className="animate-spin" /> : <Check />}
          Resolve
        </Button>
      ) : (
        <Button
          variant="secondary"
          size="md"
          disabled={pending}
          onClick={() => change({ status: "OPEN" }, "Reopened.")}
        >
          <RotateCcw />
          Reopen
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" aria-label="More ticket actions">
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[212px]">
          <DropdownMenuLabel>Ticket</DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() =>
              change(
                { status: "WAITING_ON_USER" },
                "Marked waiting on the requester.",
              )
            }
          >
            <Clock className="size-3.5" />
            Waiting on requester
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              change({ status: "IN_PROGRESS" }, "Moved to in progress.")
            }
          >
            <CircleDot className="size-3.5" />
            In progress
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => change({ status: "CLOSED" }, "Ticket closed.")}
          >
            <XCircle className="size-3.5" />
            Close ticket
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
