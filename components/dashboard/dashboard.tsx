import { ChartLineUp, ClockCounterClockwise, Sparkle } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { ActivityList } from "@/components/dashboard/activity-list";
import { FinancialOverview } from "@/components/dashboard/overview";
import { PageHeader } from "@/components/dashboard/page-header";
import { dashboardCopy } from "@/lib/dashboard-data";

const quickActions = [
  { href: "/insights", label: "Review insights", detail: "See unusual spending", Icon: Sparkle },
  { href: "/plan", label: "Test a decision", detail: "Ask a what-if question", Icon: ChartLineUp },
  { href: "/forecast", label: "View the future", detail: "Compare 1, 3, and 5 years", Icon: ClockCounterClockwise },
] as const;

export function FinancialDashboard() {
  return (
    <>
      <PageHeader
        label={dashboardCopy.greeting}
        title="Your money today."
        description="Balances, commitments, and recent activity in one calm daily view."
        action={<span className="inline-flex min-h-10 items-center rounded-xl bg-positive-soft px-3 text-xs font-bold text-positive">All accounts connected</span>}
      />
      <div className="space-y-6 sm:space-y-8">
        <FinancialOverview />
        <section aria-labelledby="quick-actions-title">
          <h2 id="quick-actions-title" className="mb-3 text-lg font-bold tracking-[-0.03em]">What do you want to do?</h2>
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0">
            {quickActions.map(({ href, label, detail, Icon }) => (
              <Link key={href} href={href} className="group min-w-[235px] snap-start rounded-[20px] bg-surface p-4 shadow-soft transition duration-300 ease-app hover:-translate-y-0.5 active:scale-[0.98] sm:min-w-0">
                <span className="grid size-10 place-items-center rounded-[14px] bg-accent-soft text-accent"><Icon aria-hidden="true" size={20} weight="fill" /></span>
                <p className="mt-4 font-bold">{label}</p>
                <p className="mt-1 text-xs font-semibold text-muted">{detail}</p>
              </Link>
            ))}
          </div>
        </section>
        <ActivityList />
      </div>
    </>
  );
}
