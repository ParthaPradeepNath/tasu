import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { requireViewer } from "@/lib/session";
import { isStaff } from "@/lib/permissions";
import { listArticles } from "@/lib/articles";
import { PageHeader } from "@/components/ui/page-header";
import { StatStrip } from "@/components/ui/stat-strip";
import { Button } from "@/components/ui/button";
import {
  KnowledgeBrowser,
  type KnowledgeArticleSummary,
} from "./knowledge-browser";

export const metadata = {
  title: "Knowledge",
};

export default async function KnowledgePage() {
  const viewer = await requireViewer();
  const staff = isStaff(viewer.role);
  const articles = await listArticles({ limit: 100 });

  const serialized: KnowledgeArticleSummary[] = articles.map((article) => ({
    slug: article.slug,
    title: article.title,
    body: article.body,
    category: article.category,
    tags: article.tags,
    views: article.views,
    helpfulCount: article.helpfulCount,
    notHelpfulCount: article.notHelpfulCount,
    updatedAt: article.updatedAt.toISOString(),
  }));

  const totalViews = serialized.reduce((total, article) => total + article.views, 0);
  const totalHelpful = serialized.reduce(
    (total, article) => total + article.helpfulCount,
    0,
  );
  const categoryCount = new Set(serialized.map((article) => article.category)).size;
  const featured = [...serialized]
    .sort((a, b) => b.views - a.views)
    .slice(0, 3)
    .map((article) => article.slug);

  return (
    <div>
      <PageHeader
        eyebrow="Help center"
        title="Knowledge"
        description="Answers before tickets. Guides written by IT, for the questions that come up again and again."
        actions={
          staff ? (
            <Button asChild variant="primary" size="md">
              <Link href="/app/knowledge/new">
                <Plus />
                New article
              </Link>
            </Button>
          ) : (
            <Button asChild variant="secondary" size="md">
              <Link href="/app/tickets/new">
                <BookOpen />
                Ask IT instead
              </Link>
            </Button>
          )
        }
      />

      <StatStrip
        columns={4}
        stats={[
          { label: "Articles", value: serialized.length, hint: "Published and current" },
          { label: "Categories", value: categoryCount, hint: "Hardware, access, network…" },
          {
            label: "Total reads",
            value: totalViews.toLocaleString(),
            hint: "Across the whole team",
          },
          {
            label: "Helpful votes",
            value: totalHelpful.toLocaleString(),
            hint: "Readers who found an answer",
            tone: "success",
          },
        ]}
      />

      <div className="mt-5">
        <KnowledgeBrowser articles={serialized} featured={featured} />
      </div>
    </div>
  );
}
