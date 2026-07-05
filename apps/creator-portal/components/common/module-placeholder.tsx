import Link from 'next/link';

type ModulePlaceholderProps = {
  title: string;
  description: string;
};

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <div className="border-border/60 bg-card/40 flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
      <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-[0.2em]">
        Coming in a later phase
      </p>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-md text-sm">{description}</p>
      <Link
        href="/studio/dashboard"
        className="text-primary mt-6 text-sm font-medium hover:underline"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
