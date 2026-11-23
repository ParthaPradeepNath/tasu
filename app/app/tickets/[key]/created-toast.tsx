"use client";

import * as React from "react";

import { usePathname, useRouter } from "next/navigation";

import { toast } from "sonner";

import { useWebHaptics } from "@/hooks/use-web-haptics";

export function CreatedToast({
  ticketKey,
  created,
}: {
  ticketKey: string;
  created: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { triggerHaptic } = useWebHaptics();

  React.useEffect(() => {
    if (!created) return;
    triggerHaptic("success");
    toast.success(`Ticket ${ticketKey} created`, {
      description: "IT has been notified and will reply shortly.",
    });
    router.replace(pathname, { scroll: false });
  }, [created, pathname, router, ticketKey, triggerHaptic]);

  return null;
}
