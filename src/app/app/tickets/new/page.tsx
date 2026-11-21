import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireViewer } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { NewTicketForm } from "./new-ticket-form";

export const metadata = {
  title: "New ticket",
};

export default async function NewTicketPage() {
  const viewer = await requireViewer();
  const articles = await prisma.knowledgeArticle.findMany({
    where: { isPublished: true },
    select: { slug: true, title: true, category: true, tags: true },
    orderBy: { views: "desc" },
    take: 60,
  });

  return (
    <div className="mx-auto max-w-[1040px]">
      <Link
        href="/app/tickets"
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-label-2 transition-colors hover:text-label"
      >
        <ArrowLeft className="size-3.5" />
        My tickets
      </Link>

      <PageHeader
        eyebrow="New request"
        title="What's going wrong?"
        description="A clear title and a little detail get you a faster fix. You can add more once IT replies."
      />

      <NewTicketForm
        articles={articles}
        requesterName={viewer.name}
      />
    </div>
  );
}
