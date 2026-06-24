import { Badge } from "@/components/ui/badge";

type PageHeaderProps = {
  title: string;
  description: string;
  role: string;
};

export function PageHeader({ title, description, role }: PageHeaderProps) {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="default">SIMON PST</Badge>
        <span className="text-sm text-[var(--muted)]">{role}</span>
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.02em] text-[var(--foreground)]">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--muted)]">
          {description}
        </p>
      </div>
    </header>
  );
}
