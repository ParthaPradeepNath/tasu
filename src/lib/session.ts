import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { asRole, type Role } from "./permissions";

export type Viewer = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  department: string | null;
  title: string | null;
  avatarColor: string | null;
};

export const getViewer = cache(async (): Promise<Viewer | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) return null;

  const user = session.user as typeof session.user & {
    department?: string | null;
    title?: string | null;
    avatarColor?: string | null;
    role?: string | null;
  };

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: asRole(user.role),
    department: user.department ?? null,
    title: user.title ?? null,
    avatarColor: user.avatarColor ?? null,
  };
});

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export async function requireStaff(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (viewer.role === "employee") redirect("/app");
  return viewer;
}
