import { redirect } from "next/navigation";

import { getViewer } from "@/lib/session";

export default async function RootPage() {
  const viewer = await getViewer();
  redirect(viewer ? "/app" : "/login");
}
