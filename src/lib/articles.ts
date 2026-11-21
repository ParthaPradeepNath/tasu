import type { Category } from "@/generated/prisma/enums";
import { prisma } from "./prisma";

export const ARTICLE_CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  body: true,
  category: true,
  tags: true,
  views: true,
  isPublished: true,
  helpfulCount: true,
  notHelpfulCount: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { name: true, avatarColor: true, title: true } },
} as const;

export type ArticleCard = {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: Category;
  tags: string[];
  views: number;
  isPublished: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: { name: string; avatarColor: string | null; title: string | null };
};

export async function listArticles({
  q,
  category,
  limit = 60,
}: {
  q?: string;
  category?: Category;
  limit?: number;
} = {}) {
  return prisma.knowledgeArticle.findMany({
    where: {
      isPublished: true,
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { body: { contains: q, mode: "insensitive" } },
              { tags: { has: q.toLowerCase() } },
            ],
          }
        : {}),
    },
    select: ARTICLE_CARD_SELECT,
    orderBy: [{ views: "desc" }, { updatedAt: "desc" }],
    take: limit,
  }) as Promise<ArticleCard[]>;
}

export async function getArticleBySlug(slug: string, includeDrafts = false) {
  return prisma.knowledgeArticle.findFirst({
    where: { slug, ...(includeDrafts ? {} : { isPublished: true }) },
    select: ARTICLE_CARD_SELECT,
  }) as Promise<ArticleCard | null>;
}

export async function getArticleCategories() {
  const groups = await prisma.knowledgeArticle.groupBy({
    by: ["category"],
    where: { isPublished: true },
    _count: { _all: true },
  });
  return groups
    .map((group) => ({ category: group.category, count: group._count._all }))
    .sort((a, b) => b.count - a.count);
}

export async function suggestArticles(
  ticket: {
    id: string;
    title: string;
    category: Category;
    tags: string[];
  },
  limit = 2,
) {
  const articles = await prisma.knowledgeArticle.findMany({
    where: { isPublished: true },
    select: {
      slug: true,
      title: true,
      category: true,
      tags: true,
      body: true,
    },
    orderBy: { views: "desc" },
    take: 60,
  });

  const words = ticket.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3);

  return articles
    .map((article) => {
      const haystack = `${article.title} ${article.tags.join(" ")}`.toLowerCase();
      let score = words.reduce(
        (total, word) => total + (haystack.includes(word) ? 2 : 0),
        0,
      );
      if (article.category === ticket.category) score += 2;
      score += article.tags.filter((tag) =>
        ticket.tags.map((value) => value.toLowerCase()).includes(tag.toLowerCase()),
      ).length;
      return { article, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.article);
}
