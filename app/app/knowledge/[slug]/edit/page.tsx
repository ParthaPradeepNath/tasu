import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { getArticleBySlug } from "@/lib/articles";
import { ArticleEditor } from "../../article-editor";

export const metadata = {
  title: "Edit article",
};

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireStaff();
  const { slug } = await params;
  const article = await getArticleBySlug(slug, true);
  if (!article) notFound();

  return (
    <ArticleEditor
      article={{
        id: article.id,
        slug: article.slug,
        title: article.title,
        body: article.body,
        category: article.category,
        tags: article.tags,
        isPublished: article.isPublished,
      }}
    />
  );
}
