import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/login-form";
import { authOptions } from "@/lib/auth";

type LoginPageProps = {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams?.callbackUrl || "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--card-bg-strong)] p-8 shadow-[var(--shadow-md)]">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            SIMON PST
          </p>
          <h1 className="text-3xl font-bold">Masuk ke sistem</h1>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Gunakan akun Admin, Supervisor, atau Pimpinan yang sudah dibuat oleh
            admin sistem.
          </p>
        </div>

        <LoginForm callbackUrl={callbackUrl} />
      </section>
    </main>
  );
}
