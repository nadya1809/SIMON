export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-3xl rounded-[var(--radius-card)] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(247,250,253,0.97))] p-10 shadow-[var(--shadow-md)]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            SIMON PST
          </p>
          <h1 className="text-4xl font-bold text-[var(--foreground)]">
            Fondasi proyek sudah siap untuk fase implementasi.
          </h1>
          <p className="text-base leading-7 text-[var(--muted)]">
            Aplikasi ini akan digunakan untuk monitoring penilaian harian,
            dashboard kinerja, evaluasi, reward, punishment, serta pelaporan
            petugas PST dalam satu kantor BPS.
          </p>
        </div>
      </section>
    </main>
  );
}
