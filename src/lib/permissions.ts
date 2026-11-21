export type Role = "employee" | "agent" | "admin";

export function isStaff(role: string | null | undefined): boolean {
  return role === "agent" || role === "admin";
}

export function asRole(value: string | null | undefined): Role {
  const first = (value ?? "").split(",")[0]?.trim();
  if (first === "agent" || first === "admin") return first;
  return "employee";
}
