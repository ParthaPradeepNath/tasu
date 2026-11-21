import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  const viewer = await getViewer();
  if (viewer) redirect("/app");

  return (
    <main className="app-canvas relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[-20%] mx-auto h-[560px] w-[900px] max-w-[120vw] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(0,113,227,0.16), rgba(137,68,171,0.07) 55%, transparent 78%)",
        }}
      />
      <LoginForm />
    </main>
  );
}
