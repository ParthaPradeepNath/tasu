import { requireStaff } from "@/lib/session";

import { ArticleEditor } from "../article-editor";

export const metadata = {
  title: "New article",
};

export default async function NewArticlePage() {
  await requireStaff();
  return <ArticleEditor />;
}
