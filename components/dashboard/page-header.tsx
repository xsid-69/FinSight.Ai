import type { ReactNode } from "react";

interface PageHeaderProps {
  label: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ label, title, description, action }: PageHeaderProps) {
  return (
    <header className="app-enter mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-bold text-accent">{label}</p>
        <h1 className="mt-1.5 max-w-2xl text-balance text-[2rem] font-bold leading-[1.08] tracking-[-0.055em] sm:text-[2.65rem]">{title}</h1>
        <p className="mt-2 max-w-2xl text-pretty text-sm leading-6 text-muted sm:text-base">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
