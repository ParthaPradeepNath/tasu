"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

export function CreatedToast({
  ticketKey,
  created,
}: {
  ticketKey: string;
  created: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!created) return;
    toast.success(`Ticket ${ticketKey} created`, {
      description: "IT has been notified and will reply shortly.",
    });
    router.replace(pathname, { scroll: false });
  }, [created, pathname, router, ticketKey]);

  return null;
}
