import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getViewer } from "@/lib/session";

export async function GET(request: Request) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in to search." } },
      { status: 401 },
    );
  }

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ tickets: [], articles: [] });
  }

  const isStaff = viewer.role !== "employee";

  const [tickets, articles] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        deletedAt: null,
        ...(isStaff ? {} : { requesterId: viewer.id }),
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { key: { contains: q, mode: "insensitive" } },
          { tags: { has: q.toLowerCase() } },
        ],
      },
      orderBy: { lastActivityAt: "desc" },
      take: 6,
      select: { id: true, key: true, title: true, status: true },
    }),
    prisma.knowledgeArticle.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { tags: { has: q.toLowerCase() } },
        ],
      },
      orderBy: { views: "desc" },
      take: 5,
      select: { id: true, slug: true, title: true },
    }),
  ]);

  return NextResponse.json({ tickets, articles });
}
